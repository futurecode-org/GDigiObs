"""通知数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime

from model.notification import Notification


def get_notifications(db: Session, tenant_id: int, user_id: int,
                      notification_type: str = None, status: str = None,
                      page: int = 1, page_size: int = 50) -> List[Notification]:
    """获取通知列表"""
    query = db.query(Notification).filter(
        Notification.tenant_id == tenant_id,
        Notification.user_id == user_id
    )
    
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    
    if status:
        query = query.filter(Notification.status == status)
    
    return query.order_by(desc(Notification.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_notifications(db: Session, tenant_id: int, user_id: int, status: str = None) -> int:
    """统计通知数量"""
    query = db.query(Notification).filter(
        Notification.tenant_id == tenant_id,
        Notification.user_id == user_id
    )
    
    if status:
        query = query.filter(Notification.status == status)
    
    return query.count()


def get_notification_by_id(db: Session, notification_id: int) -> Optional[Notification]:
    """获取通知详情"""
    return db.query(Notification).filter(Notification.id == notification_id).first()


def create_notification(db: Session, tenant_id: int, user_id: int,
                        notification_type: str, title: str,
                        content: str = None, data: dict = None,
                        channel: str = "in_app") -> Notification:
    """创建通知"""
    notification = Notification(
        tenant_id=tenant_id,
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        content=content,
        data=data,
        channel=channel,
        status="unread"
    )
    db.add(notification)
    db.commit()
    return notification


def mark_as_read(db: Session, notification_id: int) -> bool:
    """标记为已读"""
    notification = get_notification_by_id(db, notification_id)
    if not notification:
        return False
    
    notification.status = "read"
    notification.read_at = datetime.now()
    db.commit()
    return True


def mark_all_as_read(db: Session, tenant_id: int, user_id: int) -> int:
    """标记所有通知为已读"""
    result = db.query(Notification).filter(
        Notification.tenant_id == tenant_id,
        Notification.user_id == user_id,
        Notification.status == "unread"
    ).update({
        Notification.status: "read",
        Notification.read_at: datetime.now()
    })
    db.commit()
    return result


def delete_notification(db: Session, notification_id: int) -> bool:
    """删除通知"""
    notification = get_notification_by_id(db, notification_id)
    if not notification:
        return False
    
    db.delete(notification)
    db.commit()
    return True


def batch_delete_notifications(db: Session, tenant_id: int, user_id: int, notification_ids: list) -> int:
    """批量删除通知"""
    result = db.query(Notification).filter(
        Notification.tenant_id == tenant_id,
        Notification.user_id == user_id,
        Notification.id.in_(notification_ids)
    ).delete(synchronize_session=False)
    db.commit()
    return result