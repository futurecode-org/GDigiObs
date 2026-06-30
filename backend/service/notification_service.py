"""通知业务逻辑层"""
import logging
import smtplib
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from dao.notification_dao import (
    get_notifications, count_notifications, get_notification_by_id,
    create_notification, mark_as_read, mark_all_as_read, delete_notification,
    batch_delete_notifications,
    get_notification_setting, create_notification_setting, update_notification_setting,
    get_system_email_configs, get_system_email_config_by_id,
    create_system_email_config, update_system_email_config, delete_system_email_config
)
from dao.user_dao import get_user_by_id, get_users
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext
from core.security import encrypt_api_key, decrypt_api_key

logger = logging.getLogger(__name__)


# ==================== 原有通知功能 ====================

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
                              content: str = None, data: dict = None,
                              channel: str = "in_app"):
    """发送通知"""
    create_notification(db, tenant_id, user_id, notification_type, title, content, data, channel)
    logger.info(f"发送通知: user_id={user_id}, type={notification_type}, title={title}")


# ==================== 通知设置 ====================

DEFAULT_SCENE_SETTINGS = {
    "friend_application": {"browser": True, "email": False},
    "group_invitation": {"browser": True, "email": False},
    "group_join_approval": {"browser": True, "email": False},
    "audit_alert": {"browser": True, "email": True},
    "agent_completed": {"browser": True, "email": False},
    "workflow_failed": {"browser": True, "email": True},
    "query_completed": {"browser": True, "email": False},
    "user_banned": {"browser": True, "email": True},
}


def get_user_notification_settings_service(db: Session, ctx: RequestContext) -> Dict:
    """获取用户通知设置"""
    setting = get_notification_setting(db, ctx.user_id)
    if not setting:
        setting = create_notification_setting(
            db, ctx.user_id,
            browser_enabled=True,
            email_enabled=False,
            scene_settings=DEFAULT_SCENE_SETTINGS.copy()
        )
    
    # 合并默认场景设置
    scene_settings = DEFAULT_SCENE_SETTINGS.copy()
    if setting.scene_settings:
        scene_settings.update(setting.scene_settings)
    
    return {
        "id": setting.id,
        "user_id": setting.user_id,
        "browser_enabled": setting.browser_enabled,
        "email_enabled": setting.email_enabled,
        "scene_settings": scene_settings,
        "created_at": setting.created_at,
        "updated_at": setting.updated_at
    }


def update_user_notification_settings_service(db: Session, ctx: RequestContext, data: Dict) -> Dict:
    """更新用户通知设置"""
    setting = update_notification_setting(
        db, ctx.user_id,
        browser_enabled=data.get("browser_enabled"),
        email_enabled=data.get("email_enabled"),
        scene_settings=data.get("scene_settings")
    )
    
    return get_user_notification_settings_service(db, ctx)


def should_notify_service(db: Session, user_id: int, channel: str, scene: str) -> bool:
    """判断是否应该向用户发送某渠道某场景的通知"""
    setting = get_notification_setting(db, user_id)
    if not setting:
        # 默认：浏览器通知开启，邮件通知关闭
        return channel == "browser"
    
    if channel == "browser" and not setting.browser_enabled:
        return False
    if channel == "email" and not setting.email_enabled:
        return False
    
    scene_settings = setting.scene_settings or {}
    scene_config = scene_settings.get(scene, {})
    return scene_config.get(channel, True) if channel in ["browser", "email"] else True


# ==================== 系统邮件配置 ====================

def get_system_email_configs_service(db: Session, ctx: RequestContext) -> List[Dict]:
    """获取系统邮件配置列表"""
    # 仅管理员可访问
    if not ctx.is_admin:
        raise ForbiddenException("无权限访问")
    
    # 超级管理员可查看所有配置，租户管理员只能查看本租户配置
    tenant_id = None if ctx.is_super_admin else ctx.tenant_id
    configs = get_system_email_configs(db, tenant_id)
    result = []
    for config in configs:
        result.append({
            "id": config.id,
            "tenant_id": config.tenant_id,
            "smtp_host": config.smtp_host,
            "smtp_port": config.smtp_port,
            "smtp_username": config.smtp_username,
            "smtp_password": "******",  # 不返回明文密码
            "sender_email": config.sender_email,
            "sender_name": config.sender_name,
            "security_protocol": config.security_protocol,
            "status": config.status,
            "created_at": config.created_at,
            "updated_at": config.updated_at
        })
    return result


def create_system_email_config_service(db: Session, ctx: RequestContext, data: Dict) -> Dict:
    """创建系统邮件配置"""
    if not ctx.is_admin:
        raise ForbiddenException("无权限")
    
    # 从上下文注入租户ID，确保创建和查询的租户一致
    if data.get("tenant_id") is None:
        data["tenant_id"] = ctx.tenant_id
    
    # 加密存储密码
    if "smtp_password" in data:
        data["smtp_password"] = encrypt_api_key(data["smtp_password"])
    
    config = create_system_email_config(db, **data)
    logger.info(f"创建系统邮件配置: id={config.id}")
    return {
        "id": config.id,
        "tenant_id": config.tenant_id,
        "smtp_host": config.smtp_host,
        "smtp_port": config.smtp_port,
        "smtp_username": config.smtp_username,
        "sender_email": config.sender_email,
        "sender_name": config.sender_name,
        "security_protocol": config.security_protocol,
        "status": config.status,
        "created_at": config.created_at,
        "updated_at": config.updated_at
    }


def update_system_email_config_service(db: Session, ctx: RequestContext, config_id: int, data: Dict) -> Dict:
    """更新系统邮件配置"""
    if not ctx.is_admin:
        raise ForbiddenException("无权限")
    
    config = get_system_email_config_by_id(db, config_id)
    if not config:
        raise NotFoundException("配置不存在")
    
    if "smtp_password" in data:
        data["smtp_password"] = encrypt_api_key(data["smtp_password"])
    
    config = update_system_email_config(db, config_id, **data)
    logger.info(f"更新系统邮件配置: id={config_id}")
    return {
        "id": config.id,
        "tenant_id": config.tenant_id,
        "smtp_host": config.smtp_host,
        "smtp_port": config.smtp_port,
        "smtp_username": config.smtp_username,
        "sender_email": config.sender_email,
        "sender_name": config.sender_name,
        "security_protocol": config.security_protocol,
        "status": config.status,
        "created_at": config.created_at,
        "updated_at": config.updated_at
    }


def delete_system_email_config_service(db: Session, ctx: RequestContext, config_id: int) -> bool:
    """删除系统邮件配置"""
    if not ctx.is_admin:
        raise ForbiddenException("无权限")
    
    config = get_system_email_config_by_id(db, config_id)
    if not config:
        raise NotFoundException("配置不存在")
    
    delete_system_email_config(db, config_id)
    logger.info(f"删除系统邮件配置: id={config_id}")
    return True


def test_email_connection_service(db: Session, ctx: RequestContext, data: Dict) -> Dict:
    """测试邮件 SMTP 连接"""
    if not ctx.is_admin:
        raise ForbiddenException("无权限")
    
    smtp_host = data.get("smtp_host")
    smtp_port = data.get("smtp_port", 587)
    smtp_username = data.get("smtp_username")
    smtp_password = data.get("smtp_password")
    security_protocol = data.get("security_protocol", "tls")
    
    if not smtp_host or not smtp_username or not smtp_password:
        raise BadRequestException("请填写 SMTP 服务器、用户名和密码")
    
    try:
        if security_protocol == "ssl":
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
            if security_protocol == "starttls":
                server.starttls()
        
        if security_protocol != "none":
            server.login(smtp_username, smtp_password)
        
        server.quit()
        logger.info(f"邮件连接测试成功: {smtp_host}:{smtp_port} ({security_protocol})")
        return {"message": "连接测试成功"}
    except smtplib.SMTPAuthenticationError:
        logger.warning(f"邮件连接测试认证失败: {smtp_host}:{smtp_port}")
        raise BadRequestException("认证失败，请检查用户名和密码")
    except smtplib.SMTPConnectError as e:
        logger.warning(f"邮件连接测试连接失败: {smtp_host}:{smtp_port} - {e}")
        raise BadRequestException(f"连接失败: {str(e)}")
    except Exception as e:
        logger.warning(f"邮件连接测试失败: {smtp_host}:{smtp_port} - {e}")
        raise BadRequestException(f"连接测试失败: {str(e)}")


# ==================== 管理员发送系统通知 ====================

def send_system_notification_service(db: Session, ctx: RequestContext, data: Dict) -> Dict:
    """管理员发送系统通知"""
    if not ctx.is_admin:
        raise ForbiddenException("无权限")
    
    from dao.user_dao import get_users, search_users_by_keyword
    from model.user import User
    
    target_type = data.get("target_type", "all")
    target_ids = data.get("target_ids") or []
    title = data["title"]
    content = data.get("content", "")
    notification_type = data.get("notification_type", "system")
    channel = data.get("channel", "in_app")
    extra_data = data.get("data")
    email_config_id = data.get("email_config_id")
    recipient_emails = data.get("recipient_emails") or []
    
    # 获取目标用户列表
    users = []
    if target_type == "all":
        users = db.query(User).filter(User.deleted_at.is_(None)).all()
    elif target_type == "tenant" and target_ids:
        users = db.query(User).filter(User.tenant_id.in_(target_ids), User.deleted_at.is_(None)).all()
    elif target_type == "role" and target_ids:
        # 需要通过角色关联查询，简化处理：先查所有用户
        users = db.query(User).filter(User.deleted_at.is_(None)).all()
        # 这里简化处理，实际应通过 user_roles 表过滤
    elif target_type == "user" and target_ids:
        users = db.query(User).filter(User.id.in_(target_ids), User.deleted_at.is_(None)).all()
    
    sent_count = 0
    for user in users:
        # 检查用户通知偏好
        if channel in ["browser", "email"]:
            if not should_notify_service(db, user.id, channel, notification_type):
                continue
        
        create_notification(
            db, user.tenant_id or ctx.tenant_id, user.id,
            notification_type, title, content, extra_data, channel
        )
        sent_count += 1
    
    # 邮件渠道：发送额外收件邮箱
    if channel == "email" and recipient_emails:
        from service.email_service import send_email_with_config
        for email in recipient_emails:
            try:
                send_email_with_config(
                    db, ctx.tenant_id, email_config_id,
                    recipient=email, subject=title, body=content
                )
                sent_count += 1
            except Exception as e:
                logger.warning(f"发送额外邮件失败: {email}, error={e}")
    
    logger.info(f"管理员发送系统通知: target={target_type}, sent={sent_count}, title={title}")
    return {"sent_count": sent_count}
