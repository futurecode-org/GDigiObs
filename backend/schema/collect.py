"""数据采集相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class CollectPlatformCreate(BaseModel):
    """创建采集平台请求"""
    name: str = Field(..., max_length=100, description="平台名称")
    platform_type: str = Field(..., max_length=50, description="平台类型")
    default_method: str = Field("api", description="默认采集方式: api/rss/crawler")
    config_schema: Optional[Dict] = Field(None, description="配置Schema")


class CollectPlatformResponse(BaseModel):
    """采集平台响应"""
    id: int
    name: str
    platform_type: str
    default_method: str
    config_schema: Optional[Dict] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class CollectTaskCreate(BaseModel):
    """创建采集任务请求"""
    name: str = Field(..., max_length=100, description="任务名称")
    platform_id: int = Field(..., description="平台ID")
    collect_method: str = Field(..., description="采集方式: api/rss/crawler")
    source_url: Optional[str] = Field(None, description="采集地址")
    request_config: Optional[Dict] = Field(None, description="请求配置")
    parse_rule: Optional[Dict] = Field(None, description="解析规则")
    schedule_config: Optional[Dict] = Field(None, description="定时配置")
    is_public: bool = Field(False, description="是否公开")


class CollectTaskUpdate(BaseModel):
    """更新采集任务请求"""
    name: Optional[str] = Field(None, max_length=100)
    source_url: Optional[str] = None
    request_config: Optional[Dict] = None
    parse_rule: Optional[Dict] = None
    schedule_config: Optional[Dict] = None
    is_public: Optional[bool] = None


class CollectTaskResponse(BaseModel):
    """采集任务响应"""
    id: int
    tenant_id: int
    name: str
    platform_id: int
    collect_method: str
    source_url: Optional[str] = None
    request_config: Optional[Dict] = None
    parse_rule: Optional[Dict] = None
    schedule_config: Optional[Dict] = None
    is_public: bool
    status: str
    last_run_at: Optional[datetime] = None
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class CollectedItemResponse(BaseModel):
    """采集数据响应"""
    id: int
    tenant_id: int
    task_id: int
    title: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    publish_at: Optional[datetime] = None
    source_platform: Optional[str] = None
    source_url: Optional[str] = None
    sentiment: Optional[str] = None
    tags: Optional[Dict] = None
    entities: Optional[Dict] = None
    is_public: bool
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class CollectedItemUpdate(BaseModel):
    """更新采集数据请求"""
    title: Optional[str] = None
    content: Optional[str] = None
    sentiment: Optional[str] = None
    tags: Optional[Dict] = None
    entities: Optional[Dict] = None
    is_public: Optional[bool] = None


class CollectLogResponse(BaseModel):
    """采集日志响应"""
    id: int
    tenant_id: int
    task_id: int
    run_at: datetime
    status: str
    items_count: int
    error_message: Optional[str] = None
    duration_seconds: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class CollectTaskListResponse(BaseModel):
    """采集任务列表响应"""
    items: List[CollectTaskResponse]
    total: int
    page: int
    page_size: int


class CollectedItemListResponse(BaseModel):
    """采集数据列表响应"""
    items: List[CollectedItemResponse]
    total: int
    page: int
    page_size: int