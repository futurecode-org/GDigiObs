from typing import Optional, List
from fastapi import Depends, Header
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from core.config import settings
from core.exceptions import UnauthorizedException, ForbiddenException, UserDisabledException, UserBannedException, TenantDisabledException
from database.session import get_db
from model.user import User, UserStatus
from model.tenant import Tenant
from model.role import Role
from model.permission import Permission
from dao.user_dao import get_user_by_id
from dao.tenant_dao import get_tenant_by_id
from dao.rbac_dao import get_user_roles, get_role_permissions
from pydantic import BaseModel


class RequestContext(BaseModel):
    """请求上下文"""
    user_id: int
    tenant_id: Optional[int] = None
    username: str
    roles: List[str] = []
    permissions: List[str] = []
    is_super_admin: bool = False
    is_tenant_admin: bool = False
    user_type: str = "internal"
    
    class Config:
        arbitrary_types_allowed = True


def get_token_payload(token: str) -> dict:
    """解析JWT Token获取payload"""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        raise UnauthorizedException("无效的Token")


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """获取当前用户"""
    if not authorization:
        raise UnauthorizedException("未提供认证Token")
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise UnauthorizedException("无效的Token格式")
    
    token = parts[1]
    payload = get_token_payload(token)
    
    if payload.get("type") != "access":
        raise UnauthorizedException("Token类型错误")
    
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Token内容无效")
    
    # 查询用户
    user = get_user_by_id(db, int(user_id))
    if not user:
        raise UnauthorizedException("用户不存在")
    
    # 检查用户状态
    if user.status == UserStatus.DISABLED:
        raise UserDisabledException()
    if user.status == UserStatus.BANNED:
        raise UserBannedException()
    
    return user


def get_request_context(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> RequestContext:
    """获取请求上下文，包含用户、租户、角色、权限信息"""
    # 检查租户状态
    if user.tenant_id:
        tenant = get_tenant_by_id(db, user.tenant_id)
        if tenant and tenant.status == "disabled":
            raise TenantDisabledException()
    
    # 获取用户角色
    roles = get_user_roles(db, user.id)
    role_codes = [r.code for r in roles]
    
    # 获取用户权限
    permissions = []
    for role in roles:
        role_perms = get_role_permissions(db, role.id)
        permissions.extend([p.code for p in role_perms])
    permissions = list(set(permissions))  # 去重
    
    # 判断是否超级管理员
    is_super_admin = "super_admin" in role_codes
    is_tenant_admin = "tenant_admin" in role_codes
    
    return RequestContext(
        user_id=user.id,
        tenant_id=user.tenant_id,
        username=user.username,
        roles=role_codes,
        permissions=permissions,
        is_super_admin=is_super_admin,
        is_tenant_admin=is_tenant_admin,
        user_type=user.user_type or "internal"
    )


def require_permission(permission_code: str):
    """权限校验依赖工厂函数"""
    def permission_checker(ctx: RequestContext = Depends(get_request_context)) -> RequestContext:
        if ctx.is_super_admin:
            return ctx  # 超级管理员拥有所有权限
        
        if permission_code not in ctx.permissions:
            raise ForbiddenException(f"缺少权限: {permission_code}")
        
        return ctx
    
    return Depends(permission_checker)


def require_role(role_code: str):
    """角色校验依赖工厂函数"""
    def role_checker(ctx: RequestContext = Depends(get_request_context)) -> RequestContext:
        if ctx.is_super_admin:
            return ctx
        
        if role_code not in ctx.roles:
            raise ForbiddenException(f"缺少角色: {role_code}")
        
        return ctx
    
    return Depends(role_checker)


def require_admin():
    """管理员权限校验"""
    def admin_checker(ctx: RequestContext = Depends(get_request_context)) -> RequestContext:
        if ctx.is_super_admin or ctx.is_tenant_admin or "admin" in ctx.roles:
            return ctx
        raise ForbiddenException("需要管理员权限")
    
    return Depends(admin_checker)