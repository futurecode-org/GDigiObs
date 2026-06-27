from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from database.session import Base
from model.base import BaseModelMixin


class Group(Base, BaseModelMixin):
    """群组表"""
    __tablename__ = "groups"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    name = Column(String(100), nullable=False, comment="群名称")
    avatar_file_id = Column(Integer, ForeignKey("file_assets.id"), nullable=True, comment="群头像文件ID")
    description = Column(Text, nullable=True, comment="群简介")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="群主ID")
    join_mode = Column(String(20), default="approval", comment="入群方式: invite_only/approval/open")
    allow_member_invite = Column(Boolean, default=True, comment="是否允许成员邀请他人")
    max_members = Column(Integer, default=500, comment="最大成员数")
    status = Column(String(20), default="normal", comment="状态: normal/muted/disabled/dissolved")


class GroupMember(Base, BaseModelMixin):
    """群成员表"""
    __tablename__ = "group_members"
    
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=False, index=True, comment="群ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    role = Column(String(20), default="member", comment="角色: owner/admin/member")
    muted_until = Column(DateTime, nullable=True, comment="禁言截止时间")
    joined_at = Column(DateTime, nullable=False, comment="入群时间")
    status = Column(String(20), default="normal", comment="状态: normal/removed/left")


class FriendRelation(Base, BaseModelMixin):
    """好友关系表"""
    __tablename__ = "friend_relations"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="当前用户租户ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    friend_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="好友用户ID")
    remark = Column(String(100), nullable=True, comment="好友备注")
    group_name = Column(String(100), nullable=True, comment="好友分组名称")
    status = Column(String(20), default="normal", comment="状态: normal/deleted/blocked")


class FriendApplication(Base, BaseModelMixin):
    """好友申请表"""
    __tablename__ = "friend_applications"
    
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="申请人ID")
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="接收人ID")
    message = Column(String(255), nullable=True, comment="验证消息")
    status = Column(String(20), default="pending", comment="状态: pending/accepted/rejected/expired/canceled")
    handled_at = Column(DateTime, nullable=True, comment="处理时间")