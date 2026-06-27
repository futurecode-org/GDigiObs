"""通知相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class NotificationResponse(BaseModel):
    """通知响应"""
    id: int
    tenant_id: int
    user_id: int
    notification_type: str
    title: str
    content: Optional[str] = None
    data: Optional[Dict] = None
    read_at: Optional[datetime] = None
    channel: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class NotificationListResponse(BaseModel):
    """通知列表响应"""
    items: List[NotificationResponse]
    total: int
    page: int
    page_size: int