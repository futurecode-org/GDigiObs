"""通知管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from schema.notification import (
    NotificationResponse, NotificationListResponse,
    NotificationSettingUpdate, NotificationSettingResponse,
    SystemEmailConfigCreate, SystemEmailConfigUpdate, SystemEmailConfigResponse,
    SendNotificationRequest, TestEmailConnectionRequest
)
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext
from service.notification_service import (
    get_notifications_service, get_notification_detail_service, get_unread_count_service,
    mark_as_read_service, mark_all_as_read_service, delete_notification_service,
    batch_delete_notifications_service,
    get_user_notification_settings_service, update_user_notification_settings_service,
    get_system_email_configs_service, create_system_email_config_service,
    update_system_email_config_service, delete_system_email_config_service,
    send_system_notification_service, test_email_connection_service
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


@notification_router.get("/settings", summary="获取用户通知设置")
def get_notification_settings(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取当前用户通知设置"""
    result = get_user_notification_settings_service(db, ctx)
    return ApiResponse.success(data=result)


@notification_router.put("/settings", summary="更新用户通知设置")
def update_notification_settings(
    data: NotificationSettingUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新当前用户通知设置"""
    result = update_user_notification_settings_service(db, ctx, data.dict(exclude_unset=True))
    return ApiResponse.success(data=result)


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


# ==================== 系统邮件配置（管理员） ====================

@notification_router.get("/admin/email-configs", summary="获取系统邮件配置列表")
def list_email_configs(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """管理员获取系统邮件配置列表"""
    result = get_system_email_configs_service(db, ctx)
    return ApiResponse.success(data=result)


@notification_router.post("/admin/email-configs", summary="创建系统邮件配置")
def create_email_config(
    data: SystemEmailConfigCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """管理员创建系统邮件配置"""
    result = create_system_email_config_service(db, ctx, data.dict())
    return ApiResponse.success(data=result)


@notification_router.put("/admin/email-configs/{config_id}", summary="更新系统邮件配置")
def update_email_config(
    config_id: int,
    data: SystemEmailConfigUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """管理员更新系统邮件配置"""
    result = update_system_email_config_service(db, ctx, config_id, data.dict(exclude_unset=True))
    return ApiResponse.success(data=result)


@notification_router.delete("/admin/email-configs/{config_id}", summary="删除系统邮件配置")
def delete_email_config(
    config_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """管理员删除系统邮件配置"""
    delete_system_email_config_service(db, ctx, config_id)
    return ApiResponse.success(message="删除成功")


@notification_router.post("/admin/email-configs/test", summary="测试邮件连接")
def test_email_config(
    data: TestEmailConnectionRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """管理员测试邮件 SMTP 连接"""
    result = test_email_connection_service(db, ctx, data.dict())
    return ApiResponse.success(data=result)


# ==================== 管理员发送系统通知 ====================

@notification_router.post("/admin/send", summary="发送系统通知")
def send_system_notification(
    data: SendNotificationRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """管理员发送系统通知"""
    result = send_system_notification_service(db, ctx, data.dict())
    return ApiResponse.success(data=result)
