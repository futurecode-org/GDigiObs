from sqlalchemy import Column, Integer, ForeignKey
from database.session import Base
from model.base import BaseModelMixin


class RolePermission(Base, BaseModelMixin):
    """角色权限关联表"""
    __tablename__ = "role_permissions"
    
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, index=True, comment="角色ID")
    permission_id = Column(Integer, ForeignKey("permissions.id"), nullable=False, index=True, comment="权限ID")