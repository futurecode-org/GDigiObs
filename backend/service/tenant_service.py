import logging
from sqlalchemy.orm import Session
from typing import Dict

from dao.tenant_dao import get_tenant_by_id, get_all_tenants, count_all_tenants, create_tenant, update_tenant, update_tenant_status
from model.tenant import Tenant
from schema.tenant import TenantCreate, TenantUpdate
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def get_tenant_list(db: Session, page: int = 1, page_size: int = 20) -> Dict:
    """获取租户列表"""
    tenants = get_all_tenants(db, page, page_size)
    total = count_all_tenants(db)
    return {
        "items": tenants,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total // page_size) + (1 if total % page_size > 0 else 0)
    }


def get_tenant_detail(db: Session, tenant_id: int) -> Tenant:
    """获取租户详情"""
    tenant = get_tenant_by_id(db, tenant_id)
    if not tenant:
        raise NotFoundException("租户不存在")
    return tenant


def create_tenant(db: Session, data: TenantCreate, ctx: RequestContext) -> Tenant:
    """创建租户"""
    # 只有超级管理员可以创建企业租户
    if not ctx.is_super_admin:
        raise ForbiddenException("只有平台超级管理员可以创建租户")
    
    tenant = Tenant(
        name=data.name,
        type=data.type,
        admin_user_id=data.admin_user_id,
        config=data.config or Tenant.DEFAULT_CONFIG,
        status="enabled"
    )
    return create_tenant(db, tenant)


def update_tenant(db: Session, tenant_id: int, data: TenantUpdate, ctx: RequestContext) -> Tenant:
    """更新租户"""
    tenant = get_tenant_detail(db, tenant_id)
    
    # 只有超级管理员可以修改租户
    if not ctx.is_super_admin:
        raise ForbiddenException("只有平台超级管理员可以修改租户")
    
    if data.name:
        tenant.name = data.name
    if data.config:
        tenant.config = data.config
    
    return update_tenant(db, tenant)


def disable_tenant(db: Session, tenant_id: int, ctx: RequestContext):
    """停用租户"""
    if not ctx.is_super_admin:
        raise ForbiddenException("只有平台超级管理员可以停用租户")
    
    tenant = get_tenant_detail(db, tenant_id)
    update_tenant_status(db, tenant_id, "disabled")
    logger.info(f"租户已停用: {tenant.name}")