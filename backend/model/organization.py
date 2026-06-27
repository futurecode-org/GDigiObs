from sqlalchemy import Column, Integer, String, Text, ForeignKey, Boolean
from database.session import Base
from model.base import BaseModelMixin


class Organization(Base, BaseModelMixin):
    """组织(公司)表"""
    __tablename__ = "organizations"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    name = Column(String(100), nullable=False, comment="组织名称")
    code = Column(String(50), nullable=True, unique=True, comment="组织编码")
    parent_id = Column(Integer, nullable=True, comment="上级组织ID")
    description = Column(Text, nullable=True, comment="描述")
    status = Column(String(20), default="enabled", comment="状态")


class Department(Base, BaseModelMixin):
    """部门表"""
    __tablename__ = "departments"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, index=True, comment="组织ID")
    name = Column(String(100), nullable=False, comment="部门名称")
    code = Column(String(50), nullable=True, comment="部门编码")
    parent_id = Column(Integer, nullable=True, comment="上级部门ID")
    manager_user_id = Column(Integer, nullable=True, comment="部门负责人ID")
    description = Column(Text, nullable=True, comment="描述")
    sort_order = Column(Integer, default=0, comment="排序")
    status = Column(String(20), default="enabled", comment="状态")


class Position(Base, BaseModelMixin):
    """岗位表"""
    __tablename__ = "positions"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False, comment="部门ID")
    name = Column(String(100), nullable=False, comment="岗位名称")
    code = Column(String(50), nullable=True, comment="岗位编码")
    description = Column(Text, nullable=True, comment="描述")
    sort_order = Column(Integer, default=0, comment="排序")
    status = Column(String(20), default="enabled", comment="状态")


class UserOrganization(Base, BaseModelMixin):
    """用户组织关联表"""
    __tablename__ = "user_organizations"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False, comment="组织ID")
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True, comment="部门ID")
    position_id = Column(Integer, ForeignKey("positions.id"), nullable=True, comment="岗位ID")
    is_primary = Column(Boolean, default=False, comment="是否主组织")
    status = Column(String(20), default="active", comment="状态")