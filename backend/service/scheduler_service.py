"""采集调度服务 - 集成 APScheduler 实现定时采集"""

import logging
from typing import Optional, Dict, Any
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.jobstores.memory import MemoryJobStore

logger = logging.getLogger(__name__)

# 全局调度器实例
_scheduler: Optional[AsyncIOScheduler] = None


def get_scheduler() -> AsyncIOScheduler:
    """获取调度器实例"""
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(
            jobstores={"default": MemoryJobStore()},
            timezone="Asia/Shanghai",
        )
    return _scheduler


async def start_scheduler():
    """启动调度器"""
    scheduler = get_scheduler()
    if not scheduler.running:
        scheduler.start()
        logger.info("APScheduler 调度器已启动")


async def shutdown_scheduler():
    """关闭调度器"""
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler 调度器已关闭")


def parse_cron_config(schedule_config: Dict[str, Any]) -> Dict[str, Any]:
    """
    解析定时配置为 APScheduler Cron 参数

    schedule_config 支持两种格式:
    1. cron 表达式: {"cron": "0 8 * * *"}  (分 时 日 月 周)
    2. 周期配置: {"interval": "daily", "hour": 8, "minute": 0}
       interval 可选: daily/weekly/monthly
       weekly 时可指定 day_of_week: "mon-fri"
    """
    if not schedule_config:
        return {}

    # 如果直接提供了 cron 表达式
    cron_expr = schedule_config.get("cron")
    if cron_expr:
        parts = cron_expr.strip().split()
        if len(parts) == 5:
            return {
                "minute": parts[0],
                "hour": parts[1],
                "day": parts[2],
                "month": parts[3],
                "day_of_week": parts[4],
            }

    # 周期配置
    interval = schedule_config.get("interval", "daily")
    hour = schedule_config.get("hour", 8)
    minute = schedule_config.get("minute", 0)

    cron_params = {
        "hour": hour,
        "minute": minute,
    }

    if interval == "weekly":
        cron_params["day_of_week"] = schedule_config.get("day_of_week", "mon-fri")
    elif interval == "monthly":
        cron_params["day"] = schedule_config.get("day", 1)

    return cron_params


def add_collect_job(task_id: int, schedule_config: Dict[str, Any]):
    """
    添加定时采集任务到调度器

    Args:
        task_id: 采集任务ID
        schedule_config: 定时配置
    """
    scheduler = get_scheduler()
    job_id = f"collect_task_{task_id}"

    # 先移除已有的同名任务
    remove_collect_job(task_id)

    cron_params = parse_cron_config(schedule_config)
    if not cron_params:
        logger.warning(f"任务 {task_id} 的定时配置无效: {schedule_config}")
        return

    try:
        trigger = CronTrigger(**cron_params)
        scheduler.add_job(
            execute_collect_task,
            trigger=trigger,
            id=job_id,
            args=[task_id],
            replace_existing=True,
            max_instances=1,
            coalesce=True,
        )
        logger.info(f"已添加定时采集任务: task_id={task_id}, cron={cron_params}")
    except Exception as e:
        logger.error(f"添加定时采集任务失败: task_id={task_id}, error={str(e)}")


def remove_collect_job(task_id: int):
    """移除定时采集任务"""
    scheduler = get_scheduler()
    job_id = f"collect_task_{task_id}"
    try:
        existing = scheduler.get_job(job_id)
        if existing:
            scheduler.remove_job(job_id)
            logger.info(f"已移除定时采集任务: task_id={task_id}")
    except Exception as e:
        logger.error(f"移除定时采集任务失败: task_id={task_id}, error={str(e)}")


async def execute_collect_task(task_id: int):
    """
    执行采集任务（由调度器或手动触发调用）

    此函数从数据库获取任务配置并调用 crawler_service 执行采集，
    结果写入 collected_items 表，同时记录 collect_logs。
    """
    from database.session import Session
    from dao.collect_dao import (
        get_collect_task_by_id,
        get_collect_platform_by_id,
        create_collected_item,
        check_content_duplicate,
        create_collect_log,
        increment_fail_count,
        reset_fail_count,
    )
    from service.crawler_service import (
        crawl_with_crawl4ai,
        crawl_rss,
        crawl_api,
        generate_content_hash,
    )

    db = Session()
    try:
        task = get_collect_task_by_id(db, task_id)
        if not task or task.deleted_at:
            logger.warning(f"采集任务不存在或已删除: task_id={task_id}")
            return

        if task.status != "enabled":
            logger.warning(f"采集任务未启用: task_id={task_id}, status={task.status}")
            return

        platform = get_collect_platform_by_id(db, task.platform_id)
        platform_name = platform.name if platform else "未知"
        platform_type = platform.platform_type if platform else "unknown"

        run_at = datetime.now()

        # 根据采集方式选择采集引擎
        if task.collect_method == "api":
            result = await crawl_api(task.source_url, task.request_config)
        elif task.collect_method == "rss":
            result = await crawl_rss(task.source_url, task.request_config)
        else:  # crawler
            result = await crawl_with_crawl4ai(
                task.source_url, task.request_config, task.parse_rule
            )

        # 处理采集结果
        if not result["success"]:
            # 采集失败
            increment_fail_count(db, task_id)
            create_collect_log(
                db,
                task.tenant_id,
                task_id,
                run_at,
                status="failed",
                items_count=0,
                error_message=result.get("error", "采集失败"),
                duration_seconds=result.get("duration_seconds"),
            )
            logger.error(
                f"采集任务执行失败: task_id={task_id}, error={result.get('error')}"
            )
            return

        # 处理采集到的数据
        items_count = 0
        for item_data in result.get("items", []):
            # 提取字段
            title = item_data.get("title", "")
            content = (
                item_data.get("content", "")
                or item_data.get("body", "")
                or item_data.get("text", "")
            )
            author = item_data.get("author", "")
            publish_at_str = (
                item_data.get("publish_at", "")
                or item_data.get("publish_time", "")
                or item_data.get("date", "")
            )

            # 内容去重
            content_text = content or title or ""
            if not content_text:
                continue

            content_hash = generate_content_hash(content_text)
            existing = check_content_duplicate(db, task.tenant_id, content_hash)
            if existing:
                continue

            # 解析发布时间
            publish_at = None
            if publish_at_str:
                try:
                    from dateutil.parser import parse as parse_date

                    publish_at = parse_date(publish_at_str)
                except Exception:
                    pass

            # 保存原始内容
            raw_content = result.get("html", "") or result.get("raw_content", "") or ""
            raw_content_type = result.get("raw_content_type", "html")
            if not raw_content and result.get("markdown"):
                raw_content = result["markdown"]
                raw_content_type = "markdown"

            # 提取附件（图片链接等）
            attachments = []
            links = result.get("links", [])
            if links:
                for link in links[:10]:
                    if any(
                        ext in link.lower()
                        for ext in (".jpg", ".jpeg", ".png", ".gif", ".webp")
                    ):
                        attachments.append({"type": "image", "url": link})

            create_collected_item(
                db,
                task.tenant_id,
                task_id,
                title=title,
                content=content[:50000] if content else None,  # 限制正文长度
                author=author,
                publish_at=publish_at,
                source_platform=platform_name,
                source_url=task.source_url,
                raw_content=raw_content[:200000]
                if raw_content
                else None,  # 限制原始内容长度
                raw_content_type=raw_content_type,
                content_hash=content_hash,
                attachments=attachments if attachments else None,
                is_public=task.is_public,
                status="raw",
            )
            items_count += 1

        # 采集成功，重置失败计数
        reset_fail_count(db, task_id)
        create_collect_log(
            db,
            task.tenant_id,
            task_id,
            run_at,
            status="success" if items_count > 0 else "partial",
            items_count=items_count,
            duration_seconds=result.get("duration_seconds"),
        )
        logger.info(f"采集任务执行成功: task_id={task_id}, items={items_count}")

    except Exception as e:
        logger.error(f"采集任务执行异常: task_id={task_id}, error={str(e)}")
        try:
            increment_fail_count(db, task_id)
            create_collect_log(
                db,
                task.tenant_id,
                task_id,
                datetime.now(),
                status="failed",
                items_count=0,
                error_message=str(e)[:500],
            )
        except Exception:
            pass
    finally:
        db.close()


async def load_scheduled_tasks():
    """启动时从数据库加载所有启用的定时采集任务"""
    from database.session import Session
    from dao.collect_dao import get_enabled_scheduled_tasks

    db = Session()
    try:
        tasks = get_enabled_scheduled_tasks(db)
        for task in tasks:
            if task.schedule_config:
                add_collect_job(task.id, task.schedule_config)
        logger.info(f"已加载 {len(tasks)} 个定时采集任务")
    except Exception as e:
        logger.error(f"加载定时采集任务失败: {str(e)}")
    finally:
        db.close()
