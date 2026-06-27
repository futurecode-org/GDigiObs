from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from database.session import Base
from model.base import BaseModelMixin


class AnalysisTask(Base, BaseModelMixin):
    """分析任务表"""
    __tablename__ = "analysis_tasks"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    name = Column(String(100), nullable=False, comment="任务名称")
    analysis_type = Column(String(50), nullable=False, comment="分析类型: trend/sentiment/topic/keyword/risk")
    data_source = Column(JSON, nullable=False, comment="数据源配置")
    config = Column(JSON, nullable=True, comment="分析配置")
    status = Column(String(20), default="enabled", comment="状态: enabled/disabled")
    description = Column(Text, nullable=True, comment="任务描述")


class AnalysisLog(Base, BaseModelMixin):
    """分析日志表"""
    __tablename__ = "analysis_logs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    task_id = Column(Integer, ForeignKey("analysis_tasks.id"), nullable=False, index=True, comment="任务ID")
    executed_at = Column(DateTime, nullable=False, comment="执行时间")
    total = Column(Integer, default=0, comment="处理数据量")
    result = Column(JSON, nullable=True, comment="分析结果")
    status = Column(String(20), default="success", comment="状态: success/failed")