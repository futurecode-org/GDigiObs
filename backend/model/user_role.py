from sqlalchemy import Column, Integer, ForeignKey
from database.session import Base
from model.base import BaseModelMixin


class UserRole(Base, BaseModelMixin):
    """用户角色关联表"""
    __tablename__ = "user_roles"
    
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False, index=True, comment="角色ID")