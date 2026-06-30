from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, DateTime
from database.session import Base
from model.base import BaseModelMixin


class ModelConfig(Base, BaseModelMixin):
    """模型配置表"""
    __tablename__ = "model_configs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True, comment="租户ID(平台模型为null)")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="创建人ID")
    name = Column(String(100), nullable=False, comment="模型名称")
    model_key = Column(String(100), nullable=False, comment="API模型标识")
    model_type = Column(String(20), nullable=False, comment="模型类型: llm/embedding/rerank")
    api_type = Column(String(20), nullable=False, comment="API类型: openai/anthropic/ollama/custom")
    base_url = Column(String(500), nullable=False, comment="API地址")
    api_key_encrypted = Column(Text, nullable=True, comment="加密API Key")
    support_tool_call = Column(Boolean, default=False, comment="是否支持工具调用")
    support_vision = Column(Boolean, default=False, comment="是否支持图像识别")
    support_reasoning = Column(Boolean, default=False, comment="是否支持深度思考")
    context_length = Column(Integer, default=4096, comment="上下文长度")
    max_tokens = Column(Integer, default=2048, comment="最大Token")
    default_config = Column(JSON, nullable=True, comment="默认参数配置")
    temperature = Column(JSON, nullable=True, comment="默认温度")
    visibility = Column(String(20), default="tenant", comment="可见范围: platform/tenant/personal")
    status = Column(String(20), default="enabled", comment="状态")
    deleted_at = Column(DateTime, nullable=True, comment="删除时间")