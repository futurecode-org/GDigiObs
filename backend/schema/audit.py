"""审计日志相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class OperationLogResponse(BaseModel):
    """操作日志响应"""
    id: int
    tenant_id: Optional[int] = None
    user_id: Optional[int] = None
    module: str
    action: str
    object_type: Optional[str] = None
    object_id: Optional[int] = None
    before_data: Optional[Dict] = None
    after_data: Optional[Dict] = None
    ip: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class AuditLogResponse(BaseModel):
    """审计日志响应"""
    id: int
    tenant_id: int
    user_id: Optional[int] = None
    audit_type: str
    risk_level: str
    risk_tags: Optional[List[str]] = None
    content_summary: Optional[str] = None
    result: Optional[Dict] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class OperationLogListResponse(BaseModel):
    """操作日志列表响应"""
    items: List[OperationLogResponse]
    total: int
    page: int
    page_size: int


class AskRecordCreate(BaseModel):
    """智能问数创建请求"""
    question: str = Field(..., min_length=1, description="问题")


class AskRecordUpdate(BaseModel):
    """智能问数更新请求"""
    answer: Optional[str] = None
    data_source: Optional[str] = None
    chart_type: Optional[str] = None
    chart_config: Optional[Dict] = None
    result_data: Optional[Dict] = None


# ==================== 聊天消息审计 ====================

class MessageReviewRequest(BaseModel):
    """消息人工复核请求"""
    audit_status: str = Field(..., description="审计状态: passed/blocked/reviewing")
    risk_level: Optional[str] = Field(None, description="风险等级: none/low/medium/high")
    risk_tags: Optional[List[str]] = Field(None, description="风险标签")


# ==================== 敏感词库 ====================

class SensitiveWordCreate(BaseModel):
    """创建敏感词请求"""
    word: str = Field(..., min_length=1, max_length=255, description="敏感词")
    category: str = Field(default="custom", description="类别")
    risk_level: str = Field(default="medium", description="风险等级: low/medium/high")
    scope: str = Field(default="tenant", description="适用范围: platform/tenant")
    is_enabled: bool = Field(default=True, description="是否启用")
    is_regex: bool = Field(default=False, description="是否为正则")


class SensitiveWordUpdate(BaseModel):
    """更新敏感词请求"""
    word: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = None
    risk_level: Optional[str] = None
    scope: Optional[str] = None
    is_enabled: Optional[bool] = None
    is_regex: Optional[bool] = None


class SensitiveWordBatchImport(BaseModel):
    """批量导入敏感词请求"""
    words: str = Field(..., description="敏感词文本，支持换行、逗号、分号分隔")
    category: str = Field(default="custom", description="类别")
    risk_level: str = Field(default="medium", description="风险等级")
    scope: str = Field(default="tenant", description="适用范围: platform/tenant")


# ==================== 告警规则 ====================

class AlertRuleUpdate(BaseModel):
    """更新告警规则请求"""
    rule_name: Optional[str] = None
    trigger_condition: Optional[Dict] = None
    channels: Optional[Dict] = None
    enabled: Optional[bool] = None


# ==================== AI 检测 ====================

class ChatDetectRequest(BaseModel):
    """聊天内容 AI 检测请求"""
    content: str = Field(..., min_length=1, description="要检测的内容")
    model_id: Optional[int] = Field(None, description="指定模型 ID，为空则使用默认模型")


class ChatDetectResponse(BaseModel):
    """聊天内容 AI 检测结果"""
    model_id: int
    model_name: str
    risk_level: str
    risk_tags: List[str]
    reason: str
    success: bool
    error: Optional[str] = None


class ChatMessageDetectRequest(BaseModel):
    """单条消息 AI 检测请求"""
    model_id: Optional[int] = Field(None, description="指定模型 ID，为空则使用默认模型")


class ChatDetectBatchRequest(BaseModel):
    """批量 AI 检测请求"""
    model_id: Optional[int] = Field(None, description="指定模型 ID，为空则使用默认模型")
    limit: Optional[int] = Field(50, ge=1, le=200, description="每次扫描最大消息数")


class ChatMessageAuditResponse(BaseModel):
    """聊天审计消息响应"""
    id: int
    conversation_id: int
    sender_id: int
    sender_name: str
    content: Optional[str] = None
    message_type: str
    audit_status: Optional[str] = None
    risk_level: Optional[str] = None
    risk_tags: Optional[List[str]] = None
    ai_risk_level: Optional[str] = None
    ai_risk_tags: Optional[List[str]] = None
    ai_detected_at: Optional[str] = None
    ai_model_id: Optional[int] = None
    ai_reason: Optional[str] = None
    created_at: Optional[str] = None


class ChatMessageAuditListResponse(BaseModel):
    """聊天审计消息列表响应"""
    items: List[ChatMessageAuditResponse]
    total: int
    page: int
    page_size: int


class ChatDetectBatchResponse(BaseModel):
    """批量 AI 检测响应"""
    processed: int
    failed: int
    high_risk: int
    medium_risk: int
    model_id: int
    model_name: str
