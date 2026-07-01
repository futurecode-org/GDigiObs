"""Chroma 配置 Schema"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class ChromaConfigCreate(BaseModel):
    """创建 Chroma 配置请求"""
    name: str = Field(..., max_length=100, description="配置名称")
    host: str = Field(..., max_length=500, description="Chroma 服务器地址")
    port: int = Field(8000, description="Chroma 端口")
    collection_prefix: str = Field("kb", max_length=50, description="Collection 前缀")
    visibility: str = Field("platform", description="可见范围: platform/tenant/personal")
    status: str = Field("enabled", description="状态: enabled/disabled")
    remark: Optional[str] = Field(None, description="备注")


class ChromaConfigUpdate(BaseModel):
    """更新 Chroma 配置请求"""
    name: Optional[str] = Field(None, max_length=100)
    host: Optional[str] = Field(None, max_length=500)
    port: Optional[int] = None
    collection_prefix: Optional[str] = Field(None, max_length=50)
    visibility: Optional[str] = None
    status: Optional[str] = None
    remark: Optional[str] = None


class ChromaConfigResponse(BaseModel):
    """Chroma 配置响应"""
    id: int
    name: str
    host: str
    port: int
    collection_prefix: str
    visibility: str
    status: str
    remark: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
