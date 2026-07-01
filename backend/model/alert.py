"""审计风控相关数据模型"""
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, DateTime
from database.session import Base
from model.base import BaseModelMixin


class SensitiveWord(Base, BaseModelMixin):
    """敏感词表"""
    __tablename__ = "sensitive_words"

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True, comment="租户ID，空表示平台级")
    word = Column(String(255), nullable=False, comment="敏感词")
    category = Column(String(50), nullable=False, comment="类别: political/porn/insult/violence/ad/privacy/secret/illegal/custom")
    risk_level = Column(String(20), nullable=False, default="medium", comment="风险等级: low/medium/high")
    is_enabled = Column(Boolean, default=True, comment="是否启用")
    is_regex = Column(Boolean, default=False, comment="是否为正则表达式")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True, comment="创建人ID")


class AlertRecord(Base, BaseModelMixin):
    """告警记录表"""
    __tablename__ = "alert_records"

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    alert_type = Column(String(50), nullable=False, comment="告警类型: message_high_risk/data_negative")
    source_type = Column(String(50), nullable=True, comment="来源对象类型: message/data")
    source_id = Column(Integer, nullable=True, comment="来源对象ID")
    title = Column(String(255), nullable=False, comment="告警标题")
    content = Column(Text, nullable=True, comment="告警内容")
    risk_level = Column(String(20), nullable=True, comment="风险等级")
    status = Column(String(20), default="unresolved", comment="状态: unresolved/resolved/ignored")
    notified_channels = Column(JSON, nullable=True, comment="已通知渠道")
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True, comment="处理人ID")
    resolved_at = Column(DateTime, nullable=True, comment="处理时间")


class AlertRule(Base, BaseModelMixin):
    """告警规则表"""
    __tablename__ = "alert_rules"

    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True, comment="租户ID，空表示平台默认")
    rule_name = Column(String(100), nullable=False, comment="规则名称")
    alert_type = Column(String(50), nullable=False, comment="告警类型: message_high_risk/data_negative")
    trigger_condition = Column(JSON, nullable=True, comment="触发条件，如 {'risk_level': 'high'}")
    channels = Column(JSON, nullable=True, comment="通知渠道配置，如 {'in_app': true, 'browser': true, 'email': false}")
    enabled = Column(Boolean, default=True, comment="是否启用")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True, comment="创建人ID")
