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
