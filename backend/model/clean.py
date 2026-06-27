from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from database.session import Base
from model.base import BaseModelMixin


class CleanRule(Base, BaseModelMixin):
    """清洗规则表"""
    __tablename__ = "clean_rules"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    name = Column(String(100), nullable=False, comment="规则名称")
    rule_type = Column(String(50), nullable=False, comment="规则类型: deduplication/format_standardization/sensitive_filter/entity_recognition/sentiment_analysis")
    config = Column(JSON, nullable=False, comment="规则配置")
    task_ids = Column(JSON, nullable=True, comment="绑定的采集任务ID列表")
    status = Column(String(20), default="enabled", comment="状态: enabled/disabled")
    description = Column(Text, nullable=True, comment="规则描述")


class CleanLog(Base, BaseModelMixin):
    """清洗日志表"""
    __tablename__ = "clean_logs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    rule_id = Column(Integer, ForeignKey("clean_rules.id"), nullable=False, index=True, comment="规则ID")
    task_id = Column(Integer, ForeignKey("collect_tasks.id"), nullable=True, index=True, comment="任务ID")
    executed_at = Column(DateTime, nullable=False, comment="执行时间")
    total = Column(Integer, default=0, comment="总数")
    success = Column(Integer, default=0, comment="成功数")
    failed = Column(Integer, default=0, comment="失败数")
    status = Column(String(20), default="success", comment="状态: success/failed/partial")