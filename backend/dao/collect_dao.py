"""数据采集数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional, Dict
from datetime import datetime

from model.collect import CollectPlatform, CollectTask, CollectedItem, CollectLog
from model.user import User


# 采集平台管理
def get_collect_platforms(db: Session) -> List[CollectPlatform]:
    """获取所有采集平台"""
    return db.query(CollectPlatform).filter(
        CollectPlatform.status == "enabled"
    ).all()


def get_collect_platform_by_id(db: Session, platform_id: int) -> Optional[CollectPlatform]:
    """获取采集平台详情"""
    return db.query(CollectPlatform).filter(
        CollectPlatform.id == platform_id
    ).first()


def create_collect_platform(db: Session, name: str, platform_type: str,
                            default_method: str = "api", config_schema: Dict = None) -> CollectPlatform:
    """创建采集平台"""
    platform = CollectPlatform(
        name=name,
        platform_type=platform_type,
        default_method=default_method,
        config_schema=config_schema
    )
    db.add(platform)
    db.commit()
    return platform


def update_collect_platform(db: Session, platform_id: int, **kwargs) -> CollectPlatform:
    """更新采集平台"""
    platform = get_collect_platform_by_id(db, platform_id)
    if not platform:
        return None
    
    for key, value in kwargs.items():
        if hasattr(platform, key):
            setattr(platform, key, value)
    
    db.commit()
    return platform


# 采集任务管理
def get_collect_tasks(db: Session, tenant_id: int, user_id: int = None,
                      is_public: bool = None, page: int = 1, page_size: int = 20) -> List[CollectTask]:
    """获取采集任务列表"""
    query = db.query(CollectTask).filter(
        CollectTask.tenant_id == tenant_id,
        CollectTask.deleted_at == None
    )
    
    if user_id:
        query = query.filter(CollectTask.created_by == user_id)
    
    if is_public is not None:
        query = query.filter(CollectTask.is_public == is_public)
    
    return query.order_by(desc(CollectTask.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_collect_tasks(db: Session, tenant_id: int, user_id: int = None) -> int:
    """统计采集任务数量"""
    query = db.query(CollectTask).filter(
        CollectTask.tenant_id == tenant_id,
        CollectTask.deleted_at == None
    )
    
    if user_id:
        query = query.filter(CollectTask.created_by == user_id)
    
    return query.count()


def get_collect_task_by_id(db: Session, task_id: int) -> Optional[CollectTask]:
    """获取采集任务详情"""
    return db.query(CollectTask).filter(
        CollectTask.id == task_id,
        CollectTask.deleted_at == None
    ).first()


def create_collect_task(db: Session, tenant_id: int, name: str, platform_id: int,
                        collect_method: str, created_by: int, **kwargs) -> CollectTask:
    """创建采集任务"""
    task = CollectTask(
        tenant_id=tenant_id,
        name=name,
        platform_id=platform_id,
        collect_method=collect_method,
        created_by=created_by,
        **kwargs
    )
    db.add(task)
    db.commit()
    return task


def update_collect_task(db: Session, task_id: int, **kwargs) -> CollectTask:
    """更新采集任务"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        return None
    
    for key, value in kwargs.items():
        if hasattr(task, key):
            setattr(task, key, value)
    
    db.commit()
    return task


def delete_collect_task(db: Session, task_id: int) -> bool:
    """删除采集任务（软删除）"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        return False
    
    task.deleted_at = datetime.now()
    db.commit()
    return True


def enable_collect_task(db: Session, task_id: int) -> bool:
    """启用采集任务"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        return False
    
    task.status = "enabled"
    db.commit()
    return True


def disable_collect_task(db: Session, task_id: int) -> bool:
    """禁用采集任务"""
    task = get_collect_task_by_id(db, task_id)
    if not task:
        return False
    
    task.status = "disabled"
    db.commit()
    return True


# 采集数据管理
def get_collected_items(db: Session, tenant_id: int, task_id: int = None,
                         status: str = None, page: int = 1, page_size: int = 50) -> List[CollectedItem]:
    """获取采集数据列表"""
    query = db.query(CollectedItem).filter(
        CollectedItem.tenant_id == tenant_id
    )
    
    if task_id:
        query = query.filter(CollectedItem.task_id == task_id)
    
    if status:
        query = query.filter(CollectedItem.status == status)
    
    return query.order_by(desc(CollectedItem.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_collected_items(db: Session, tenant_id: int, task_id: int = None) -> int:
    """统计采集数据数量"""
    query = db.query(CollectedItem).filter(
        CollectedItem.tenant_id == tenant_id
    )
    
    if task_id:
        query = query.filter(CollectedItem.task_id == task_id)
    
    return query.count()


def get_collected_item_by_id(db: Session, item_id: int) -> Optional[CollectedItem]:
    """获取采集数据详情"""
    return db.query(CollectedItem).filter(CollectedItem.id == item_id).first()


def create_collected_item(db: Session, tenant_id: int, task_id: int, **kwargs) -> CollectedItem:
    """创建采集数据"""
    item = CollectedItem(
        tenant_id=tenant_id,
        task_id=task_id,
        **kwargs
    )
    db.add(item)
    db.flush()
    
    # 更新任务最近运行时间
    task = get_collect_task_by_id(db, task_id)
    if task:
        task.last_run_at = datetime.now()
    
    db.commit()
    return item


def update_collected_item(db: Session, item_id: int, **kwargs) -> CollectedItem:
    """更新采集数据"""
    item = get_collected_item_by_id(db, item_id)
    if not item:
        return None
    
    for key, value in kwargs.items():
        if hasattr(item, key):
            setattr(item, key, value)
    
    db.commit()
    return item


def update_item_status(db: Session, item_id: int, status: str) -> bool:
    """更新数据状态"""
    item = get_collected_item_by_id(db, item_id)
    if not item:
        return False
    
    item.status = status
    db.commit()
    return True


# 采集日志管理
def get_collect_logs(db: Session, tenant_id: int, task_id: int = None,
                     page: int = 1, page_size: int = 50) -> List[CollectLog]:
    """获取采集日志列表"""
    query = db.query(CollectLog).filter(
        CollectLog.tenant_id == tenant_id
    )
    
    if task_id:
        query = query.filter(CollectLog.task_id == task_id)
    
    return query.order_by(desc(CollectLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def create_collect_log(db: Session, tenant_id: int, task_id: int, run_at: datetime,
                       status: str, items_count: int = 0, **kwargs) -> CollectLog:
    """创建采集日志"""
    log = CollectLog(
        tenant_id=tenant_id,
        task_id=task_id,
        run_at=run_at,
        status=status,
        items_count=items_count,
        **kwargs
    )
    db.add(log)
    db.commit()
    return log


def check_content_duplicate(db: Session, tenant_id: int, content_hash: str) -> Optional[CollectedItem]:
    """检查内容是否重复"""
    return db.query(CollectedItem).filter(
        CollectedItem.tenant_id == tenant_id,
        CollectedItem.content_hash == content_hash
    ).first()