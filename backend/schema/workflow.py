"""工作流相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class WorkflowCreate(BaseModel):
    """创建工作流请求"""
    name: str = Field(..., max_length=100, description="工作流名称")
    description: Optional[str] = Field(None, description="描述")
    nodes: List[Dict] = Field(..., description="节点配置")
    edges: List[Dict] = Field(..., description="连线配置")
    trigger_type: str = Field("manual", description="触发类型: schedule/manual/chat/webhook")
    schedule_config: Optional[Dict] = Field(None, description="定时配置")


class WorkflowUpdate(BaseModel):
    """更新工作流请求"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    nodes: Optional[List[Dict]] = None
    edges: Optional[List[Dict]] = None
    trigger_type: Optional[str] = None
    schedule_config: Optional[Dict] = None


class WorkflowResponse(BaseModel):
    """工作流响应"""
    id: int
    tenant_id: int
    owner_id: int
    name: str
    description: Optional[str] = None
    nodes: List[Dict]
    edges: List[Dict]
    trigger_type: str
    schedule_config: Optional[Dict] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class WorkflowRunResponse(BaseModel):
    """工作流执行记录响应"""
    id: int
    workflow_id: int
    trigger_type: str
    input_data: Optional[Dict] = None
    output_data: Optional[Dict] = None
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class WorkflowRunCreate(BaseModel):
    """执行工作流请求"""
    input_data: Optional[Dict] = None


class WorkflowListResponse(BaseModel):
    """工作流列表响应"""
    items: List[WorkflowResponse]
    total: int
    page: int
    page_size: int