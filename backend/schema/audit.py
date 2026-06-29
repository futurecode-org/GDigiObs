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
