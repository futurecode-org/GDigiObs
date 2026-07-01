"""Chroma 配置控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.chroma_config import ChromaConfigCreate, ChromaConfigUpdate, ChromaConfigResponse
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_request_context, RequestContext
from service.chroma_config_service import (
    get_chroma_configs_service, get_chroma_config_detail_service,
    create_chroma_config_service, update_chroma_config_service,
    delete_chroma_config_service, test_chroma_connection_service
)

chroma_config_router = APIRouter(prefix="/chroma-configs", tags=["Chroma 配置管理"])


@chroma_config_router.get("", summary="获取 Chroma 配置列表")
def list_chroma_configs(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = get_chroma_configs_service(db, ctx, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@chroma_config_router.post("", summary="创建 Chroma 配置")
def create_chroma_config(
    data: ChromaConfigCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = create_chroma_config_service(db, ctx, data.model_dump())
    return ApiResponse.success(data=result)


@chroma_config_router.get("/{config_id}", summary="获取 Chroma 配置详情")
def get_chroma_config(
    config_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = get_chroma_config_detail_service(db, ctx, config_id)
    return ApiResponse.success(data=result)


@chroma_config_router.put("/{config_id}", summary="更新 Chroma 配置")
def update_chroma_config(
    config_id: int,
    data: ChromaConfigUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = update_chroma_config_service(db, ctx, config_id, data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@chroma_config_router.delete("/{config_id}", summary="删除 Chroma 配置")
def delete_chroma_config(
    config_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    delete_chroma_config_service(db, ctx, config_id)
    return ApiResponse.success(message="配置已删除")


@chroma_config_router.post("/{config_id}/test", summary="测试 Chroma 连接")
async def test_chroma_connection(
    config_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = await test_chroma_connection_service(db, ctx, config_id)
    return ApiResponse.success(data={"connected": result})
