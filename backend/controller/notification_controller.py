"""通知管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from schema.notification import NotificationResponse, NotificationListResponse
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext, RequestContext
from service.notification_service import (
    get_notifications_service, get_notification_detail_service, get_unread_count_service,
    mark_as_read_service, mark_all_as_read_service, delete_notification_service,
    batch_delete_notifications_service
)

from model.user import User


notification_router = APIRouter(prefix="/notifications", tags=["通知管理 Notification"])


@notification_router.get("", summary="获取通知列表")
def list_notifications(
    notification_type: str = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取通知列表"""
    result = get_notifications_service(db, ctx, notification_type, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@notification_router.get("/unread/count", summary="获取未读数量")
def get_unread_count(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取未读通知数量"""
    result = get_unread_count_service(db, ctx)
    return ApiResponse.success(data=result)


@notification_router.post("/read/all", summary="全部标记为已读")
def mark_all_read(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """标记所有通知为已读"""
    mark_all_as_read_service(db, ctx)
    return ApiResponse.success(message="全部已标记为已读")


@notification_router.post("/batch", summary="批量删除通知")
def batch_delete_notifications(
    notification_ids: List[int],
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """批量删除通知"""
    batch_delete_notifications_service(db, ctx, notification_ids)
    return ApiResponse.success(message="通知已批量删除")


@notification_router.get("/{notification_id}", summary="获取通知详情")
def get_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取通知详情"""
    result = get_notification_detail_service(db, ctx, notification_id)
    return ApiResponse.success(data=result)


@notification_router.post("/{notification_id}/read", summary="标记为已读")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """标记通知为已读"""
    mark_as_read_service(db, ctx, notification_id)
    return ApiResponse.success(message="已标记为已读")


@notification_router.delete("/{notification_id}", summary="删除通知")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除通知"""
    delete_notification_service(db, ctx, notification_id)
    return ApiResponse.success(message="通知已删除")
