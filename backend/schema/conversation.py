"""会话相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ConversationCreate(BaseModel):
    """创建会话请求"""
    target_user_id: int = Field(..., description="目标用户ID（单聊）")


class ConversationResponse(BaseModel):
    """会话响应"""
    id: int
    tenant_id: int
    type: str
    group_id: Optional[int] = None
    last_message_id: Optional[int] = None
    last_message_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationMemberResponse(BaseModel):
    """会话成员响应"""
    id: int
    conversation_id: int
    user_id: int
    unread_count: int
    muted: bool
    pinned: bool
    hidden: bool
    last_read_message_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    """创建消息请求"""
    conversation_id: int = Field(..., description="会话ID")
    message_type: str = Field(..., description="消息类型: text/image/file/audio/video/emoji")
    content: Optional[str] = Field(None, description="消息内容")
    file_id: Optional[int] = Field(None, description="文件ID")


class MessageResponse(BaseModel):
    """消息响应"""
    id: int
    tenant_id: int
    conversation_id: int
    sender_id: int
    message_type: str
    content: Optional[str] = None
    file_id: Optional[int] = None
    audit_status: str
    risk_level: str
    created_at: datetime
    recalled_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MessageListResponse(BaseModel):
    """消息列表响应"""
    messages: List[MessageResponse]
    total: int
    page: int
    page_size: int


class ConversationWithMembersResponse(BaseModel):
    """会话详情（包含成员）"""
    conversation: ConversationResponse
    members: List[dict]  # 包含用户基本信息
    unread_count: int