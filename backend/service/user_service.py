"""用户管理业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import Dict, List, Optional

from dao.user_dao import (
    get_user_by_id, get_users_by_tenant, count_users_by_tenant,
    search_users_by_keyword, count_search_users_by_keyword,
    update_user, update_user_status, soft_delete_user,
    get_user_by_username, get_user_by_email, get_user_by_phone,
    create_user
)
from dao.rbac_dao import get_user_roles, clear_user_roles, assign_role_to_user, get_role_by_id
from dao.tenant_dao import get_tenant_by_id, create_personal_tenant
from model.user import User, UserStatus, UserType
from model.role import RoleCode
from schema.user import UserUpdate, UserCreate
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext
from core.security import get_password_hash

logger = logging.getLogger(__name__)


def get_user_list(db: Session, ctx: RequestContext, page: int = 1, page_size: int = 20) -> Dict:
    """获取用户列表
    
    - 超级管理员可查看所有用户
    - 租户管理员只能查看本租户用户
    - 普通管理员按权限查看
    """
    if ctx.is_super_admin:
        # 超级管理员查看所有用户（排除已删除）
        from dao.user_dao import get_all_users, count_all_users
        users = get_all_users(db, page, page_size)
        total = count_all_users(db)
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
    # 搜索逻辑：管理员可以搜索本租户用户，外部用户搜索跨租户需要额外处理
    if ctx.is_super_admin:
        tenant_id = None  # 超级管理员可以搜索所有用户
    else:
        tenant_id = ctx.tenant_id
    
    users = search_users_by_keyword(db, tenant_id, keyword, exclude_user_id=ctx.user_id, page=page, page_size=page_size)
    total = count_search_users_by_keyword(db, tenant_id, keyword, exclude_user_id=ctx.user_id)
    
    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total // page_size) + (1 if total % page_size > 0 else 0)
    }


def get_user_detail(db: Session, user_id: int, ctx: RequestContext) -> User:
    """获取用户详情"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    # 权限检查：用户只能查看自己的信息，管理员可查看租户下用户
    if user_id != ctx.user_id:
        if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
            raise ForbiddenException("无权查看该用户信息")
    
    return user


def create_new_user(db: Session, data: UserCreate, ctx: RequestContext) -> User:
    """创建新用户（管理员操作）"""
    # 权限检查
    if not ctx.is_super_admin and not ctx.is_tenant_admin and "admin" not in ctx.roles:
        raise ForbiddenException("无权创建用户")
    
    # 检查用户名是否已存在
    existing = get_user_by_username(db, data.username)
    if existing:
        raise BadRequestException("用户名已存在")
    
    # 检查邮箱是否已存在
    if data.email:
        existing_email = get_user_by_email(db, data.email)
        if existing_email:
            raise BadRequestException("邮箱已存在")
    
    # 检查手机号是否已存在
    if data.phone:
        existing_phone = get_user_by_phone(db, data.phone)
        if existing_phone:
            raise BadRequestException("手机号已存在")
    
    # 确定租户ID
    tenant_id = data.tenant_id
    if not ctx.is_super_admin:
        tenant_id = ctx.tenant_id  # 非超级管理员只能在本租户创建用户
    
    # 创建用户
    hashed_password = get_password_hash(data.password)
    user = User(
        tenant_id=tenant_id,
        username=data.username,
        password=hashed_password,
        email=data.email,
        phone=data.phone,
        nickname=data.nickname or data.username,
        user_type=data.user_type or UserType.INTERNAL,
        status=UserStatus.NORMAL
    )
    
    user = create_user(db, user)
    
    # 如果没有指定租户，创建个人租户
    if not tenant_id:
        tenant = create_personal_tenant(db, user.id, user.username)
        user.tenant_id = tenant.id
        db.commit()
        db.refresh(user)
    
    # 分配默认角色
    if data.user_type == UserType.EXTERNAL:
        default_role_code = RoleCode.EXTERNAL_USER
    else:
        default_role_code = RoleCode.USER
    
    from dao.rbac_dao import get_role_by_code
    default_role = get_role_by_code(db, default_role_code)
    if default_role:
        assign_role_to_user(db, user.id, default_role.id)
    
    logger.info(f"创建用户成功: user_id={user.id}, username={user.username}, tenant_id={user.tenant_id}")
    return user


def update_user_profile(db: Session, user_id: int, data: UserUpdate, ctx: RequestContext) -> User:
    """更新用户信息"""
    user = get_user_detail(db, user_id, ctx)
    
    # 权限检查：用户只能修改自己的信息，管理员可修改租户下用户
    if user_id != ctx.user_id:
        if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
            raise ForbiddenException("无权修改该用户信息")
    
    # 更新字段
    update_data = {}
    if data.nickname is not None:
        update_data["nickname"] = data.nickname
    if data.email is not None:
        # 检查邮箱是否与其他用户冲突
        if data.email != user.email:
            existing = get_user_by_email(db, data.email)
            if existing and existing.id != user_id:
                raise BadRequestException("邮箱已被其他用户使用")
        update_data["email"] = data.email
    if data.phone is not None:
        # 检查手机号是否与其他用户冲突
        if data.phone != user.phone:
            existing = get_user_by_phone(db, data.phone)
            if existing and existing.id != user_id:
                raise BadRequestException("手机号已被其他用户使用")
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
    
    # 不能给自己禁用/修改角色（防止管理员把自己锁死）
    if user_id == ctx.user_id:
        # 检查是否尝试移除自己的管理员角色
        current_roles = get_user_roles(db, user_id)
        current_role_ids = [r.id for r in current_roles]
        # 如果当前是超级管理员，不允许修改
        if any(r.code == RoleCode.SUPER_ADMIN for r in current_roles):
            raise BadRequestException("不能修改自己的超级管理员角色")
    
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
    
    # 不能禁用自己
    if user_id == ctx.user_id:
        raise BadRequestException("不能禁用自己")
    
    update_user_status(db, user_id, UserStatus.DISABLED)
    logger.info(f"用户已禁用: user_id={user_id}")


def enable_user(db: Session, user_id: int, ctx: RequestContext):
    """启用用户"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    # 权限检查
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能操作本租户用户")
    
    update_user_status(db, user_id, UserStatus.NORMAL)
    logger.info(f"用户已启用: user_id={user_id}")


def ban_user(db: Session, user_id: int, ctx: RequestContext):
    """封禁用户"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    # 权限检查
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能操作本租户用户")
    
    # 不能封禁自己
    if user_id == ctx.user_id:
        raise BadRequestException("不能封禁自己")
    
    update_user_status(db, user_id, UserStatus.BANNED)
    logger.info(f"用户已封禁: user_id={user_id}")


def unban_user(db: Session, user_id: int, ctx: RequestContext):
    """解封用户"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    # 权限检查
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能操作本租户用户")
    
    update_user_status(db, user_id, UserStatus.NORMAL)
    logger.info(f"用户已解封: user_id={user_id}")


def reset_user_password(db: Session, user_id: int, new_password: str, ctx: RequestContext) -> User:
    """重置用户密码"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    # 权限检查
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能操作本租户用户")
    
    hashed_password = get_password_hash(new_password)
    user = update_user(db, user, password=hashed_password)
    
    # 重置密码后清除所有刷新令牌，强制重新登录
    from dao.user_dao import delete_refresh_tokens_by_user
    delete_refresh_tokens_by_user(db, user_id)
    
    logger.info(f"用户密码已重置: user_id={user_id}")
    return user


def delete_user(db: Session, user_id: int, ctx: RequestContext):
    """删除用户（软删除）"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    # 权限检查
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能操作本租户用户")
    
    # 不能删除自己
    if user_id == ctx.user_id:
        raise BadRequestException("不能删除自己")
    
    soft_delete_user(db, user_id)
    logger.info(f"用户已删除: user_id={user_id}")


def get_user_roles_info(db: Session, user_id: int, ctx: RequestContext) -> List[dict]:
    """获取用户的角色信息"""
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权查看该用户信息")
    
    roles = get_user_roles(db, user_id)
    return [{
        "id": r.id,
        "name": r.name,
        "code": r.code,
        "is_system": r.is_system,
        "is_platform": r.is_platform
    } for r in roles]
