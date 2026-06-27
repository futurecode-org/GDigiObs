from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class RoleCreate(BaseModel):
    """创建角色请求"""
    tenant_id: Optional[int] = Field(None, description="租户ID")
    name: str = Field(..., max_length=100, description="角色名称")
    code: str = Field(..., max_length=100, description="角色编码")
    description: Optional[str] = Field(None, description="角色描述")


class RoleUpdate(BaseModel):
    """更新角色请求"""
    name: Optional[str] = Field(None, max_length=100, description="角色名称")
    description: Optional[str] = Field(None, description="角色描述")
    status: Optional[str] = Field(None, description="状态")


class RoleResponse(BaseModel):
    """角色响应"""
    id: int = Field(..., description="角色ID")
    tenant_id: Optional[int] = Field(None, description="租户ID")
    name: str = Field(..., description="角色名称")
    code: str = Field(..., description="角色编码")
    description: Optional[str] = Field(None, description="角色描述")
    is_system: bool = Field(..., description="是否系统内置")
    is_platform: bool = Field(..., description="是否平台级")
    status: str = Field(..., description="状态")
    created_at: datetime = Field(..., description="创建时间")
    
    class Config:
        from_attributes = True


class PermissionCreate(BaseModel):
    """创建权限请求"""
    code: str = Field(..., max_length=100, description="权限编码")
    name: str = Field(..., max_length=100, description="权限名称")
    type: str = Field(..., description="权限类型: menu/button/api/data")
    parent_id: Optional[int] = Field(None, description="父级权限ID")
    path: Optional[str] = Field(None, max_length=255, description="菜单路径或API路径")
    method: Optional[str] = Field(None, description="API方法")
    icon: Optional[str] = Field(None, description="菜单图标")
    sort_order: Optional[int] = Field(None, description="排序序号")
    description: Optional[str] = Field(None, description="权限描述")


class PermissionResponse(BaseModel):
    """权限响应"""
    id: int = Field(..., description="权限ID")
    code: str = Field(..., description="权限编码")
    name: str = Field(..., description="权限名称")
    type: str = Field(..., description="权限类型")
    parent_id: Optional[int] = Field(None, description="父级权限ID")
    path: Optional[str] = Field(None, description="菜单路径或API路径")
    method: Optional[str] = Field(None, description="API方法")
    icon: Optional[str] = Field(None, description="菜单图标")
    sort_order: int = Field(..., description="排序序号")
    description: Optional[str] = Field(None, description="权限描述")
    status: str = Field(..., description="状态")
    
    class Config:
        from_attributes = True


class AssignPermissionsRequest(BaseModel):
    """分配权限请求"""
    permission_ids: List[int] = Field(..., description="权限ID列表")


class MenuNode(BaseModel):
    """菜单节点"""
    id: int = Field(..., description="菜单ID")
    code: str = Field(..., description="菜单编码")
    name: str = Field(..., description="菜单名称")
    path: Optional[str] = Field(None, description="菜单路径")
    icon: Optional[str] = Field(None, description="菜单图标")
    sort_order: int = Field(..., description="排序序号")
    children: List["MenuNode"] = Field(default_factory=list, description="子菜单")


MenuNode.model_rebuild()