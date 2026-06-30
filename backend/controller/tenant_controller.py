"""租户管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.tenant import TenantCreate, TenantUpdate, TenantResponse, TenantListResponse
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import require_permission, require_admin, get_request_context, RequestContext
from core.exceptions import NotFoundException, ForbiddenException
from service.tenant_service import (
    get_tenant_list, get_tenant_detail, create_tenant, update_tenant, 
    disable_tenant, enable_tenant, delete_tenant, get_tenant_users, get_tenant_stats
)

tenant_router = APIRouter(prefix="/tenants", tags=["租户管理 Tenant"])


@tenant_router.get("", summary="租户列表")
def list_tenants(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取租户列表
    
    - 平台超级管理员可查看所有租户
    - 租户管理员只能查看本租户
    - 支持分页
    """
    result = get_tenant_list(db, ctx, page, page_size)
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
    ctx: RequestContext = Depends(get_request_context)
):
    """
    创建租户
    
    - 仅平台超级管理员可操作
    - 支持创建企业租户
    """
    tenant = create_tenant(db, data, ctx)
    return ApiResponse.success(data=TenantResponse.model_validate(tenant))


@tenant_router.get("/{tenant_id}", summary="租户详情")
def get_detail(
    tenant_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取租户详情
    
    - 平台超级管理员可查看所有租户
    - 租户管理员只能查看本租户
    """
    tenant = get_tenant_detail(db, tenant_id, ctx)
    return ApiResponse.success(data=TenantResponse.model_validate(tenant))


@tenant_router.put("/{tenant_id}", summary="更新租户")
def update(
    tenant_id: int,
    data: TenantUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    更新租户信息
    
    - 仅平台超级管理员可操作
    """
    tenant = update_tenant(db, tenant_id, data, ctx)
    return ApiResponse.success(data=TenantResponse.model_validate(tenant))


@tenant_router.post("/{tenant_id}/disable", summary="停用租户")
def disable(
    tenant_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    停用租户
    
    - 仅平台超级管理员可操作
    - 停用后租户下用户无法登录
    - 后台任务暂停执行
    """
    disable_tenant(db, tenant_id, ctx)
    return ApiResponse.success(message="租户已停用")


@tenant_router.post("/{tenant_id}/enable", summary="启用租户")
def enable(
    tenant_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    启用租户
    
    - 仅平台超级管理员可操作
    """
    enable_tenant(db, tenant_id, ctx)
    return ApiResponse.success(message="租户已启用")


@tenant_router.delete("/{tenant_id}", summary="删除租户")
def delete(
    tenant_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    删除租户（软删除）
    
    - 仅平台超级管理员可操作
    - 租户下无用户时才能删除
    """
    delete_tenant(db, tenant_id, ctx)
    return ApiResponse.success(message="租户已删除")


@tenant_router.get("/{tenant_id}/users", summary="租户用户列表")
def list_tenant_users(
    tenant_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取租户下的用户列表
    
    - 平台超级管理员可查看所有租户用户
    - 租户管理员只能查看本租户用户
    """
    from schema.user import UserResponse
    result = get_tenant_users(db, tenant_id, ctx, page, page_size)
    paginated = PaginatedData(
        items=[UserResponse.model_validate(u) for u in result["items"]],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )
    return PaginatedResponse.success(data=paginated)


@tenant_router.get("/{tenant_id}/stats", summary="租户统计")
def tenant_stats(
    tenant_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """
    获取租户统计信息
    
    - 包含用户数、租户配置等
    """
    stats = get_tenant_stats(db, tenant_id, ctx)
    return ApiResponse.success(data=stats)
