from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, DateTime
from database.session import Base
from model.base import BaseModelMixin


class Skill(Base, BaseModelMixin):
    """技能表"""
    __tablename__ = "skills"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建人ID")
    name = Column(String(100), nullable=False, comment="技能名称")
    type = Column(String(20), nullable=False, comment="技能类型: function_call/mcp/skill/dify_app")
    description = Column(Text, nullable=True, comment="描述")
    config = Column(JSON, nullable=True, comment="技能配置")
    input_schema = Column(JSON, nullable=True, comment="入参Schema")
    output_schema = Column(JSON, nullable=True, comment="出参Schema")
    visibility = Column(String(20), default="personal", comment="可见范围: personal/tenant/public")
    review_status = Column(String(20), default="draft", comment="审核状态: draft/pending/approved/rejected")
    status = Column(String(20), default="enabled", comment="状态")
    deleted_at = Column(DateTime, nullable=True, comment="删除时间")
    dify_app_id = Column(Integer, ForeignKey("dify_apps.id"), nullable=True, index=True, comment="绑定的Dify App ID")