"""用户管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from database.session import get_db
from schema.user import UserResponse, UserUpdate, UserCreate, UserListResponse, AssignRoleRequest, MuteUserRequest
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext
from service.user_service import (
    get_user_list, get_user_detail, update_user_profile, assign_roles_to_user,
    disable_user, enable_user, ban_user, unban_user, search_users,
    create_new_user, reset_user_password, delete_user, get_user_roles_info
)
from service.audit_risk_service import mute_user, unmute_user

from model.user import User


user_router = APIRouter(prefix="/users", tags=["用户管理 User"])


@user_router.get("", summary="用户列表")
def list_users(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取用户列表
    
    - 管理员可查看租户下所有用户
    - 超级管理员可查看所有用户
    - 支持分页
    """
    result = get_user_list(db, ctx, page, page_size)
    paginated = PaginatedData(
        items=[UserResponse.from_orm_with_roles(u, db) for u in result["items"]],
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
    ctx: RequestContext = Depends(get_request_context)
):
    """
    搜索用户（用于添加好友等场景）
    
    - 支持按用户名或昵称搜索
    - 自动排除当前用户
    - 支持分页
    """
    result = search_users(db, ctx, keyword, page, page_size)
    paginated = PaginatedData(
        items=[UserResponse.model_validate(u) for u in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )
    return PaginatedResponse.success(data=paginated)


@user_router.post("", summary="创建用户")
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    创建新用户（管理员操作）
    
    - 管理员可在租户内创建用户
    - 支持指定用户类型
    """
    user = create_new_user(db, data, ctx)
    return ApiResponse.success(data=UserResponse.model_validate(user))


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
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取用户详情
    
    - 用户只能查看自己的信息
    - 管理员可查看租户下用户信息
    """
    user = get_user_detail(db, user_id, ctx)
    return ApiResponse.success(data=UserResponse.from_orm_with_roles(user, db))


@user_router.put("/{user_id}", summary="更新用户")
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    更新用户信息
    
    - 用户只能修改自己的昵称、头像等
    - 管理员可修改租户下用户信息
    """
    user = update_user_profile(db, user_id, data, ctx)
    return ApiResponse.success(data=UserResponse.model_validate(user))


@user_router.post("/{user_id}/roles", summary="分配角色")
def assign_roles(
    user_id: int,
    data: AssignRoleRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    为用户分配角色
    
    - 管理员可为用户分配角色
    - 超级管理员可分配任意角色
    - 租户管理员只能分配租户内角色
    """
    assign_roles_to_user(db, user_id, data.role_ids, ctx)
    return ApiResponse.success(message="角色分配成功")


@user_router.get("/{user_id}/roles", summary="用户角色")
def get_user_roles(
    user_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取用户的角色列表
    """
    roles = get_user_roles_info(db, user_id, ctx)
    return ApiResponse.success(data=roles)


@user_router.post("/{user_id}/disable", summary="禁用用户")
def disable(
    user_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    禁用用户
    
    - 管理员可禁用租户下用户
    - 被禁用用户无法登录
    """
    disable_user(db, user_id, ctx)
    return ApiResponse.success(message="用户已禁用")


@user_router.post("/{user_id}/enable", summary="启用用户")
def enable(
    user_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    启用用户
    
    - 管理员可启用租户下用户
    """
    enable_user(db, user_id, ctx)
    return ApiResponse.success(message="用户已启用")


@user_router.post("/{user_id}/ban", summary="封禁用户")
def ban(
    user_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    封禁用户
    
    - 管理员可封禁租户下用户
    - 被封禁用户无法登录，且相关数据受限
    """
    ban_user(db, user_id, ctx)
    return ApiResponse.success(message="用户已封禁")


@user_router.post("/{user_id}/unban", summary="解封用户")
def unban(
    user_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    解封用户
    
    - 管理员可解封租户下用户
    """
    unban_user(db, user_id, ctx)
    return ApiResponse.success(message="用户已解封")


@user_router.post("/{user_id}/reset-password", summary="重置密码")
def reset_password(
    user_id: int,
    new_password: str,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    重置用户密码
    
    - 管理员可重置租户下用户密码
    - 重置后用户需重新登录
    """
    user = reset_user_password(db, user_id, new_password, ctx)
    return ApiResponse.success(data=UserResponse.model_validate(user))


@user_router.delete("/{user_id}", summary="删除用户")
def delete(
    user_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    删除用户（软删除）
    
    - 管理员可删除租户下用户
    - 不能删除自己
    """
    delete_user(db, user_id, ctx)
    return ApiResponse.success(message="用户已删除")



@user_router.post("/{user_id}/mute", summary="全局禁言用户")
def mute(
    user_id: int,
    data: MuteUserRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    全局禁言用户
    
    - 被禁言用户无法发送任何聊天消息
    - 支持设置禁言时长（分钟）
    """
    result = mute_user(db, ctx, user_id, data.duration_minutes)
    return ApiResponse.success(data=result)


@user_router.post("/{user_id}/unmute", summary="解除全局禁言")
def unmute(
    user_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    解除用户全局禁言
    """
    result = unmute_user(db, ctx, user_id)
    return ApiResponse.success(data=result)
