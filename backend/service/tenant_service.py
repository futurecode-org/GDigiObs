"""租户管理业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import Dict, Optional

from dao.tenant_dao import (
    get_tenant_by_id, get_all_tenants, count_all_tenants, 
    create_tenant as dao_create_tenant, update_tenant, update_tenant_status,
    soft_delete_tenant, get_tenant_by_name
)
from dao.user_dao import get_users_by_tenant, count_users_by_tenant
from model.tenant import Tenant
from schema.tenant import TenantCreate, TenantUpdate
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def get_tenant_list(db: Session, ctx: RequestContext, page: int = 1, page_size: int = 20) -> Dict:
    """获取租户列表
    
    - 超级管理员可查看所有租户
    - 租户管理员只能查看本租户
    """
    if ctx.is_super_admin:
        tenants = get_all_tenants(db, page, page_size)
        total = count_all_tenants(db)
    else:
        # 非超级管理员只能查看自己所属租户
        tenant = get_tenant_by_id(db, ctx.tenant_id)
        tenants = [tenant] if tenant else []
        total = 1 if tenant else 0
    
    return {
        "items": tenants,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total // page_size) + (1 if total % page_size > 0 else 0)
    }


def get_tenant_detail(db: Session, tenant_id: int, ctx: RequestContext) -> Tenant:
    """获取租户详情"""
    tenant = get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise NotFoundException("租户不存在")
    
    # 权限检查：非超级管理员只能查看本租户
    if not ctx.is_super_admin and tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权查看该租户信息")
    
    return tenant


def create_tenant(db: Session, data: TenantCreate, ctx: RequestContext) -> Tenant:
    """创建租户
    
    - 只有超级管理员可以创建企业租户
    - 个人租户在注册时自动创建
    """
    if not ctx.is_super_admin:
        raise ForbiddenException("只有平台超级管理员可以创建租户")
    
    # 检查租户名称是否已存在
    existing = get_tenant_by_name(db, data.name)
    if existing:
        raise BadRequestException("租户名称已存在")
    
    tenant = Tenant(
        name=data.name,
        type=data.type or "enterprise",
        admin_user_id=data.admin_user_id,
        config=data.config or Tenant.DEFAULT_CONFIG,
        status="enabled"
    )
    return dao_create_tenant(db, tenant)


def update_tenant(db: Session, tenant_id: int, data: TenantUpdate, ctx: RequestContext) -> Tenant:
    """更新租户信息"""
    tenant = get_tenant_detail(db, tenant_id, ctx)
    
    if not ctx.is_super_admin and tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能修改本租户信息")
    
    update_data = {}
    if data.name is not None:
        # 检查新名称是否与其他租户冲突
        if data.name != tenant.name:
            existing = get_tenant_by_name(db, data.name)
            if existing and existing.id != tenant_id:
                raise BadRequestException("租户名称已存在")
        update_data["name"] = data.name
    if data.config is not None:
        update_data["config"] = data.config
    
    if update_data:
        return update_tenant(db, tenant, **update_data)
    return tenant


def disable_tenant(db: Session, tenant_id: int, ctx: RequestContext):
    """停用租户
    
    - 停用后该租户下用户不可登录
    - 后台任务暂停执行
    """
    if not ctx.is_super_admin:
        raise ForbiddenException("只有平台超级管理员可以停用租户")
    
    tenant = get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise NotFoundException("租户不存在")
    
    # 不能停用超级管理员自己的租户
    # 获取超级管理员用户
    from dao.user_dao import get_user_by_id
    admin_user = get_user_by_id(db, tenant.admin_user_id) if tenant.admin_user_id else None
    if admin_user and admin_user.user_type == "admin":
        # 检查是否是平台超级管理员的租户
        from dao.rbac_dao import get_user_roles
        roles = get_user_roles(db, admin_user.id)
        role_codes = [r.code for r in roles]
        if "super_admin" in role_codes:
            raise BadRequestException("不能停用平台超级管理员所属租户")
    
    update_tenant_status(db, tenant_id, "disabled")
    logger.info(f"租户已停用: tenant_id={tenant_id}, name={tenant.name}")


def enable_tenant(db: Session, tenant_id: int, ctx: RequestContext):
    """启用租户"""
    if not ctx.is_super_admin:
        raise ForbiddenException("只有平台超级管理员可以启用租户")
    
    tenant = get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise NotFoundException("租户不存在")
    
    update_tenant_status(db, tenant_id, "enabled")
    logger.info(f"租户已启用: tenant_id={tenant_id}, name={tenant.name}")


def delete_tenant(db: Session, tenant_id: int, ctx: RequestContext):
    """删除租户（软删除）
    
    - 只有超级管理员可以删除租户
    - 删除前需确认租户下无活跃用户
    """
    if not ctx.is_super_admin:
        raise ForbiddenException("只有平台超级管理员可以删除租户")
    
    tenant = get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise NotFoundException("租户不存在")
    
    # 检查租户下是否有活跃用户
    user_count = count_users_by_tenant(db, tenant_id)
    if user_count > 0:
        raise BadRequestException(f"租户下还有 {user_count} 个用户，无法删除")
    
    soft_delete_tenant(db, tenant_id)
    logger.info(f"租户已删除: tenant_id={tenant_id}, name={tenant.name}")


def get_tenant_users(db: Session, tenant_id: int, ctx: RequestContext, page: int = 1, page_size: int = 20) -> Dict:
    """获取租户下的用户列表"""
    tenant = get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise NotFoundException("租户不存在")
    
    if not ctx.is_super_admin and tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权查看该租户用户")
    
    users = get_users_by_tenant(db, tenant_id, page, page_size)
    total = count_users_by_tenant(db, tenant_id)
    
    return {
        "items": users,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total // page_size) + (1 if total % page_size > 0 else 0)
    }


def get_tenant_stats(db: Session, tenant_id: int, ctx: RequestContext) -> Dict:
    """获取租户统计信息"""
    tenant = get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise NotFoundException("租户不存在")
    
    if not ctx.is_super_admin and tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权查看该租户统计")
    
    user_count = count_users_by_tenant(db, tenant_id)
    
    return {
        "tenant_id": tenant_id,
        "tenant_name": tenant.name,
        "tenant_type": tenant.type,
        "status": tenant.status,
        "user_count": user_count,
        "config": tenant.config,
        "created_at": tenant.created_at,
        "updated_at": tenant.updated_at
    }
