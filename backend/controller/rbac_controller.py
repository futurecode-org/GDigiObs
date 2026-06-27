from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.rbac import RoleCreate, RoleUpdate, RoleResponse, PermissionCreate, PermissionResponse, AssignPermissionsRequest
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import require_permission, require_admin, get_request_context

rbac_router = APIRouter(prefix="/rbac", tags=["权限管理 RBAC"])


# 角色管理
@rbac_router.get("/roles", summary="角色列表")
def list_roles(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx = require_permission("role:view")
):
    """
    获取角色列表
    
    - 管理员可查看所有角色
    - 普通用户只能看到自己租户的角色
    """
    from service.rbac_service import get_role_list
    result = get_role_list(db, ctx, page, page_size)
    paginated = PaginatedData(**result)
    return PaginatedResponse.success(data=paginated)


@rbac_router.post("/roles", summary="创建角色")
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    ctx = require_permission("role:create")
):
    """
    创建角色
    
    - 管理员可创建自定义角色
    - 系统内置角色不可修改
    """
    from service.rbac_service import create_custom_role
    role = create_custom_role(db, data, ctx)
    return ApiResponse.success(data=RoleResponse.model_validate(role))


@rbac_router.get("/roles/{role_id}", summary="角色详情")
def get_role_detail(
    role_id: int,
    db: Session = Depends(get_db),
    ctx = require_permission("role:view")
):
    """
    获取角色详情
    """
    from service.rbac_service import get_role_detail
    role = get_role_detail(db, role_id)
    return ApiResponse.success(data=RoleResponse.model_validate(role))


@rbac_router.put("/roles/{role_id}", summary="更新角色")
def update_role(
    role_id: int,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    ctx = require_permission("role:update")
):
    """
    更新角色
    
    - 系统内置角色不可修改
    """
    from service.rbac_service import update_custom_role
    role = update_custom_role(db, role_id, data, ctx)
    return ApiResponse.success(data=RoleResponse.model_validate(role))


@rbac_router.post("/roles/{role_id}/permissions", summary="分配权限")
def assign_permissions(
    role_id: int,
    data: AssignPermissionsRequest,
    db: Session = Depends(get_db),
    ctx = require_permission("permission:assign")
):
    """
    为角色分配权限
    
    - 管理员可为角色分配权限
    - 超级管理员拥有所有权限
    """
    from service.rbac_service import assign_permissions_to_role
    assign_permissions_to_role(db, role_id, data.permission_ids, ctx)
    return ApiResponse.success(message="权限分配成功")


# 权限管理
@rbac_router.get("/permissions", summary="权限列表")
def list_permissions(
    db: Session = Depends(get_db),
    ctx = require_permission("permission:view")
):
    """
    获取权限列表
    
    - 管理员可查看所有权限
    """
    from service.rbac_service import get_permission_list
    permissions = get_permission_list(db)
    return ApiResponse.success(data=[PermissionResponse.model_validate(p) for p in permissions])


@rbac_router.get("/permissions/menu", summary="菜单权限列表")
def list_menu_permissions(
    db: Session = Depends(get_db),
    ctx = Depends(get_request_context)
):
    """
    获取菜单权限列表
    
    - 返回树形结构菜单
    - 根据用户权限过滤
    """
    from service.rbac_service import get_menu_permissions_for_user
    menus = get_menu_permissions_for_user(db, ctx)
    return ApiResponse.success(data=menus)