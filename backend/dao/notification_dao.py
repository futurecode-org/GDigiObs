"""通知数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime

from model.notification import Notification, NotificationSetting, SystemEmailConfig


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


# ==================== 通知设置 ====================

def get_notification_setting(db: Session, user_id: int) -> Optional[NotificationSetting]:
    """获取用户通知设置"""
    return db.query(NotificationSetting).filter(NotificationSetting.user_id == user_id).first()


def create_notification_setting(db: Session, user_id: int,
                                browser_enabled: bool = True,
                                email_enabled: bool = False,
                                scene_settings: dict = None) -> NotificationSetting:
    """创建用户通知设置"""
    setting = NotificationSetting(
        user_id=user_id,
        browser_enabled=browser_enabled,
        email_enabled=email_enabled,
        scene_settings=scene_settings or {}
    )
    db.add(setting)
    db.commit()
    return setting


def update_notification_setting(db: Session, user_id: int,
                                browser_enabled: bool = None,
                                email_enabled: bool = None,
                                scene_settings: dict = None) -> NotificationSetting:
    """更新用户通知设置"""
    setting = get_notification_setting(db, user_id)
    if not setting:
        setting = create_notification_setting(db, user_id)
    
    if browser_enabled is not None:
        setting.browser_enabled = browser_enabled
    if email_enabled is not None:
        setting.email_enabled = email_enabled
    if scene_settings is not None:
        setting.scene_settings = scene_settings
    
    db.commit()
    return setting


# ==================== 系统邮件配置 ====================

def get_system_email_configs(db: Session, tenant_id: int = None) -> List[SystemEmailConfig]:
    """获取系统邮件配置列表"""
    query = db.query(SystemEmailConfig)
    if tenant_id is not None:
        query = query.filter(
            SystemEmailConfig.tenant_id == tenant_id
        )
    return query.order_by(desc(SystemEmailConfig.created_at)).all()


def get_system_email_config_by_id(db: Session, config_id: int) -> Optional[SystemEmailConfig]:
    """获取系统邮件配置详情"""
    return db.query(SystemEmailConfig).filter(SystemEmailConfig.id == config_id).first()


def create_system_email_config(db: Session, **kwargs) -> SystemEmailConfig:
    """创建系统邮件配置"""
    config = SystemEmailConfig(**kwargs)
    db.add(config)
    db.commit()
    return config


def update_system_email_config(db: Session, config_id: int, **kwargs) -> SystemEmailConfig:
    """更新系统邮件配置"""
    config = get_system_email_config_by_id(db, config_id)
    if not config:
        return None
    
    for key, value in kwargs.items():
        if hasattr(config, key):
            setattr(config, key, value)
    
    db.commit()
    return config


def delete_system_email_config(db: Session, config_id: int) -> bool:
    """删除系统邮件配置"""
    config = get_system_email_config_by_id(db, config_id)
    if not config:
        return False
    
    db.delete(config)
    db.commit()
    return True
