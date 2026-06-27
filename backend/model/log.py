from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, DateTime
from database.session import Base
from model.base import BaseModelMixin


class OperationLog(Base, BaseModelMixin):
    """操作日志表"""
    __tablename__ = "operation_logs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True, comment="租户ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True, comment="操作人ID")
    module = Column(String(100), nullable=False, comment="模块")
    action = Column(String(100), nullable=False, comment="操作")
    object_type = Column(String(100), nullable=True, comment="对象类型")
    object_id = Column(Integer, nullable=True, comment="对象ID")
    before_data = Column(JSON, nullable=True, comment="操作前数据")
    after_data = Column(JSON, nullable=True, comment="操作后数据")
    ip = Column(String(100), nullable=True, comment="IP地址")
    user_agent = Column(Text, nullable=True, comment="User Agent")
    status = Column(String(20), default="success", comment="状态: success/failed")
    error_message = Column(Text, nullable=True, comment="错误信息")


class AuditLog(Base, BaseModelMixin):
    """审计日志表"""
    __tablename__ = "audit_logs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True, comment="用户ID")
    audit_type = Column(String(50), nullable=False, comment="审计类型: message/data/sql/model/skill/agent/workflow")
    risk_level = Column(String(20), default="none", comment="风险等级: none/low/medium/high")
    risk_tags = Column(JSON, nullable=True, comment="风险标签")
    content_summary = Column(Text, nullable=True, comment="内容摘要")
    object_type = Column(String(100), nullable=True, comment="对象类型")
    object_id = Column(Integer, nullable=True, comment="对象ID")
    result = Column(JSON, nullable=True, comment="审计结果")


class AskRecord(Base, BaseModelMixin):
    """智能问数记录表"""
    __tablename__ = "ask_records"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    question = Column(Text, nullable=False, comment="问题")
    answer = Column(Text, nullable=True, comment="回答")
    data_source = Column(String(100), nullable=True, comment="数据源")
    chart_type = Column(String(50), nullable=True, comment="图表类型")
    chart_config = Column(JSON, nullable=True, comment="图表配置")
    result_data = Column(JSON, nullable=True, comment="结果数据")
    is_saved = Column(Boolean, default=False, comment="是否收藏")


class AskSqlLog(Base, BaseModelMixin):
    """问数SQL日志表"""
    __tablename__ = "ask_sql_logs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    ask_record_id = Column(Integer, ForeignKey("ask_records.id"), nullable=False, index=True, comment="问数记录ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    sql = Column(Text, nullable=False, comment="生成的SQL")
    is_valid = Column(Boolean, default=True, comment="是否校验通过")
    executed = Column(Boolean, default=False, comment="是否执行")
    result_rows = Column(Integer, nullable=True, comment="结果行数")
    error_message = Column(Text, nullable=True, comment="错误信息")
    executed_at = Column(DateTime, nullable=True, comment="执行时间")