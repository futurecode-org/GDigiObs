from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from database.session import Base
from model.base import BaseModelMixin


class DifyProvider(Base, BaseModelMixin):
    """Dify Provider 表"""
    __tablename__ = "dify_providers"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True, comment="租户ID，空表示平台级")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True, comment="创建人")
    name = Column(String(100), nullable=False, comment="Provider名称")
    base_url = Column(String(500), nullable=False, comment="Dify API Base URL")
    api_key_encrypted = Column(Text, nullable=False, comment="加密API Key")
    visibility = Column(String(20), default="platform", comment="可见范围: platform/tenant/personal")
    status = Column(String(20), default="enabled", comment="状态: enabled/disabled")
    remark = Column(Text, nullable=True, comment="备注")


class DifyApp(Base, BaseModelMixin):
    """Dify 应用表"""
    __tablename__ = "dify_apps"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True, comment="租户ID")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True, comment="创建人")
    provider_id = Column(Integer, ForeignKey("dify_providers.id"), nullable=False, index=True, comment="Dify Provider ID")
    name = Column(String(100), nullable=False, comment="应用名称")
    app_type = Column(String(30), nullable=False, index=True, comment="应用类型: workflow/chatflow/chatbot/agent/text_generator")
    api_endpoint = Column(String(200), nullable=False, comment="API路径")
    response_mode = Column(String(20), default="blocking", comment="响应模式: blocking/streaming")
    input_schema = Column(JSON, nullable=True, comment="输入Schema")
    output_schema = Column(JSON, nullable=True, comment="输出Schema")
    default_inputs = Column(JSON, nullable=True, comment="默认输入")
    conversation_enabled = Column(Boolean, default=True, comment="是否启用会话")
    visibility = Column(String(20), default="personal", comment="可见范围: personal/tenant/public")
    review_status = Column(String(20), default="approved", comment="审核状态: draft/pending/approved/rejected")
    status = Column(String(20), default="enabled", comment="状态: enabled/disabled")


class DifyConversation(Base, BaseModelMixin):
    """Dify 会话映射表"""
    __tablename__ = "dify_conversations"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    dify_app_id = Column(Integer, ForeignKey("dify_apps.id"), nullable=False, index=True, comment="Dify App ID")
    system_conversation_type = Column(String(30), nullable=False, comment="系统会话类型: assistant/im/agent/workflow")
    system_conversation_id = Column(Integer, nullable=True, comment="系统会话ID")
    dify_conversation_id = Column(String(100), nullable=False, comment="Dify会话ID")
    title = Column(String(200), nullable=True, comment="会话标题")
    status = Column(String(20), default="active", comment="状态: active/closed")


class DifyCallLog(Base, BaseModelMixin):
    """Dify 调用日志表"""
    __tablename__ = "dify_call_logs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="调用用户")
    provider_id = Column(Integer, ForeignKey("dify_providers.id"), nullable=False, index=True, comment="Dify Provider ID")
    dify_app_id = Column(Integer, ForeignKey("dify_apps.id"), nullable=False, index=True, comment="Dify App ID")
    app_type = Column(String(30), nullable=False, comment="应用类型")
    call_scene = Column(String(50), nullable=False, comment="调用场景: ask/chat/agent/workflow/skill/text_generation")
    request_inputs = Column(JSON, nullable=True, comment="输入变量摘要")
    request_query = Column(Text, nullable=True, comment="用户输入")
    response_mode = Column(String(20), default="blocking", comment="响应模式")
    dify_task_id = Column(String(100), nullable=True, comment="Dify任务ID")
    dify_message_id = Column(String(100), nullable=True, comment="Dify消息ID")
    dify_conversation_id = Column(String(100), nullable=True, comment="Dify会话ID")
    answer_summary = Column(Text, nullable=True, comment="输出摘要")
    dify_metadata = Column(JSON, nullable=True, comment="Dify返回metadata")
    token_usage = Column(JSON, nullable=True, comment="Token用量")
    latency_ms = Column(Integer, nullable=True, comment="耗时(毫秒)")
    status = Column(String(20), default="success", comment="状态: success/failed/canceled")
    error_message = Column(Text, nullable=True, comment="错误信息")


class ChatAssistant(Base, BaseModelMixin):
    """聊天助手表"""
    __tablename__ = "chat_assistants"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="创建人")
    name = Column(String(100), nullable=False, comment="助手名称")
    avatar_file_id = Column(Integer, ForeignKey("file_assets.id"), nullable=True, comment="头像")
    description = Column(Text, nullable=True, comment="描述")
    assistant_engine = Column(String(30), nullable=False, comment="助手引擎: native_chat/dify_chatbot/dify_chatflow/dify_agent")
    model_id = Column(Integer, ForeignKey("model_configs.id"), nullable=True, comment="原生模型ID")
    dify_app_id = Column(Integer, ForeignKey("dify_apps.id"), nullable=True, comment="Dify App ID")
    system_prompt = Column(Text, nullable=True, comment="原生助手提示词")
    visibility = Column(String(20), default="personal", comment="可见范围: personal/tenant/public")
    status = Column(String(20), default="enabled", comment="状态: enabled/disabled")