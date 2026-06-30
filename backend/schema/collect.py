"""数据采集相关数据模型"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


# ==================== 采集平台 ====================


class CollectPlatformCreate(BaseModel):
    """创建采集平台请求"""

    name: str = Field(..., max_length=100, description="平台名称")
    platform_type: str = Field(
        ...,
        max_length=50,
        description="平台类型: news/rss/social/forum/video/industry/other",
    )
    default_method: str = Field("api", description="默认采集方式: api/rss/crawler")
    config_schema: Optional[Dict] = Field(None, description="配置Schema")
    description: Optional[str] = Field(None, max_length=500, description="平台描述")


class CollectPlatformUpdate(BaseModel):
    """更新采集平台请求"""

    name: Optional[str] = Field(None, max_length=100, description="平台名称")
    platform_type: Optional[str] = Field(None, max_length=50, description="平台类型")
    default_method: Optional[str] = Field(None, description="默认采集方式")
    config_schema: Optional[Dict] = Field(None, description="配置Schema")
    description: Optional[str] = Field(None, max_length=500, description="平台描述")
    status: Optional[str] = Field(None, description="状态: enabled/disabled")


class CollectPlatformResponse(BaseModel):
    """采集平台响应"""

    id: int
    name: str
    platform_type: str
    default_method: str
    config_schema: Optional[Dict] = None
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== 采集任务 ====================


class CollectTaskCreate(BaseModel):
    """创建采集任务请求"""

    name: str = Field(..., max_length=100, description="任务名称")
    platform_id: int = Field(..., description="平台ID")
    collect_method: str = Field(..., description="采集方式: api/rss/crawler")
    source_url: Optional[str] = Field(None, description="采集地址: URL/API/RSS地址")
    request_config: Optional[Dict[str, Any]] = Field(
        None, description="请求配置: Header/参数/认证信息"
    )
    parse_rule: Optional[Dict[str, Any]] = Field(
        None, description="解析规则: 标题/正文/作者/发布时间等提取规则"
    )
    schedule_config: Optional[Dict[str, Any]] = Field(
        None, description="定时配置: Cron表达式或周期配置"
    )
    is_public: bool = Field(False, description="是否公开")


class CollectTaskUpdate(BaseModel):
    """更新采集任务请求"""

    name: Optional[str] = Field(None, max_length=100, description="任务名称")
    platform_id: Optional[int] = Field(None, description="平台ID")
    collect_method: Optional[str] = Field(None, description="采集方式")
    source_url: Optional[str] = Field(None, description="采集地址")
    request_config: Optional[Dict[str, Any]] = Field(None, description="请求配置")
    parse_rule: Optional[Dict[str, Any]] = Field(None, description="解析规则")
    schedule_config: Optional[Dict[str, Any]] = Field(None, description="定时配置")
    is_public: Optional[bool] = Field(None, description="是否公开")


class CollectTaskResponse(BaseModel):
    """采集任务响应"""

    id: int
    tenant_id: int
    name: str
    platform_id: int
    platform_name: Optional[str] = None
    platform_type: Optional[str] = None
    collect_method: str
    source_url: Optional[str] = None
    request_config: Optional[Dict[str, Any]] = None
    parse_rule: Optional[Dict[str, Any]] = None
    schedule_config: Optional[Dict[str, Any]] = None
    is_public: bool
    status: str
    last_run_at: Optional[datetime] = None
    fail_count: int = 0
    created_by: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== 采集数据（原文存档）====================


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
    raw_content_type: Optional[str] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    sentiment: Optional[str] = None
    tags: Optional[Dict] = None
    entities: Optional[Dict] = None
    is_public: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class CollectedItemDetailResponse(CollectedItemResponse):
    """采集数据详情响应（含原文存档）"""

    raw_content: Optional[str] = None


class CollectedItemUpdate(BaseModel):
    """更新采集数据请求"""

    title: Optional[str] = None
    content: Optional[str] = None
    sentiment: Optional[str] = None
    tags: Optional[Dict] = None
    entities: Optional[Dict] = None
    is_public: Optional[bool] = None


# ==================== 采集日志 ====================


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


# ==================== 采集执行结果 ====================


class CollectRunResult(BaseModel):
    """采集执行结果"""

    task_id: int
    status: str = Field(description="执行状态: success/failed/partial")
    items_count: int = Field(default=0, description="采集条数")
    error_message: Optional[str] = Field(None, description="错误信息")
    duration_seconds: Optional[int] = Field(None, description="耗时秒数")
