"""技能管理相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class SkillCreate(BaseModel):
    """创建技能请求"""
    name: str = Field(..., max_length=100, description="技能名称")
    type: str = Field(..., description="技能类型: function_call/mcp/skill")
    description: Optional[str] = Field(None, description="描述")
    config: Optional[Dict[str, Any]] = Field(None, description="技能配置")
    input_schema: Optional[Dict[str, Any]] = Field(None, description="入参Schema")
    output_schema: Optional[Dict[str, Any]] = Field(None, description="出参Schema")
    visibility: str = Field("personal", description="可见范围: personal/tenant/public")
    model_id: Optional[int] = Field(None, description="绑定模型ID")
    status: Optional[str] = Field("enabled", description="状态: enabled/disabled")


class SkillUpdate(BaseModel):
    """更新技能请求"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    visibility: Optional[str] = None
    model_id: Optional[int] = None
    status: Optional[str] = None


class SkillResponse(BaseModel):
    """技能响应"""
    id: int
    tenant_id: int
    owner_id: int
    name: str
    type: str
    description: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    input_schema: Optional[Dict[str, Any]] = None
    output_schema: Optional[Dict[str, Any]] = None
    visibility: str
    review_status: str
    status: str
    model_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class SkillListResponse(BaseModel):
    """技能列表响应"""
    items: List[SkillResponse]
    total: int
    page: int
    page_size: int


class SkillTestRequest(BaseModel):
    """测试技能请求"""
    input_data: Optional[Dict[str, Any]] = Field(default_factory=dict, description="测试入参")


class SkillTestResponse(BaseModel):
    """测试技能响应"""
    success: bool
    output: Optional[Any] = None
    message: Optional[str] = None
    duration_ms: Optional[int] = None


class SkillCallLogResponse(BaseModel):
    """技能调用记录响应"""
    id: int
    skill_id: int
    tenant_id: Optional[int] = None
    caller_id: Optional[int] = None
    source: Optional[str] = None
    input_data: Optional[Dict[str, Any]] = None
    output_data: Optional[Dict[str, Any]] = None
    status: str
    duration_ms: Optional[int] = None
    error_message: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SkillCallLogListResponse(BaseModel):
    """技能调用记录列表响应"""
    items: List[SkillCallLogResponse]
    total: int
    page: int
    page_size: int
