from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.user import UserResponse, UserUpdate, UserCreate, UserListResponse, AssignRoleRequest
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext
from service.user_service import get_user_list, get_user_detail, update_user_profile, assign_roles_to_user, disable_user, ban_user, search_users

from model.user import User


user_router = APIRouter(prefix="/users", tags=["用户管理 User"])


@user_router.get("", summary="用户列表")
def list_users(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx = require_permission("user:view")
):
    """
    获取用户列表
    
    - 管理员可查看租户下所有用户
    - 超级管理员可查看所有用户
    - 支持分页
    """
    result = get_user_list(db, ctx, page, page_size)
    paginated = PaginatedData(
        items=[UserResponse.model_validate(u) for u in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )
    return PaginatedResponse.success(data=paginated)


@user_router.get("/search", summary="搜索用户")
def search_user_endpoint(
    keyword: str,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    搜索用户（用于添加好友等场景）
    
    - 支持按用户名或昵称搜索
    - 自动排除当前用户
    - 仅搜索同一租户下的用户
    - 支持分页
    """
    from core.dependencies import RequestContext
    
    # 构造 RequestContext
    ctx = RequestContext(
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        username=current_user.username or "",
        is_super_admin=current_user.user_type == "admin"
    )
    
    result = search_users(db, ctx, keyword, page, page_size)
    paginated = PaginatedData(
        items=[UserResponse.model_validate(u) for u in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )
    return PaginatedResponse.success(data=paginated)


# 个人中心相关接口
@user_router.get("/me", summary="获取当前用户信息", deprecated=True)
def get_me_redirect(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    获取当前用户信息（已迁移至 /api/v1/auth/me）
    """
    from service.auth_service import get_current_user_info
    user_info = get_current_user_info(db, current_user)
    return ApiResponse.success(data=user_info)


@user_router.get("/{user_id}", summary="用户详情")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户详情
    
    - 用户只能查看自己的信息
    - 管理员可查看租户下用户信息
    """
    user = get_user_detail(db, user_id, current_user)
    return ApiResponse.success(data=UserResponse.model_validate(user))


@user_router.put("/{user_id}", summary="更新用户")
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新用户信息
    
    - 用户只能修改自己的昵称、头像等
    - 管理员可修改租户下用户信息
    """
    user = update_user_profile(db, user_id, data, current_user)
    return ApiResponse.success(data=UserResponse.model_validate(user))


@user_router.post("/{user_id}/roles", summary="分配角色")
def assign_roles(
    user_id: int,
    data: AssignRoleRequest,
    db: Session = Depends(get_db),
    ctx = require_permission("user:assign_role")
):
    """
    为用户分配角色
    
    - 管理员可为用户分配角色
    - 超级管理员可分配任意角色
    - 租户管理员只能分配租户内角色
    """
    assign_roles_to_user(db, user_id, data.role_ids, ctx)
    return ApiResponse.success(message="角色分配成功")


@user_router.post("/{user_id}/disable", summary="禁用用户")
def disable(
    user_id: int,
    db: Session = Depends(get_db),
    ctx = require_permission("user:disable")
):
    """
    禁用用户
    
    - 管理员可禁用租户下用户
    - 被禁用用户无法登录
    """
    disable_user(db, user_id, ctx)
    return ApiResponse.success(message="用户已禁用")


@user_router.post("/{user_id}/ban", summary="封禁用户")
def ban(
    user_id: int,
    db: Session = Depends(get_db),
    ctx = require_permission("user:ban")
):
    """
    封禁用户
    
    - 管理员可封禁租户下用户
    - 被封禁用户无法登录，且相关数据受限
    """
    ban_user(db, user_id, ctx)
    return ApiResponse.success(message="用户已封禁")
