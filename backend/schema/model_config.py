"""模型配置相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class ModelConfigCreate(BaseModel):
    """创建模型配置请求"""
    name: str = Field(..., max_length=100, description="模型名称")
    model_key: str = Field(..., max_length=100, description="API模型标识")
    model_type: str = Field(..., description="模型类型: llm/embedding/rerank")
    api_type: str = Field(..., description="API类型: openai/anthropic/ollama/custom")
    base_url: str = Field(..., max_length=500, description="API地址")
    api_key: Optional[str] = Field(None, description="API Key")
    support_tool_call: bool = Field(False, description="是否支持工具调用")
    support_vision: bool = Field(False, description="是否支持图像识别")
    support_reasoning: bool = Field(False, description="是否支持深度思考")
    context_length: int = Field(4096, description="上下文长度")
    max_tokens: int = Field(2048, description="最大Token")
    default_config: Optional[Dict] = Field(None, description="默认参数配置")
    visibility: str = Field("tenant", description="可见范围: platform/tenant/personal")


class ModelConfigUpdate(BaseModel):
    """更新模型配置请求"""
    name: Optional[str] = Field(None, max_length=100)
    model_key: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    support_tool_call: Optional[bool] = None
    support_vision: Optional[bool] = None
    support_reasoning: Optional[bool] = None
    context_length: Optional[int] = None
    max_tokens: Optional[int] = None
    default_config: Optional[Dict] = None
    visibility: Optional[str] = None


class ModelConfigResponse(BaseModel):
    """模型配置响应"""
    id: int
    tenant_id: Optional[int] = None
    owner_id: Optional[int] = None
    name: str
    model_key: str
    model_type: str
    api_type: str
    base_url: str
    support_tool_call: bool
    support_vision: bool
    support_reasoning: bool
    context_length: int
    max_tokens: int
    default_config: Optional[Dict] = None
    visibility: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ModelConfigListResponse(BaseModel):
    """模型配置列表响应"""
    items: List[ModelConfigResponse]
    total: int
    page: int
    page_size: int