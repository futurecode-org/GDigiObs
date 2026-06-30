import logging
from sqlalchemy.orm import Session
from typing import Dict, List, Optional

from dao.user_dao import (
    get_user_by_id, get_users_by_tenant, count_users_by_tenant,
    search_users_by_keyword, count_search_users_by_keyword,
    update_user, update_user_status, soft_delete_user
)
from dao.rbac_dao import get_user_roles, clear_user_roles, assign_role_to_user, get_role_by_id
from model.user import User, UserStatus
from schema.user import UserUpdate
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def get_user_list(db: Session, ctx: RequestContext, page: int = 1, page_size: int = 20) -> Dict:
    """获取用户列表"""
    if ctx.is_super_admin:
        # 超级管理员可以看到所有用户（暂不实现全平台用户列表）
        # TODO: 实现全平台用户查询
        users = []
        total = 0
    else:
        # 普通管理员只能看到自己租户的用户
        users = get_users_by_tenant(db, ctx.tenant_id, page, page_size)
        total = count_users_by_tenant(db, ctx.tenant_id)
    
    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total // page_size) + (1 if total % page_size > 0 else 0)
    }


def search_users(db: Session, ctx: RequestContext, keyword: str, page: int = 1, page_size: int = 20) -> Dict:
    """搜索用户（用于添加好友等场景）"""
    users = search_users_by_keyword(db, None, keyword, exclude_user_id=ctx.user_id, page=page, page_size=page_size)
    total = count_search_users_by_keyword(db, None, keyword, exclude_user_id=ctx.user_id)
    
    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total // page_size) + (1 if total % page_size > 0 else 0)
    }


def get_user_detail(db: Session, user_id: int, current_user: User) -> User:
    """获取用户详情"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    # 权限检查：用户只能查看自己的信息，管理员可查看租户下用户
    if user_id != current_user.id:
        if current_user.tenant_id != user.tenant_id and current_user.user_type != "admin":
            raise ForbiddenException("无权查看该用户信息")
    
    return user


def update_user_profile(db: Session, user_id: int, data: UserUpdate, current_user: User) -> User:
    """更新用户信息"""
    user = get_user_detail(db, user_id, current_user)
    
    # 权限检查：用户只能修改自己的信息，管理员可修改租户下用户
    if user_id != current_user.id:
        if current_user.tenant_id != user.tenant_id and current_user.user_type != "admin":
            raise ForbiddenException("无权修改该用户信息")
    
    # 更新字段
    update_data = {}
    if data.nickname is not None:
        update_data["nickname"] = data.nickname
    if data.email is not None:
        update_data["email"] = data.email
    if data.phone is not None:
        update_data["phone"] = data.phone
    if data.avatar_file_id is not None:
        update_data["avatar_file_id"] = data.avatar_file_id
    
    return update_user(db, user, **update_data)


def assign_roles_to_user(db: Session, user_id: int, role_ids: List[int], ctx: RequestContext):
    """为用户分配角色"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    # 权限检查：只能操作租户内用户
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能操作本租户用户")
    
    # 清除原有角色
    clear_user_roles(db, user_id)
    
    # 分配新角色
    for role_id in role_ids:
        role = get_role_by_id(db, role_id)
        if role:
            # 权限检查：只能分配租户内角色或平台角色
            if not ctx.is_super_admin and role.tenant_id != ctx.tenant_id and not role.is_platform:
                raise ForbiddenException(f"无法分配角色: {role.name}")
            assign_role_to_user(db, user_id, role_id)
    
    logger.info(f"为用户分配角色成功: user_id={user_id}, role_ids={role_ids}")


def disable_user(db: Session, user_id: int, ctx: RequestContext):
    """禁用用户"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    # 权限检查
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能操作本租户用户")
    
    update_user_status(db, user_id, UserStatus.DISABLED)
    logger.info(f"用户已禁用: user_id={user_id}")


def ban_user(db: Session, user_id: int, ctx: RequestContext):
    """封禁用户"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    # 权限检查
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能操作本租户用户")
    
    update_user_status(db, user_id, UserStatus.BANNED)
    logger.info(f"用户已封禁: user_id={user_id}")