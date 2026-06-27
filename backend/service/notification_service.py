"""通知业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from dao.notification_dao import (
    get_notifications, count_notifications, get_notification_by_id,
    create_notification, mark_as_read, mark_all_as_read, delete_notification,
    batch_delete_notifications
)
from core.exceptions import NotFoundException, ForbiddenException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def get_notifications_service(db: Session, ctx: RequestContext, notification_type: str = None,
                              page: int = 1, page_size: int = 50) -> Dict:
    """获取通知列表"""
    notifications = get_notifications(db, ctx.tenant_id, ctx.user_id, notification_type, None, page, page_size)
    total = count_notifications(db, ctx.tenant_id, ctx.user_id)
    
    notification_list = []
    for notification in notifications:
        notification_list.append({
            "id": notification.id,
            "notification_type": notification.notification_type,
            "title": notification.title,
            "content": notification.content,
            "data": notification.data,
            "status": notification.status,
            "channel": notification.channel,
            "created_at": notification.created_at
        })
    
    return {
        "items": notification_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_notification_detail_service(db: Session, ctx: RequestContext, notification_id: int) -> Dict:
    """获取通知详情"""
    notification = get_notification_by_id(db, notification_id)
    if not notification:
        raise NotFoundException("通知不存在")
    
    if notification.user_id != ctx.user_id:
        raise ForbiddenException("无权访问此通知")
    
    return {
        "id": notification.id,
        "notification_type": notification.notification_type,
        "title": notification.title,
        "content": notification.content,
        "data": notification.data,
        "status": notification.status,
        "channel": notification.channel,
        "created_at": notification.created_at
    }


def get_unread_count_service(db: Session, ctx: RequestContext) -> Dict:
    """获取未读通知数量"""
    count = count_notifications(db, ctx.tenant_id, ctx.user_id, "unread")
    return {"unread_count": count}


def mark_as_read_service(db: Session, ctx: RequestContext, notification_id: int):
    """标记通知为已读"""
    notification = get_notification_by_id(db, notification_id)
    if not notification:
        raise NotFoundException("通知不存在")
    
    if notification.user_id != ctx.user_id:
        raise ForbiddenException("无权操作此通知")
    
    mark_as_read(db, notification_id)


def mark_all_as_read_service(db: Session, ctx: RequestContext):
    """标记所有通知为已读"""
    mark_all_as_read(db, ctx.tenant_id, ctx.user_id)


def delete_notification_service(db: Session, ctx: RequestContext, notification_id: int):
    """删除通知"""
    notification = get_notification_by_id(db, notification_id)
    if not notification:
        raise NotFoundException("通知不存在")
    
    if notification.user_id != ctx.user_id:
        raise ForbiddenException("无权删除此通知")
    
    delete_notification(db, notification_id)


def batch_delete_notifications_service(db: Session, ctx: RequestContext, notification_ids: List[int]):
    """批量删除通知"""
    batch_delete_notifications(db, ctx.tenant_id, ctx.user_id, notification_ids)


def send_notification_service(db: Session, tenant_id: int, user_id: int,
                              notification_type: str, title: str,
                              content: str = None, data: dict = None):
    """发送通知"""
    create_notification(db, tenant_id, user_id, notification_type, title, content, data)
    logger.info(f"发送通知: user_id={user_id}, type={notification_type}, title={title}")