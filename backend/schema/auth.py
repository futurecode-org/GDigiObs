from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


class UserRegister(BaseModel):
    """用户注册请求"""
    username: str = Field(..., min_length=4, max_length=50, description="用户名")
    password: str = Field(..., min_length=8, max_length=100, description="密码")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, max_length=50, description="手机号")
    nickname: Optional[str] = Field(None, max_length=100, description="昵称")
    invitation_code: Optional[str] = Field(None, max_length=50, description="企业邀请码")
    
    # 验证码相关字段（后续实现）
    # verify_code: str = Field(..., description="验证码")


class UserLogin(BaseModel):
    """用户登录请求"""
    username: str = Field(..., description="用户名/邮箱/手机号")
    password: str = Field(..., description="密码")


class TokenResponse(BaseModel):
    """Token响应"""
    access_token: str = Field(..., description="访问令牌")
    refresh_token: str = Field(..., description="刷新令牌")
    token_type: str = Field(default="bearer", description="Token类型")
    expires_in: int = Field(..., description="过期时间(秒)")


class RefreshTokenRequest(BaseModel):
    """刷新Token请求"""
    refresh_token: str = Field(..., description="刷新令牌")


class CurrentUserResponse(BaseModel):
    """当前用户信息响应"""
    id: int = Field(..., description="用户ID")
    username: str = Field(..., description="用户名")
    email: Optional[str] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, description="手机号")
    nickname: Optional[str] = Field(None, description="昵称")
    avatar_file_id: Optional[int] = Field(None, description="头像文件ID")
    user_type: str = Field(..., description="用户类型")
    status: str = Field(..., description="用户状态")
    tenant_id: Optional[int] = Field(None, description="租户ID")
    tenant_name: Optional[str] = Field(None, description="租户名称")
    tenant_type: Optional[str] = Field(None, description="租户类型")
    roles: List[str] = Field(default_factory=list, description="角色列表")
    permissions: List[str] = Field(default_factory=list, description="权限列表")
    menus: List[dict] = Field(default_factory=list, description="菜单列表")
    is_super_admin: bool = Field(default=False, description="是否超级管理员")
    is_tenant_admin: bool = Field(default=False, description="是否租户管理员")
    last_login_at: Optional[datetime] = Field(None, description="最后登录时间")


class LogoutRequest(BaseModel):
    """退出登录请求"""
    refresh_token: Optional[str] = Field(None, description="刷新令牌")