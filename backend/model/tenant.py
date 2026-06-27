from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON
from datetime import datetime
from database.session import Base
from model.base import BaseModelMixin


class Tenant(Base, BaseModelMixin):
    """租户表"""
    __tablename__ = "tenants"
    
    name = Column(String(100), nullable=False, comment="租户名称")
    type = Column(String(20), nullable=False, default="personal", comment="租户类型: enterprise/personal")
    status = Column(String(20), nullable=False, default="enabled", comment="状态: enabled/disabled")
    admin_user_id = Column(Integer, nullable=True, comment="租户管理员用户ID")
    config = Column(JSON, nullable=True, comment="租户配置JSON")
    deleted_at = Column(DateTime, nullable=True, comment="删除时间(软删除)")
    
    # 租户配置默认值
    DEFAULT_CONFIG = {
        "max_users": 100,
        "max_storage_mb": 1024,
        "features": {
            "im": True,
            "knowledge": True,
            "ask": True,
            "workflow": True,
            "agent": True
        }
    }