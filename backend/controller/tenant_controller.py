from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.tenant import TenantCreate, TenantUpdate, TenantResponse, TenantListResponse
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import require_permission, require_admin, get_request_context
from core.exceptions import NotFoundException, ForbiddenException
from service.tenant_service import create_tenant, update_tenant, get_tenant_list, get_tenant_detail, disable_tenant

tenant_router = APIRouter(prefix="/tenants", tags=["租户管理 Tenant"])


@tenant_router.get("", summary="租户列表")
def list_tenants(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx = require_permission("tenant:view")
):
    """
    获取租户列表
    
    - 仅管理员可访问
    - 支持分页
    """
    result = get_tenant_list(db, page, page_size)
    paginated = PaginatedData(
        items=[TenantResponse.model_validate(tenant) for tenant in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )
    return PaginatedResponse.success(data=paginated)


@tenant_router.post("", summary="创建租户")
def create(
    data: TenantCreate,
    db: Session = Depends(get_db),
    ctx = require_permission("tenant:create")
):
    """
    创建租户
    
    - 仅平台超级管理员可操作
    - 支持创建企业租户和个人租户
    """
    tenant = create_tenant(db, data, ctx)
    return ApiResponse.success(data=TenantResponse.model_validate(tenant))


@tenant_router.get("/{tenant_id}", summary="租户详情")
def get_detail(
    tenant_id: int,
    db: Session = Depends(get_db),
    ctx = require_permission("tenant:view")
):
    """
    获取租户详情
    
    - 仅管理员可访问
    """
    tenant = get_tenant_detail(db, tenant_id)
    return ApiResponse.success(data=TenantResponse.model_validate(tenant))


@tenant_router.put("/{tenant_id}", summary="更新租户")
def update(
    tenant_id: int,
    data: TenantUpdate,
    db: Session = Depends(get_db),
    ctx = require_permission("tenant:update")
):
    """
    更新租户信息
    
    - 仅管理员可操作
    """
    tenant = update_tenant(db, tenant_id, data, ctx)
    return ApiResponse.success(data=TenantResponse.model_validate(tenant))


@tenant_router.post("/{tenant_id}/disable", summary="停用租户")
def disable(
    tenant_id: int,
    db: Session = Depends(get_db),
    ctx = require_permission("tenant:disable")
):
    """
    停用租户
    
    - 仅平台超级管理员可操作
    - 停用后租户下用户无法登录
    """
    disable_tenant(db, tenant_id, ctx)
    return ApiResponse.success(message="租户已停用")