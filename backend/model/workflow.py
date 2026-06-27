from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, DateTime
from database.session import Base
from model.base import BaseModelMixin


class Workflow(Base, BaseModelMixin):
    """工作流表"""
    __tablename__ = "workflows"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建人ID")
    name = Column(String(100), nullable=False, comment="工作流名称")
    description = Column(Text, nullable=True, comment="描述")
    nodes = Column(JSON, nullable=False, comment="节点配置")
    edges = Column(JSON, nullable=False, comment="连线配置")
    trigger_type = Column(String(20), default="manual", comment="触发类型: schedule/manual/chat/webhook")
    schedule_config = Column(JSON, nullable=True, comment="定时配置")
    status = Column(String(20), default="draft", comment="状态: draft/enabled/disabled")
    deleted_at = Column(DateTime, nullable=True, comment="删除时间")


class WorkflowRun(Base, BaseModelMixin):
    """工作流执行记录表"""
    __tablename__ = "workflow_runs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False, index=True, comment="工作流ID")
    trigger_type = Column(String(20), nullable=False, comment="触发类型")
    trigger_user_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="触发用户ID")
    input_data = Column(JSON, nullable=True, comment="输入数据")
    output_data = Column(JSON, nullable=True, comment="输出数据")
    status = Column(String(20), default="running", comment="状态: running/success/failed/canceled")
    started_at = Column(DateTime, nullable=False, comment="开始时间")
    finished_at = Column(DateTime, nullable=True, comment="完成时间")
    error_message = Column(Text, nullable=True, comment="错误信息")


class WorkflowNodeLog(Base, BaseModelMixin):
    """工作流节点执行日志表"""
    __tablename__ = "workflow_node_logs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    workflow_run_id = Column(Integer, ForeignKey("workflow_runs.id"), nullable=False, index=True, comment="工作流执行ID")
    node_id = Column(String(50), nullable=False, comment="节点ID")
    node_type = Column(String(50), nullable=False, comment="节点类型")
    input_data = Column(JSON, nullable=True, comment="节点输入")
    output_data = Column(JSON, nullable=True, comment="节点输出")
    status = Column(String(20), nullable=False, comment="状态: running/success/failed/skipped")
    started_at = Column(DateTime, nullable=True, comment="开始时间")
    finished_at = Column(DateTime, nullable=True, comment="完成时间")
    error_message = Column(Text, nullable=True, comment="错误信息")
    retry_count = Column(Integer, default=0, comment="重试次数")