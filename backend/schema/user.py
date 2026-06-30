from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime


class UserCreate(BaseModel):
    """创建用户请求"""
    tenant_id: Optional[int] = Field(None, description="租户ID")
    username: str = Field(..., min_length=4, max_length=50, description="用户名")
    password: str = Field(..., min_length=8, max_length=100, description="密码")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, max_length=50, description="手机号")
    nickname: Optional[str] = Field(None, max_length=100, description="昵称")
    user_type: str = Field(default="internal", description="用户类型: external/internal/admin")


class UserUpdate(BaseModel):
    """更新用户请求"""
    nickname: Optional[str] = Field(None, max_length=100, description="昵称")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, max_length=50, description="手机号")
    avatar_file_id: Optional[int] = Field(None, description="头像文件ID")


class UserResponse(BaseModel):
    """用户响应"""
    id: int = Field(..., description="用户ID")
    tenant_id: Optional[int] = Field(None, description="租户ID")
    tenant_name: Optional[str] = Field(None, description="租户名称")
    department_name: Optional[str] = Field(None, description="部门名称")
    username: str = Field(..., description="用户名")
    email: Optional[str] = Field(None, description="邮箱")
    phone: Optional[str] = Field(None, description="手机号")
    nickname: Optional[str] = Field(None, description="昵称")
    avatar_file_id: Optional[int] = Field(None, description="头像文件ID")
    user_type: str = Field(..., description="用户类型")
    status: str = Field(..., description="状态")
    roles: Optional[List[str]] = Field(default_factory=list, description="角色列表")
    is_super_admin: bool = Field(default=False, description="是否超级管理员")
    is_tenant_admin: bool = Field(default=False, description="是否租户管理员")
    last_login_at: Optional[datetime] = Field(None, description="最后登录时间")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: Optional[datetime] = Field(None, description="更新时间")
    
    class Config:
        from_attributes = True
        
    @classmethod
    def from_orm_with_roles(cls, user, db=None):
        """从ORM对象创建，自动填充角色信息"""
        data = {
            "id": user.id,
            "tenant_id": user.tenant_id,
            "tenant_name": getattr(user, "tenant_name", None),
            "department_name": getattr(user, "department_name", None),
            "username": user.username,
            "email": user.email,
            "phone": user.phone,
            "nickname": user.nickname,
            "avatar_file_id": user.avatar_file_id,
            "user_type": user.user_type,
            "status": user.status,
            "last_login_at": user.last_login_at,
            "created_at": user.created_at,
            "updated_at": user.updated_at,
        }
        
        # 如果有db连接，查询角色信息
        if db:
            from dao.rbac_dao import get_user_roles
            roles = get_user_roles(db, user.id)
            role_codes = [r.code for r in roles]
            data["roles"] = role_codes
            data["is_super_admin"] = "super_admin" in role_codes
            data["is_tenant_admin"] = "tenant_admin" in role_codes
        else:
            data["roles"] = []
            data["is_super_admin"] = False
            data["is_tenant_admin"] = False
            
        return cls(**data)


class UserListResponse(BaseModel):
    """用户列表响应"""
    items: List[UserResponse] = Field(default_factory=list, description="用户列表")
    total: int = Field(default=0, description="总数")
    page: int = Field(default=1, description="当前页")
    page_size: int = Field(default=20, description="每页大小")


class AssignRoleRequest(BaseModel):
    """分配角色请求"""
    role_ids: List[int] = Field(..., description="角色ID列表")


class ChangePasswordRequest(BaseModel):
    """修改密码请求"""
    old_password: str = Field(..., description="旧密码")
    new_password: str = Field(..., min_length=8, max_length=100, description="新密码")