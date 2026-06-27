"""数据采集业务逻辑层"""
import logging
import hashlib
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime

from dao.collect_dao import (
    get_collect_platforms, get_collect_platform_by_id, create_collect_platform,
    get_collect_tasks, count_collect_tasks, get_collect_task_by_id,
    create_collect_task, update_collect_task, delete_collect_task,
    enable_collect_task, disable_collect_task,
    get_collected_items, count_collected_items, get_collected_item_by_id,
    create_collected_item, update_collected_item, update_item_status,
    get_collect_logs, create_collect_log, check_content_duplicate
)
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext
from model.user import User

logger = logging.getLogger(__name__)


# 采集平台管理
def get_platforms_service(db: Session) -> List[Dict]:
    """获取采集平台列表"""
    platforms = get_collect_platforms(db)
    return [
        {
            "id": p.id,
            "name": p.name,
            "platform_type": p.platform_type,
            "default_method": p.default_method,
            "config_schema": p.config_schema
        }
        for p in platforms
    ]


def create_platform_service(db: Session, name: str, platform_type: str,
                            default_method: str = "api", config_schema: Dict = None) -> Dict:
    """创建采集平台（管理员功能）"""
    platform = create_collect_platform(db, name, platform_type, default_method, config_schema)
    logger.info(f"创建采集平台: platform_id={platform.id}, name={name}")
    
    return {
        "id": platform.id,
        "name": platform.name,
        "platform_type": platform.platform_type,
        "created_at": platform.created_at
    }


# 采集任务管理
def get_tasks_service(db: Session, ctx: RequestContext, page: int = 1, 
                      page_size: int = 20, is_public: bool = None) -> Dict:
    """获取采集任务列表"""
    # 用户可以查看自己创建的任务和公开任务
    tasks = get_collect_tasks(db, ctx.tenant_id, ctx.user_id if not ctx.is_super_admin else None, 
                              is_public, page, page_size)
    total = count_collect_tasks(db, ctx.tenant_id, ctx.user_id if not ctx.is_super_admin else None)
    
    task_list = []
    for task in tasks:
        platform = get_collect_platform_by_id(db, task.platform_id)
        task_list.append({
            "id": task.id,
            "name": task.name,
            "platform_name": platform.name if platform else "未知",
            "collect_method": task.collect_method,
            "status": task.status,
            "is_public": task.is_public,
            "last_run_at": task.last_run_at,
            "created_at": task.created_at
        })
    
    return {
        "items": task_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_task_detail_service(db: Session, ctx: RequestContext, task_id: int) -> Dict:
    """获取采集任务详情"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")
    
    # 权限检查：只能查看自己创建的任务或公开任务
    if not ctx.is_super_admin and task.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此任务")
    
    if not ctx.is_super_admin and task.created_by != ctx.user_id and not task.is_public:
        raise ForbiddenException("无权访问此任务")
    
    platform = get_collect_platform_by_id(db, task.platform_id)
    
    return {
        "id": task.id,
        "name": task.name,
        "platform": {
            "id": platform.id,
            "name": platform.name,
            "platform_type": platform.platform_type
        } if platform else None,
        "collect_method": task.collect_method,
        "source_url": task.source_url,
        "request_config": task.request_config,
        "parse_rule": task.parse_rule,
        "schedule_config": task.schedule_config,
        "is_public": task.is_public,
        "status": task.status,
        "last_run_at": task.last_run_at
    }


def create_task_service(db: Session, ctx: RequestContext, name: str, platform_id: int,
                        collect_method: str, **kwargs) -> Dict:
    """创建采集任务"""
    # 检查平台是否存在
    platform = get_collect_platform_by_id(db, platform_id)
    if not platform:
        raise NotFoundException("平台不存在")
    
    task = create_collect_task(
        db, ctx.tenant_id, name, platform_id, collect_method, ctx.user_id, **kwargs
    )
    
    logger.info(f"创建采集任务: task_id={task.id}, name={name}")
    
    return {
        "id": task.id,
        "name": task.name,
        "status": task.status,
        "created_at": task.created_at
    }


def update_task_service(db: Session, ctx: RequestContext, task_id: int, **kwargs) -> Dict:
    """更新采集任务"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")
    
    # 权限检查
    if not ctx.is_super_admin and task.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此任务")
    
    if not ctx.is_super_admin and task.created_by != ctx.user_id:
        raise ForbiddenException("无权修改此任务")
    
    task = update_collect_task(db, task_id, **kwargs)
    
    return {
        "id": task.id,
        "name": task.name,
        "updated_at": task.updated_at
    }


def delete_task_service(db: Session, ctx: RequestContext, task_id: int):
    """删除采集任务"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")
    
    # 权限检查
    if not ctx.is_super_admin and task.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除此任务")
    
    if not ctx.is_super_admin and task.created_by != ctx.user_id:
        raise ForbiddenException("无权删除此任务")
    
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


def disable_task_service(db: Session, ctx: RequestContext, task_id: int):
    """禁用采集任务"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")
    
    if not ctx.is_super_admin and task.created_by != ctx.user_id:
        raise ForbiddenException("无权操作此任务")
    
    disable_collect_task(db, task_id)


# 采集数据管理
def get_items_service(db: Session, ctx: RequestContext, task_id: int = None,
                      status: str = None, page: int = 1, page_size: int = 50) -> Dict:
    """获取采集数据列表"""
    items = get_collected_items(db, ctx.tenant_id, task_id, status, page, page_size)
    total = count_collected_items(db, ctx.tenant_id, task_id)
    
    item_list = []
    for item in items:
        item_list.append({
            "id": item.id,
            "task_id": item.task_id,
            "title": item.title,
            "author": item.author,
            "publish_at": item.publish_at,
            "source_platform": item.source_platform,
            "sentiment": item.sentiment,
            "status": item.status,
            "created_at": item.created_at
        })
    
    return {
        "items": item_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_item_detail_service(db: Session, ctx: RequestContext, item_id: int) -> Dict:
    """获取采集数据详情"""
    item = get_collected_item_by_id(db, item_id)
    if not item:
        raise NotFoundException("数据不存在")
    
    if not ctx.is_super_admin and item.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此数据")
    
    return {
        "id": item.id,
        "task_id": item.task_id,
        "title": item.title,
        "content": item.content,
        "author": item.author,
        "publish_at": item.publish_at,
        "source_platform": item.source_platform,
        "source_url": item.source_url,
        "raw_content": item.raw_content,
        "sentiment": item.sentiment,
        "tags": item.tags,
        "entities": item.entities,
        "status": item.status
    }


def update_item_service(db: Session, ctx: RequestContext, item_id: int, **kwargs) -> Dict:
    """更新采集数据"""
    item = get_collected_item_by_id(db, item_id)
    if not item:
        raise NotFoundException("数据不存在")
    
    if not ctx.is_super_admin and item.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此数据")
    
    item = update_collected_item(db, item_id, **kwargs)
    
    return {
        "id": item.id,
        "status": item.status,
        "updated_at": item.updated_at
    }


def clean_item_service(db: Session, ctx: RequestContext, item_id: int):
    """清洗数据（标记为已清洗）"""
    update_item_status(db, item_id, "cleaned")


def analyze_item_service(db: Session, ctx: RequestContext, item_id: int):
    """分析数据（标记为已分析）"""
    update_item_status(db, item_id, "analyzed")


# 采集日志
def get_logs_service(db: Session, ctx: RequestContext, task_id: int = None,
                     page: int = 1, page_size: int = 50) -> List[Dict]:
    """获取采集日志列表"""
    logs = get_collect_logs(db, ctx.tenant_id, task_id, page, page_size)
    
    return [
        {
            "id": log.id,
            "task_id": log.task_id,
            "run_at": log.run_at,
            "status": log.status,
            "items_count": log.items_count,
            "error_message": log.error_message,
            "duration_seconds": log.duration_seconds
        }
        for log in logs
    ]


# 辅助函数
def generate_content_hash(content: str) -> str:
    """生成内容Hash"""
    return hashlib.md5(content.encode()).hexdigest()