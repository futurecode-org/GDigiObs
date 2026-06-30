from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime


class DifyProviderCreate(BaseModel):
    """创建 Dify Provider"""
    name: str = Field(..., description="Provider名称")
    base_url: str = Field(..., description="Dify API Base URL")
    api_key: str = Field(..., description="API Key")
    visibility: str = Field("platform", description="可见范围: platform/tenant/personal")
    status: str = Field("enabled", description="状态: enabled/disabled")
    remark: Optional[str] = Field(None, description="备注")


class DifyProviderUpdate(BaseModel):
    """更新 Dify Provider"""
    name: Optional[str] = Field(None, description="Provider名称")
    base_url: Optional[str] = Field(None, description="Dify API Base URL")
    api_key: Optional[str] = Field(None, description="API Key")
    visibility: Optional[str] = Field(None, description="可见范围")
    status: Optional[str] = Field(None, description="状态")
    remark: Optional[str] = Field(None, description="备注")


class DifyProviderResponse(BaseModel):
    """Dify Provider 响应"""
    model_config = {"from_attributes": True}
    id: int
    name: str
    base_url: str
    visibility: str
    status: str
    remark: Optional[str]
    created_at: datetime
    updated_at: datetime


class DifyAppCreate(BaseModel):
    """创建 Dify App"""
    name: str = Field(..., description="应用名称")
    provider_id: int = Field(..., description="Dify Provider ID")
    app_type: str = Field(..., description="应用类型: workflow/chatflow/chatbot/agent/text_generator")
    api_endpoint: str = Field(..., description="API路径")
    response_mode: str = Field("blocking", description="响应模式: blocking/streaming")
    input_schema: Optional[Dict] = Field(None, description="输入Schema")
    output_schema: Optional[Dict] = Field(None, description="输出Schema")
    default_inputs: Optional[Dict] = Field(None, description="默认输入")
    conversation_enabled: bool = Field(True, description="是否启用会话")
    visibility: str = Field("personal", description="可见范围: personal/tenant/public")
    status: str = Field("enabled", description="状态: enabled/disabled")


class DifyAppUpdate(BaseModel):
    """更新 Dify App"""
    name: Optional[str] = Field(None, description="应用名称")
    provider_id: Optional[int] = Field(None, description="Dify Provider ID")
    api_endpoint: Optional[str] = Field(None, description="API路径")
    response_mode: Optional[str] = Field(None, description="响应模式")
    input_schema: Optional[Dict] = Field(None, description="输入Schema")
    output_schema: Optional[Dict] = Field(None, description="输出Schema")
    default_inputs: Optional[Dict] = Field(None, description="默认输入")
    conversation_enabled: Optional[bool] = Field(None, description="是否启用会话")
    visibility: Optional[str] = Field(None, description="可见范围")
    status: Optional[str] = Field(None, description="状态")


class DifyAppResponse(BaseModel):
    """Dify App 响应"""
    model_config = {"from_attributes": True}
    id: int
    name: str
    provider_id: int
    app_type: str
    api_endpoint: str
    response_mode: str
    input_schema: Optional[Dict]
    output_schema: Optional[Dict]
    default_inputs: Optional[Dict]
    conversation_enabled: bool
    visibility: str
    review_status: str
    status: str
    created_at: datetime
    updated_at: datetime


class DifyInvokeRequest(BaseModel):
    """调用 Dify App 请求"""
    inputs: Dict = Field(default_factory=dict, description="输入变量")
    query: Optional[str] = Field(None, description="用户输入")
    conversation_id: Optional[str] = Field(None, description="Dify会话ID")
    files: Optional[List[Dict]] = Field(None, description="多模态文件")
    scene: str = Field("chat", description="调用场景: ask/chat/agent/workflow/skill/text_generation")


class DifyInvokeResponse(BaseModel):
    """调用 Dify App 响应"""
    success: bool
    answer: Optional[str] = Field(None, description="回答内容")
    conversation_id: Optional[str] = Field(None, description="Dify会话ID")
    task_id: Optional[str] = Field(None, description="Dify任务ID")
    message_id: Optional[str] = Field(None, description="Dify消息ID")
    metadata: Optional[Dict] = Field(None, description="元数据")
    token_usage: Optional[Dict] = Field(None, description="Token用量")


class DifyCallLogResponse(BaseModel):
    """Dify 调用日志响应"""
    id: int
    tenant_id: int
    user_id: int
    dify_app_id: int
    app_type: str
    call_scene: str
    request_inputs: Optional[Dict]
    request_query: Optional[str]
    response_mode: str
    dify_task_id: Optional[str]
    dify_message_id: Optional[str]
    dify_conversation_id: Optional[str]
    answer_summary: Optional[str]
    token_usage: Optional[Dict]
    latency_ms: Optional[int]
    status: str
    error_message: Optional[str]
    created_at: datetime


class ChatAssistantCreate(BaseModel):
    """创建聊天助手"""
    name: str = Field(..., description="助手名称")
    avatar_file_id: Optional[int] = Field(None, description="头像")
    description: Optional[str] = Field(None, description="描述")
    assistant_engine: str = Field(..., description="助手引擎: native_chat/dify_chatbot/dify_chatflow/dify_agent")
    model_id: Optional[int] = Field(None, description="原生模型ID")
    dify_app_id: Optional[int] = Field(None, description="Dify App ID")
    system_prompt: Optional[str] = Field(None, description="原生助手提示词")
    visibility: str = Field("personal", description="可见范围: personal/tenant/public")
    status: str = Field("enabled", description="状态: enabled/disabled")


class ChatAssistantUpdate(BaseModel):
    """更新聊天助手"""
    name: Optional[str] = Field(None, description="助手名称")
    avatar_file_id: Optional[int] = Field(None, description="头像")
    description: Optional[str] = Field(None, description="描述")
    assistant_engine: Optional[str] = Field(None, description="助手引擎")
    model_id: Optional[int] = Field(None, description="原生模型ID")
    dify_app_id: Optional[int] = Field(None, description="Dify App ID")
    system_prompt: Optional[str] = Field(None, description="原生助手提示词")
    visibility: Optional[str] = Field(None, description="可见范围")
    status: Optional[str] = Field(None, description="状态")


class ChatAssistantResponse(BaseModel):
    """聊天助手响应"""
    model_config = {"from_attributes": True}
    id: int
    name: str
    avatar_file_id: Optional[int]
    description: Optional[str]
    assistant_engine: str
    model_id: Optional[int]
    dify_app_id: Optional[int]
    system_prompt: Optional[str]
    visibility: str
    status: str
    created_at: datetime
    updated_at: datetime


class ChatRequest(BaseModel):
    """与助手对话请求"""
    message: str = Field(..., description="用户消息")
    conversation_id: Optional[int] = Field(None, description="系统会话ID")
    files: Optional[List[Dict]] = Field(None, description="多模态文件")