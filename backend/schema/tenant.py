from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime


class TenantCreate(BaseModel):
    """创建租户请求"""
    name: str = Field(..., max_length=100, description="租户名称")
    type: str = Field(default="enterprise", description="租户类型: enterprise/personal")
    admin_user_id: Optional[int] = Field(None, description="管理员用户ID")
    config: Optional[Dict] = Field(None, description="租户配置")


class TenantUpdate(BaseModel):
    """更新租户请求"""
    name: Optional[str] = Field(None, max_length=100, description="租户名称")
    config: Optional[Dict] = Field(None, description="租户配置")


class TenantResponse(BaseModel):
    """租户响应"""
    id: int = Field(..., description="租户ID")
    name: str = Field(..., description="租户名称")
    type: str = Field(..., description="租户类型")
    status: str = Field(..., description="状态")
    admin_user_id: Optional[int] = Field(None, description="管理员用户ID")
    config: Optional[Dict] = Field(None, description="租户配置")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")
    
    class Config:
        from_attributes = True


class TenantListResponse(BaseModel):
    """租户列表响应"""
    items: List[TenantResponse] = Field(default_factory=list, description="租户列表")
    total: int = Field(default=0, description="总数")
    page: int = Field(default=1, description="当前页")
    page_size: int = Field(default=20, description="每页大小")