from sqlalchemy import Column, Integer, String, Text, JSON, DateTime, ForeignKey
from database.session import Base
from model.base import BaseModelMixin


class SkillCallLog(Base, BaseModelMixin):
    """技能调用记录表"""
    __tablename__ = "skill_call_logs"
    
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False, index=True, comment="技能ID")
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True, comment="租户ID")
    caller_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="调用人ID")
    source = Column(String(50), nullable=True, comment="调用来源: test/agent/workflow/query")
    input_data = Column(JSON, nullable=True, comment="调用入参")
    output_data = Column(JSON, nullable=True, comment="调用出参")
    status = Column(String(20), nullable=False, comment="状态: success/failed")
    duration_ms = Column(Integer, nullable=True, comment="耗时毫秒")
    error_message = Column(Text, nullable=True, comment="错误信息")
