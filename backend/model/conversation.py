from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from database.session import Base
from model.base import BaseModelMixin


class Conversation(Base, BaseModelMixin):
    """会话表"""
    __tablename__ = "conversations"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    type = Column(String(20), nullable=False, comment="会话类型: direct/group")
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True, comment="群ID(群聊时)")
    last_message_id = Column(Integer, nullable=True, comment="最近消息ID")
    last_message_at = Column(DateTime, nullable=True, comment="最近消息时间")
    
    group = relationship("Group", foreign_keys=[group_id], lazy="joined")


class ConversationMember(Base, BaseModelMixin):
    """会话成员表"""
    __tablename__ = "conversation_members"
    
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True, comment="会话ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    unread_count = Column(Integer, default=0, comment="未读消息数")
    muted = Column(Boolean, default=False, comment="是否免打扰")
    pinned = Column(Boolean, default=False, comment="是否置顶")
    last_read_message_id = Column(Integer, nullable=True, comment="最后已读消息ID")
    hidden = Column(Boolean, default=False, comment="是否隐藏")


class Message(Base, BaseModelMixin):
    """消息表"""
    __tablename__ = "messages"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False, index=True, comment="会话ID")
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="发送者ID")
    message_type = Column(String(20), nullable=False, comment="消息类型: text/image/file/audio/video/emoji/system")
    content = Column(Text, nullable=True, comment="消息内容")
    file_id = Column(Integer, ForeignKey("file_assets.id"), nullable=True, comment="文件ID")
    audit_status = Column(String(20), default="passed", comment="审计状态: passed/blocked/reviewing")
    risk_level = Column(String(20), default="none", comment="风险等级: none/low/medium/high")
    risk_tags = Column(JSON, nullable=True, comment="风险标签")
    recalled_at = Column(DateTime, nullable=True, comment="撤回时间")