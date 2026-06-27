from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime
from database.session import Base
from model.base import BaseModelMixin


class Role(Base, BaseModelMixin):
    """角色表"""
    __tablename__ = "roles"
    
    tenant_id = Column(Integer, nullable=True, index=True, comment="租户ID，平台角色为null")
    name = Column(String(100), nullable=False, comment="角色名称")
    code = Column(String(100), nullable=False, unique=True, index=True, comment="角色编码")
    description = Column(Text, nullable=True, comment="角色描述")
    is_system = Column(Boolean, default=False, comment="是否系统内置角色")
    is_platform = Column(Boolean, default=False, comment="是否平台级角色")
    status = Column(String(20), default="enabled", comment="状态: enabled/disabled")
    deleted_at = Column(DateTime, nullable=True, comment="删除时间")


# 系统预置角色编码
class RoleCode:
    SUPER_ADMIN = "super_admin"  # 平台超级管理员
    TENANT_ADMIN = "tenant_admin"  # 租户管理员
    ADMIN = "admin"  # 普通管理员
    USER = "user"  # 普通用户
    EXTERNAL_USER = "external_user"  # 外部用户