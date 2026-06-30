from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, DateTime
from database.session import Base
from model.base import BaseModelMixin


class Notification(Base, BaseModelMixin):
    """通知表"""
    __tablename__ = "notifications"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="接收用户ID")
    notification_type = Column(String(50), nullable=False, comment="通知类型")
    title = Column(String(255), nullable=False, comment="标题")
    content = Column(Text, nullable=True, comment="内容")
    data = Column(JSON, nullable=True, comment="附加数据")
    read_at = Column(DateTime, nullable=True, comment="阅读时间")
    channel = Column(String(20), default="in_app", comment="渠道: in_app/browser/email")
    status = Column(String(20), default="unread", comment="状态: unread/read")


class NotificationSetting(Base, BaseModelMixin):
    """用户通知设置表"""
    __tablename__ = "notification_settings"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    browser_enabled = Column(Boolean, default=True, comment="是否开启浏览器通知")
    email_enabled = Column(Boolean, default=False, comment="是否开启邮件通知")
    scene_settings = Column(JSON, nullable=True, comment="各场景通知偏好")


class SystemEmailConfig(Base, BaseModelMixin):
    """系统邮件配置表"""
    __tablename__ = "system_email_configs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True, comment="租户ID，空表示平台级")
    smtp_host = Column(String(200), nullable=False, comment="SMTP服务器")
    smtp_port = Column(Integer, default=587, comment="SMTP端口")
    smtp_username = Column(String(200), nullable=False, comment="SMTP用户名")
    smtp_password = Column(String(500), nullable=False, comment="SMTP密码")
    sender_email = Column(String(200), nullable=False, comment="发件人邮箱")
    sender_name = Column(String(100), nullable=True, comment="发件人名称")
    security_protocol = Column(String(20), default="tls", comment="安全协议: none/ssl/tls/starttls")
    status = Column(String(20), default="enabled", comment="状态: enabled/disabled")