"""数据采集业务逻辑层"""

import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime

from dao.collect_dao import (
    get_collect_platforms,
    get_collect_platform_by_id,
    count_collect_platforms,
    create_collect_platform,
    update_collect_platform,
    delete_collect_platform,
    get_collect_tasks,
    count_collect_tasks,
    get_collect_task_by_id,
    create_collect_task,
    update_collect_task,
    delete_collect_task,
    enable_collect_task,
    disable_collect_task,
    get_collected_items,
    count_collected_items,
    get_collected_item_by_id,
    create_collected_item,
    update_collected_item,
    update_item_status,
    get_collect_logs,
    count_collect_logs,
    create_collect_log,
    check_content_duplicate,
)
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


# ==================== 采集平台管理 ====================


def get_platforms_service(db: Session, status: str = None) -> Dict:
    """获取采集平台列表"""
    platforms = get_collect_platforms(db, status=status)
    total = count_collect_platforms(db)
    return {
        "items": [
            {
                "id": p.id,
                "name": p.name,
                "platform_type": p.platform_type,
                "default_method": p.default_method,
                "config_schema": p.config_schema,
                "description": p.description,
                "status": p.status,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            }
            for p in platforms
        ],
        "total": total,
    }


def get_platform_detail_service(db: Session, platform_id: int) -> Dict:
    """获取采集平台详情"""
    platform = get_collect_platform_by_id(db, platform_id)
    if not platform:
        raise NotFoundException("平台不存在")
    return {
        "id": platform.id,
        "name": platform.name,
        "platform_type": platform.platform_type,
        "default_method": platform.default_method,
        "config_schema": platform.config_schema,
        "description": platform.description,
        "status": platform.status,
        "created_at": platform.created_at,
        "updated_at": platform.updated_at,
    }


def create_platform_service(
    db: Session,
    name: str,
    platform_type: str,
    default_method: str = "api",
    config_schema: Dict = None,
    description: str = None,
) -> Dict:
    """创建采集平台"""
    platform = create_collect_platform(
        db, name, platform_type, default_method, config_schema, description
    )
    logger.info(f"创建采集平台: platform_id={platform.id}, name={name}")
    return {
        "id": platform.id,
        "name": platform.name,
        "platform_type": platform.platform_type,
        "default_method": platform.default_method,
        "description": platform.description,
        "status": platform.status,
        "created_at": platform.created_at,
    }


def update_platform_service(db: Session, platform_id: int, **kwargs) -> Dict:
    """更新采集平台"""
    platform = get_collect_platform_by_id(db, platform_id)
    if not platform:
        raise NotFoundException("平台不存在")
    platform = update_collect_platform(db, platform_id, **kwargs)
    return {
        "id": platform.id,
        "name": platform.name,
        "status": platform.status,
        "updated_at": platform.updated_at,
    }


def delete_platform_service(db: Session, platform_id: int):
    """删除采集平台"""
    platform = get_collect_platform_by_id(db, platform_id)
    if not platform:
        raise NotFoundException("平台不存在")
    delete_collect_platform(db, platform_id)
    logger.info(f"删除采集平台: platform_id={platform_id}")


# ==================== 采集任务管理 ====================


def get_tasks_service(
    db: Session,
    ctx: RequestContext,
    page: int = 1,
    page_size: int = 20,
    status: str = None,
    is_public: bool = None,
) -> Dict:
    """获取采集任务列表"""
    user_id = ctx.user_id if not ctx.is_super_admin else None
    tasks = get_collect_tasks(
        db,
        ctx.tenant_id,
        user_id=user_id,
        status=status,
        is_public=is_public,
        page=page,
        page_size=page_size,
    )
    total = count_collect_tasks(db, ctx.tenant_id, user_id=user_id, status=status)

    task_list = []
    for task in tasks:
        platform = get_collect_platform_by_id(db, task.platform_id)
        task_list.append(
            {
                "id": task.id,
                "tenant_id": task.tenant_id,
                "name": task.name,
                "platform_id": task.platform_id,
                "platform_name": platform.name if platform else "未知",
                "platform_type": platform.platform_type if platform else None,
                "collect_method": task.collect_method,
                "source_url": task.source_url,
                "request_config": task.request_config,
                "parse_rule": task.parse_rule,
                "schedule_config": task.schedule_config,
                "is_public": task.is_public,
                "status": task.status,
                "last_run_at": task.last_run_at,
                "fail_count": task.fail_count or 0,
                "created_by": task.created_by,
                "created_at": task.created_at,
                "updated_at": task.updated_at,
            }
        )

    return {"items": task_list, "total": total, "page": page, "page_size": page_size}


def get_task_detail_service(db: Session, ctx: RequestContext, task_id: int) -> Dict:
    """获取采集任务详情"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")

    if not ctx.is_super_admin and task.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此任务")

    platform = get_collect_platform_by_id(db, task.platform_id)

    return {
        "id": task.id,
        "tenant_id": task.tenant_id,
        "name": task.name,
        "platform_id": task.platform_id,
        "platform_name": platform.name if platform else "未知",
        "platform_type": platform.platform_type if platform else None,
        "collect_method": task.collect_method,
        "source_url": task.source_url,
        "request_config": task.request_config,
        "parse_rule": task.parse_rule,
        "schedule_config": task.schedule_config,
        "is_public": task.is_public,
        "status": task.status,
        "last_run_at": task.last_run_at,
        "fail_count": task.fail_count or 0,
        "created_by": task.created_by,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
    }


def create_task_service(
    db: Session,
    ctx: RequestContext,
    name: str,
    platform_id: int,
    collect_method: str,
    **kwargs,
) -> Dict:
    """创建采集任务"""
    platform = get_collect_platform_by_id(db, platform_id)
    if not platform:
        raise NotFoundException("平台不存在")

    # 如果有定时配置，设置状态为 enabled
    schedule_config = kwargs.get("schedule_config")
    if schedule_config and not kwargs.get("status"):
        kwargs["status"] = "enabled"

    task = create_collect_task(
        db, ctx.tenant_id, name, platform_id, collect_method, ctx.user_id, **kwargs
    )

    # 如果有定时配置，注册到调度器
    if task.schedule_config and task.status == "enabled":
        from service.scheduler_service import add_collect_job

        add_collect_job(task.id, task.schedule_config)

    logger.info(f"创建采集任务: task_id={task.id}, name={name}")

    platform_obj = get_collect_platform_by_id(db, task.platform_id)
    return {
        "id": task.id,
        "name": task.name,
        "platform_id": task.platform_id,
        "platform_name": platform_obj.name if platform_obj else "未知",
        "collect_method": task.collect_method,
        "status": task.status,
        "created_at": task.created_at,
    }


def update_task_service(
    db: Session, ctx: RequestContext, task_id: int, **kwargs
) -> Dict:
    """更新采集任务"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")

    if not ctx.is_super_admin and task.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此任务")

    if not ctx.is_super_admin and task.created_by != ctx.user_id:
        raise ForbiddenException("无权修改此任务")

    task = update_collect_task(db, task_id, **kwargs)

    # 如果更新了定时配置，重新注册调度任务
    if "schedule_config" in kwargs:
        from service.scheduler_service import add_collect_job, remove_collect_job

        if task.schedule_config and task.status == "enabled":
            add_collect_job(task.id, task.schedule_config)
        else:
            remove_collect_job(task.id)

    return {
        "id": task.id,
        "name": task.name,
        "status": task.status,
        "updated_at": task.updated_at,
    }


def delete_task_service(db: Session, ctx: RequestContext, task_id: int):
    """删除采集任务"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")

    if not ctx.is_super_admin and task.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除此任务")

    if not ctx.is_super_admin and task.created_by != ctx.user_id:
        raise ForbiddenException("无权删除此任务")

    # 移除调度任务
    from service.scheduler_service import remove_collect_job

    remove_collect_job(task_id)

    delete_collect_task(db, task_id)
    logger.info(f"删除采集任务: task_id={task_id}")


def enable_task_service(db: Session, ctx: RequestContext, task_id: int):
    """启用采集任务"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")

    if not ctx.is_super_admin and task.created_by != ctx.user_id:
        raise ForbiddenException("无权操作此任务")

    enable_collect_task(db, task_id)

    # 如果有定时配置，注册调度任务
    if task.schedule_config:
        from service.scheduler_service import add_collect_job

        add_collect_job(task_id, task.schedule_config)


def disable_task_service(db: Session, ctx: RequestContext, task_id: int):
    """禁用采集任务"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")

    if not ctx.is_super_admin and task.created_by != ctx.user_id:
        raise ForbiddenException("无权操作此任务")

    disable_collect_task(db, task_id)

    # 移除调度任务
    from service.scheduler_service import remove_collect_job

    remove_collect_job(task_id)


async def run_task_service(db: Session, ctx: RequestContext, task_id: int):
    """手动触发采集任务"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")

    if not ctx.is_super_admin and task.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权操作此任务")

    if not ctx.is_super_admin and task.created_by != ctx.user_id:
        raise ForbiddenException("无权操作此任务")

    if task.status not in ("enabled", "draft", "error"):
        raise BadRequestException("任务状态不允许执行")

    # 异步执行采集
    from service.scheduler_service import execute_collect_task
    import asyncio

    asyncio.create_task(execute_collect_task(task_id))

    logger.info(f"手动触发采集任务: task_id={task_id}")
    return {"message": "采集任务已触发"}


# ==================== 采集数据管理 ====================


def get_items_service(
    db: Session,
    ctx: RequestContext,
    task_id: int = None,
    status: str = None,
    keyword: str = None,
    page: int = 1,
    page_size: int = 50,
) -> Dict:
    """获取采集数据列表"""
    items = get_collected_items(
        db,
        ctx.tenant_id,
        task_id=task_id,
        status=status,
        keyword=keyword,
        page=page,
        page_size=page_size,
    )
    total = count_collected_items(db, ctx.tenant_id, task_id=task_id, status=status)

    item_list = []
    for item in items:
        item_list.append(
            {
                "id": item.id,
                "tenant_id": item.tenant_id,
                "task_id": item.task_id,
                "title": item.title,
                "content": item.content[:200] + "..."
                if item.content and len(item.content) > 200
                else item.content,
                "author": item.author,
                "publish_at": item.publish_at,
                "source_platform": item.source_platform,
                "source_url": item.source_url,
                "raw_content_type": item.raw_content_type,
                "attachments": item.attachments,
                "sentiment": item.sentiment,
                "tags": item.tags,
                "entities": item.entities,
                "is_public": item.is_public,
                "status": item.status,
                "created_at": item.created_at,
            }
        )

    return {"items": item_list, "total": total, "page": page, "page_size": page_size}


def get_item_detail_service(db: Session, ctx: RequestContext, item_id: int) -> Dict:
    """获取采集数据详情（含原文存档）"""
    item = get_collected_item_by_id(db, item_id)
    if not item:
        raise NotFoundException("数据不存在")

    if not ctx.is_super_admin and item.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此数据")

    return {
        "id": item.id,
        "tenant_id": item.tenant_id,
        "task_id": item.task_id,
        "title": item.title,
        "content": item.content,
        "author": item.author,
        "publish_at": item.publish_at,
        "source_platform": item.source_platform,
        "source_url": item.source_url,
        "raw_content": item.raw_content,
        "raw_content_type": item.raw_content_type,
        "attachments": item.attachments,
        "sentiment": item.sentiment,
        "tags": item.tags,
        "entities": item.entities,
        "is_public": item.is_public,
        "status": item.status,
        "created_at": item.created_at,
    }


def update_item_service(
    db: Session, ctx: RequestContext, item_id: int, **kwargs
) -> Dict:
    """更新采集数据"""
    item = get_collected_item_by_id(db, item_id)
    if not item:
        raise NotFoundException("数据不存在")

    if not ctx.is_super_admin and item.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此数据")

    item = update_collected_item(db, item_id, **kwargs)

    return {"id": item.id, "status": item.status, "updated_at": item.updated_at}


def clean_item_service(db: Session, ctx: RequestContext, item_id: int):
    """清洗数据"""
    update_item_status(db, item_id, "cleaned")


def analyze_item_service(db: Session, ctx: RequestContext, item_id: int):
    """分析数据"""
    update_item_status(db, item_id, "analyzed")


# ==================== 采集日志 ====================


def get_logs_service(
    db: Session,
    ctx: RequestContext,
    task_id: int = None,
    status: str = None,
    page: int = 1,
    page_size: int = 50,
) -> Dict:
    """获取采集日志列表"""
    logs = get_collect_logs(
        db,
        ctx.tenant_id,
        task_id=task_id,
        status=status,
        page=page,
        page_size=page_size,
    )
    total = count_collect_logs(db, ctx.tenant_id, task_id=task_id)

    return {
        "items": [
            {
                "id": log.id,
                "tenant_id": log.tenant_id,
                "task_id": log.task_id,
                "run_at": log.run_at,
                "status": log.status,
                "items_count": log.items_count,
                "error_message": log.error_message,
                "duration_seconds": log.duration_seconds,
                "created_at": log.created_at,
            }
            for log in logs
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }
