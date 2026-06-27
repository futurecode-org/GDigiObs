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