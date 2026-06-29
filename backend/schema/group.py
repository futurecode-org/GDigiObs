"""群组相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class GroupCreate(BaseModel):
    """创建群组请求"""
    name: str = Field(..., max_length=100, description="群名称")
    description: Optional[str] = Field(None, description="群简介")
    max_members: Optional[int] = Field(500, description="最大成员数")


class GroupUpdate(BaseModel):
    """更新群组请求"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    avatar_file_id: Optional[int] = None
    max_members: Optional[int] = None
    join_mode: Optional[str] = None
    allow_member_invite: Optional[bool] = None


class GroupResponse(BaseModel):
    """群组响应"""
    id: int
    tenant_id: int
    name: str
    avatar_file_id: Optional[int] = None
    description: Optional[str] = None
    owner_id: int
    join_mode: str
    allow_member_invite: bool
    max_members: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class GroupMemberResponse(BaseModel):
    """群成员响应"""
    id: int
    group_id: int
    user_id: int
    role: str
    muted_until: Optional[datetime] = None
    joined_at: datetime
    status: str
    
    class Config:
        from_attributes = True


class GroupMemberCreate(BaseModel):
    """添加群成员请求"""
    user_ids: List[int] = Field(..., description="要添加的用户ID列表")


class GroupWithMembersResponse(BaseModel):
    """群组详情（包含成员）"""
    group: GroupResponse
    members: List[dict]  # 包含用户基本信息
    member_count: int


class FriendApplicationCreate(BaseModel):
    """创建好友申请请求"""
    to_user_id: int = Field(..., description="目标用户ID")
    message: Optional[str] = Field(None, max_length=255, description="验证消息")


class FriendApplicationResponse(BaseModel):
    """好友申请响应"""
    id: int
    from_user_id: int
    to_user_id: int
    message: Optional[str] = None
    status: str
    handled_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class FriendRelationResponse(BaseModel):
    """好友关系响应"""
    id: int
    user_id: int
    friend_user_id: int
    remark: Optional[str] = None
    group_name: Optional[str] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class FriendWithUserInfoResponse(BaseModel):
    """好友列表响应（包含好友用户信息）"""
    friend_relation: FriendRelationResponse
    friend_user: dict  # 好友用户基本信息


class GroupAnnouncementCreate(BaseModel):
    """创建群公告请求"""
    content: str = Field(..., max_length=2000, description="公告内容")


class GroupAnnouncementResponse(BaseModel):
    """群公告响应"""
    id: int
    group_id: int
    content: str
    created_by: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class GroupJoinApplicationCreate(BaseModel):
    """创建入群申请请求"""
    group_id: int = Field(..., description="群组ID")
    message: Optional[str] = Field(None, max_length=255, description="申请理由")


class GroupJoinApplicationResponse(BaseModel):
    """入群申请响应"""
    id: int
    group_id: int
    applicant_id: int
    message: Optional[str] = None
    status: str
    handled_by: Optional[int] = None
    handled_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class GroupInvitationCreate(BaseModel):
    """创建群邀请请求"""
    invitee_ids: List[int] = Field(..., description="被邀请用户ID列表")
    message: Optional[str] = Field(None, max_length=255, description="邀请消息")
    expires_in_hours: Optional[int] = Field(24, description="邀请有效期（小时）")


class GroupInvitationResponse(BaseModel):
    """群邀请响应"""
    id: int
    group_id: int
    inviter_id: int
    invitee_id: int
    message: Optional[str] = None
    status: str
    expires_at: datetime
    accepted_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class MuteMemberRequest(BaseModel):
    """禁言群成员请求"""
    user_ids: List[int] = Field(..., description="要禁言的用户ID列表")
    mute_hours: int = Field(..., ge=1, le=168, description="禁言时长（小时，1-168）")