"""技能管理相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class SkillCreate(BaseModel):
    """创建技能请求"""
    name: str = Field(..., max_length=100, description="技能名称")
    type: str = Field(..., description="技能类型: function_call/mcp/skill")
    description: Optional[str] = Field(None, description="描述")
    config: Optional[Dict] = Field(None, description="技能配置")
    input_schema: Optional[Dict] = Field(None, description="入参Schema")
    output_schema: Optional[Dict] = Field(None, description="出参Schema")
    visibility: str = Field("personal", description="可见范围: personal/tenant/public")


class SkillUpdate(BaseModel):
    """更新技能请求"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    config: Optional[Dict] = None
    input_schema: Optional[Dict] = None
    output_schema: Optional[Dict] = None
    visibility: Optional[str] = None


class SkillResponse(BaseModel):
    """技能响应"""
    id: int
    tenant_id: int
    owner_id: int
    name: str
    type: str
    description: Optional[str] = None
    config: Optional[Dict] = None
    input_schema: Optional[Dict] = None
    output_schema: Optional[Dict] = None
    visibility: str
    review_status: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class SkillListResponse(BaseModel):
    """技能列表响应"""
    items: List[SkillResponse]
    total: int
    page: int
    page_size: int