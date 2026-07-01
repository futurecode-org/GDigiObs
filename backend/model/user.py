from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from database.session import Base
from model.base import BaseModelMixin


class User(Base, BaseModelMixin):
    """用户表"""
    __tablename__ = "users"
    
    tenant_id = Column(Integer, nullable=True, index=True, comment="租户ID")
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    password = Column(String(255), nullable=False, comment="密码Hash")
    email = Column(String(100), unique=True, index=True, nullable=True, comment="邮箱")
    phone = Column(String(50), unique=True, index=True, nullable=True, comment="手机号")
    nickname = Column(String(100), nullable=True, comment="昵称")
    avatar_file_id = Column(Integer, nullable=True, comment="头像文件ID")
    user_type = Column(String(20), default="internal", comment="用户类型: external/internal/admin")
    status = Column(String(20), default="normal", comment="状态: normal/disabled/banned/pending")
    last_login_at = Column(DateTime, nullable=True, comment="最近登录时间")
    muted_until = Column(DateTime, nullable=True, comment="全局禁言截止时间")
    deleted_at = Column(DateTime, nullable=True, comment="删除时间")


# 用户类型
class UserType:
    EXTERNAL = "external"  # 外部用户
    INTERNAL = "internal"  # 内部用户
    ADMIN = "admin"  # 管理员


# 用户状态
class UserStatus:
    NORMAL = "normal"  # 正常
    DISABLED = "disabled"  # 禁用
    BANNED = "banned"  # 封禁
    PENDING = "pending"  # 待激活
    DELETED = "deleted"  # 已删除