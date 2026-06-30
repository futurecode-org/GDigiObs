"""RBAC权限管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.rbac import RoleCreate, RoleUpdate, RoleResponse, PermissionResponse, AssignPermissionsRequest
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import require_permission, get_request_context, RequestContext

rbac_router = APIRouter(prefix="/rbac", tags=["权限管理 RBAC"])


# ============== 角色管理 ==============

@rbac_router.get("/roles", summary="角色列表")
def list_roles(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取角色列表
    
    - 管理员可查看所有角色
    - 普通用户只能看到自己租户的角色
    """
    from service.rbac_service import get_role_list
    result = get_role_list(db, ctx, page, page_size)
    paginated = PaginatedData(
        items=[RoleResponse.model_validate(role) for role in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )
    return PaginatedResponse.success(data=paginated)


@rbac_router.post("/roles", summary="创建角色")
def create_role(
    data: RoleCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
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
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取角色详情
    """
    from service.rbac_service import get_role_detail
    role = get_role_detail(db, role_id, ctx)
    return ApiResponse.success(data=RoleResponse.model_validate(role))


@rbac_router.put("/roles/{role_id}", summary="更新角色")
def update_role(
    role_id: int,
    data: RoleUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    更新角色
    
    - 系统内置角色不可修改
    """
    from service.rbac_service import update_custom_role
    role = update_custom_role(db, role_id, data, ctx)
    return ApiResponse.success(data=RoleResponse.model_validate(role))


@rbac_router.delete("/roles/{role_id}", summary="删除角色")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    删除角色
    
    - 系统内置角色不可删除
    - 已绑定用户的角色删除前需先解绑
    """
    from service.rbac_service import delete_custom_role
    delete_custom_role(db, role_id, ctx)
    return ApiResponse.success(message="角色已删除")


@rbac_router.post("/roles/{role_id}/permissions", summary="分配权限")
def assign_permissions(
    role_id: int,
    data: AssignPermissionsRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    为角色分配权限
    
    - 管理员可为角色分配权限
    - 超级管理员拥有所有权限
    """
    from service.rbac_service import assign_permissions_to_role
    assign_permissions_to_role(db, role_id, data.permission_ids, ctx)
    return ApiResponse.success(message="权限分配成功")


@rbac_router.get("/roles/{role_id}/permissions", summary="角色权限")
def get_role_permissions(
    role_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取角色的权限列表
    """
    from service.rbac_service import get_role_permission_ids
    perm_ids = get_role_permission_ids(db, role_id, ctx)
    return ApiResponse.success(data=perm_ids)


@rbac_router.get("/roles/{role_id}/users", summary="角色关联用户")
def get_role_users(
    role_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取角色的关联用户列表
    """
    from service.rbac_service import get_role_users
    users = get_role_users(db, role_id, ctx)
    return ApiResponse.success(data=users)


# ============== 权限管理 ==============

@rbac_router.get("/permissions", summary="权限列表")
def list_permissions(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取权限列表
    
    - 管理员可查看所有权限
    """
    from service.rbac_service import get_permission_tree
    permissions = get_permission_tree(db, ctx)
    return ApiResponse.success(data=permissions)


@rbac_router.get("/permissions/menu", summary="菜单权限列表")
def list_menu_permissions(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取菜单权限列表
    
    - 返回树形结构菜单
    - 根据用户权限过滤
    """
    from service.rbac_service import get_menu_permissions_for_user
    menus = get_menu_permissions_for_user(db, ctx)
    return ApiResponse.success(data=menus)


@rbac_router.get("/permissions/button", summary="按钮权限列表")
def list_button_permissions(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取当前用户的按钮权限编码列表
    """
    from service.rbac_service import get_button_permissions_for_user
    buttons = get_button_permissions_for_user(db, ctx)
    return ApiResponse.success(data=buttons)


@rbac_router.get("/permissions/data-scope", summary="数据权限范围")
def list_data_scope(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取数据权限范围选项
    """
    from service.rbac_service import get_data_scope_permissions
    scopes = get_data_scope_permissions(db, ctx)
    return ApiResponse.success(data=scopes)
