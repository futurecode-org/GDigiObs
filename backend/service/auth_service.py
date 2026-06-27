import logging
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from jose import jwt

from model.user import User, UserStatus, UserType
from model.tenant import Tenant
from model.refresh_token import RefreshTokenModel
from model.role import Role, RoleCode

from dao.user_dao import (
    get_user_by_username, get_user_by_email, get_user_by_phone,
    create_user, update_last_login, get_user_by_id,
    create_refresh_token, delete_refresh_tokens_by_user, get_refresh_token_by_token, revoke_refresh_token
)
from dao.tenant_dao import get_tenant_by_id, create_personal_tenant
from dao.rbac_dao import get_role_by_code, assign_role_to_user, get_user_roles, get_role_permissions, init_system_roles_and_permissions

from schema.auth import UserRegister, UserLogin, TokenResponse, CurrentUserResponse
from schema.rbac import MenuNode

from core.config import settings
from core.security import get_password_hash, verify_password
from core.exceptions import (
    BadRequestException, UnauthorizedException, UserDisabledException, 
    UserBannedException, TenantDisabledException, NotFoundException
)

logger = logging.getLogger(__name__)


def generate_tokens(user: User) -> tuple[str, str, int]:
    """生成access_token和refresh_token"""
    now = datetime.utcnow()
    
    # Access token payload
    access_payload = {
        "sub": str(user.id),
        "tenant_id": user.tenant_id,
        "user_type": user.user_type,
        "type": "access",
        "exp": now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    access_token = jwt.encode(access_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    # Refresh token payload
    refresh_payload = {
        "sub": str(user.id),
        "type": "refresh",
        "exp": now + timedelta(minutes=settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES)
    }
    refresh_token = jwt.encode(refresh_payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    
    expires_in = settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    return access_token, refresh_token, expires_in


def register_user(db: Session, register_data: UserRegister) -> User:
    """用户注册"""
    # 检查用户名是否已存在
    existing_user = get_user_by_username(db, register_data.username)
    if existing_user:
        raise BadRequestException("用户名已存在")
    
    # 检查邮箱是否已存在
    if register_data.email:
        existing_email = get_user_by_email(db, register_data.email)
        if existing_email:
            raise BadRequestException("邮箱已存在")
    
    # 检查手机号是否已存在
    if register_data.phone:
        existing_phone = get_user_by_phone(db, register_data.phone)
        if existing_phone:
            raise BadRequestException("手机号已存在")
    
    # 创建用户
    hashed_password = get_password_hash(register_data.password)
    user = User(
        username=register_data.username,
        password=hashed_password,
        email=register_data.email,
        phone=register_data.phone,
        nickname=register_data.nickname or register_data.username,
        user_type=UserType.INTERNAL,
        status=UserStatus.NORMAL
    )
    
    # TODO: 处理企业邀请码逻辑
    # 如果有有效的企业邀请码，则加入对应企业租户
    # 否则创建个人租户
    
    # 暂时：创建个人租户
    user = create_user(db, user)
    tenant = create_personal_tenant(db, user.id, user.username)
    user.tenant_id = tenant.id
    db.commit()
    db.refresh(user)
    
    # 为用户分配默认角色
    default_role = get_role_by_code(db, RoleCode.USER)
    if default_role:
        assign_role_to_user(db, user.id, default_role.id)
    
    logger.info(f"用户注册成功: {user.username}")
    return user


def login_user(db: Session, login_data: UserLogin) -> TokenResponse:
    """用户登录"""
    # 查询用户（支持用户名、邮箱、手机号登录）
    user = get_user_by_username(db, login_data.username)
    if not user:
        user = get_user_by_email(db, login_data.username)
    if not user:
        user = get_user_by_phone(db, login_data.username)
    
    if not user:
        raise BadRequestException("账号或密码错误")
    
    # 检查用户状态
    if user.status == UserStatus.DISABLED:
        raise UserDisabledException()
    if user.status == UserStatus.BANNED:
        raise UserBannedException()
    
    # 检查租户状态
    if user.tenant_id:
        tenant = get_tenant_by_id(db, user.tenant_id)
        if tenant and tenant.status == "disabled":
            raise TenantDisabledException()
    
    # 验证密码
    if not verify_password(login_data.password, user.password):
        raise BadRequestException("账号或密码错误")
    
    # 删除旧的刷新令牌
    delete_refresh_tokens_by_user(db, user.id)
    
    # 生成新的token
    access_token, refresh_token, expires_in = generate_tokens(user)
    
    # 保存刷新令牌
    refresh_token_model = RefreshTokenModel(
        user_id=user.id,
        token=refresh_token,
        expire_time=datetime.utcnow() + timedelta(minutes=settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES)
    )
    create_refresh_token(db, refresh_token_model)
    
    # 更新最后登录时间
    update_last_login(db, user.id)
    
    logger.info(f"用户登录成功: {user.username}")
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=expires_in
    )


def refresh_token(db: Session, refresh_token_str: str) -> TokenResponse:
    """刷新Token"""
    # 查询刷新令牌
    rt = get_refresh_token_by_token(db, refresh_token_str)
    if not rt or rt.revoked:
        raise UnauthorizedException("刷新令牌无效或已过期")
    
    # 检查过期时间
    if rt.expire_time < datetime.utcnow():
        raise UnauthorizedException("刷新令牌已过期")
    
    # 查询用户
    user = get_user_by_id(db, rt.user_id)
    if not user:
        raise NotFoundException("用户不存在")
    
    # 检查用户状态
    if user.status == UserStatus.DISABLED:
        raise UserDisabledException()
    if user.status == UserStatus.BANNED:
        raise UserBannedException()
    
    # 检查租户状态
    if user.tenant_id:
        tenant = get_tenant_by_id(db, user.tenant_id)
        if tenant and tenant.status == "disabled":
            raise TenantDisabledException()
    
    # 撤销旧的刷新令牌
    revoke_refresh_token(db, refresh_token_str)
    
    # 生成新的token
    access_token, new_refresh_token, expires_in = generate_tokens(user)
    
    # 保存新的刷新令牌
    new_rt = RefreshTokenModel(
        user_id=user.id,
        token=new_refresh_token,
        expire_time=datetime.utcnow() + timedelta(minutes=settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES)
    )
    create_refresh_token(db, new_rt)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=expires_in
    )


def logout_user(db: Session, user_id: int, refresh_token_str: Optional[str] = None):
    """用户退出登录"""
    # 删除所有刷新令牌
    delete_refresh_tokens_by_user(db, user_id)
    
    # 如果指定了刷新令牌，也单独删除
    if refresh_token_str:
        revoke_refresh_token(db, refresh_token_str)
    
    logger.info(f"用户退出登录: user_id={user_id}")


def get_current_user_info(db: Session, user: User) -> CurrentUserResponse:
    """获取当前用户完整信息"""
    tenant_name = None
    tenant_type = None
    
    if user.tenant_id:
        tenant = get_tenant_by_id(db, user.tenant_id)
        if tenant:
            tenant_name = tenant.name
            tenant_type = tenant.type
    
    # 获取角色列表
    roles = get_user_roles(db, user.id)
    role_codes = [r.code for r in roles]
    
    # 获取权限列表
    permissions = []
    for role in roles:
        role_perms = get_role_permissions(db, role.id)
        permissions.extend([p.code for p in role_perms])
    permissions = list(set(permissions))
    
    # 判断是否管理员
    is_super_admin = RoleCode.SUPER_ADMIN in role_codes
    is_tenant_admin = RoleCode.TENANT_ADMIN in role_codes
    
    # 构造菜单列表（从权限中筛选菜单权限）
    menus = build_menu_tree(db, permissions)
    
    return CurrentUserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        phone=user.phone,
        nickname=user.nickname,
        avatar_file_id=user.avatar_file_id,
        user_type=user.user_type,
        status=user.status,
        tenant_id=user.tenant_id,
        tenant_name=tenant_name,
        tenant_type=tenant_type,
        roles=role_codes,
        permissions=permissions,
        menus=menus,
        is_super_admin=is_super_admin,
        is_tenant_admin=is_tenant_admin,
        last_login_at=user.last_login_at
    )


def build_menu_tree(db: Session, permission_codes: list[str]) -> list[dict]:
    """构建菜单树"""
    # 获取菜单权限
    from dao.rbac_dao import get_menu_permissions, get_permission_by_id
    
    menu_perms = get_menu_permissions(db)
    
    # 过滤出用户拥有的菜单权限
    user_menus = []
    for perm in menu_perms:
        if perm.code in permission_codes:
            user_menus.append({
                "id": perm.id,
                "code": perm.code,
                "name": perm.name,
                "path": perm.path,
                "icon": perm.icon,
                "sort_order": perm.sort_order,
                "parent_id": perm.parent_id,
                "children": []
            })
    
    # 构建树形结构
    return build_tree(user_menus)


def build_tree(menus: list[dict]) -> list[dict]:
    """构建树形结构"""
    # 找出根节点
    roots = [m for m in menus if m["parent_id"] is None]
    
    # 为每个根节点找到子节点
    for root in roots:
        root["children"] = find_children(menus, root["id"])
    
    return roots


def find_children(menus: list[dict], parent_id: int) -> list[dict]:
    """递归查找子节点"""
    children = [m for m in menus if m["parent_id"] == parent_id]
    for child in children:
        child["children"] = find_children(menus, child["id"])
    return children


def init_system(db: Session):
    """初始化系统"""
    init_system_roles_and_permissions(db)
    create_default_super_admin(db)
    logger.info("系统初始化完成")


def create_default_super_admin(db: Session):
    """创建默认超级管理员"""
    from core.config import settings
    
    default_admin_username = getattr(settings, "INITIAL_SUPER_ADMIN_USERNAME", "admin")
    default_admin_password = getattr(settings, "INITIAL_SUPER_ADMIN_PASSWORD", "admin123")
    
    existing_user = get_user_by_username(db, default_admin_username)
    if existing_user:
        logger.info(f"默认超级管理员 {default_admin_username} 已存在")
        return
    
    hashed_password = get_password_hash(default_admin_password)
    user = User(
        username=default_admin_username,
        password=hashed_password,
        email=getattr(settings, "INITIAL_SUPER_ADMIN_EMAIL", ""),
        phone=getattr(settings, "INITIAL_SUPER_ADMIN_PHONE", ""),
        nickname=getattr(settings, "INITIAL_SUPER_ADMIN_NICKNAME", "超级管理员"),
        user_type=UserType.INTERNAL,
        status=UserStatus.NORMAL
    )
    
    user = create_user(db, user)
    
    tenant = create_personal_tenant(db, user.id, user.username)
    user.tenant_id = tenant.id
    db.commit()
    db.refresh(user)
    
    super_admin_role = get_role_by_code(db, RoleCode.SUPER_ADMIN)
    if super_admin_role:
        assign_role_to_user(db, user.id, super_admin_role.id)
    
    logger.info(f"默认超级管理员创建成功: {default_admin_username}")