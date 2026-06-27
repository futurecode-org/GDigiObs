"""数字员工相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class AgentCreate(BaseModel):
    """创建数字员工请求"""
    name: str = Field(..., max_length=100, description="名称")
    avatar_file_id: Optional[int] = Field(None, description="头像文件ID")
    role_description: Optional[str] = Field(None, description="角色描述")
    system_prompt: Optional[str] = Field(None, description="系统提示词")
    model_id: Optional[int] = Field(None, description="默认模型ID")
    skill_ids: Optional[List[int]] = Field(None, description="绑定的技能ID列表")
    knowledge_base_ids: Optional[List[int]] = Field(None, description="绑定的知识库ID列表")
    workflow_ids: Optional[List[int]] = Field(None, description="绑定的工作流ID列表")
    trigger_config: Optional[Dict] = Field(None, description="触发配置")
    push_config: Optional[Dict] = Field(None, description="推送配置")
    visibility: str = Field("personal", description="可见范围: personal/tenant/public")


class AgentUpdate(BaseModel):
    """更新数字员工请求"""
    name: Optional[str] = Field(None, max_length=100)
    avatar_file_id: Optional[int] = None
    role_description: Optional[str] = None
    system_prompt: Optional[str] = None
    model_id: Optional[int] = None
    skill_ids: Optional[List[int]] = None
    knowledge_base_ids: Optional[List[int]] = None
    workflow_ids: Optional[List[int]] = None
    trigger_config: Optional[Dict] = None
    push_config: Optional[Dict] = None


class AgentResponse(BaseModel):
    """数字员工响应"""
    id: int
    tenant_id: int
    owner_id: int
    name: str
    avatar_file_id: Optional[int] = None
    role_description: Optional[str] = None
    system_prompt: Optional[str] = None
    model_id: Optional[int] = None
    skill_ids: Optional[List[int]] = None
    knowledge_base_ids: Optional[List[int]] = None
    workflow_ids: Optional[List[int]] = None
    trigger_config: Optional[Dict] = None
    push_config: Optional[Dict] = None
    visibility: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class AgentRunResponse(BaseModel):
    """数字员工执行记录响应"""
    id: int
    agent_id: int
    trigger_type: str
    input_data: Optional[Dict] = None
    output_data: Optional[Dict] = None
    status: str
    started_at: datetime
    finished_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    class Config:
        from_attributes = True


class AgentRunCreate(BaseModel):
    """执行数字员工请求"""
    input_data: Optional[Dict] = None


class AgentListResponse(BaseModel):
    """数字员工列表响应"""
    items: List[AgentResponse]
    total: int
    page: int
    page_size: int