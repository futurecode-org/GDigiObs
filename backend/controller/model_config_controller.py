"""模型配置管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.model_config import (
    ModelConfigCreate, ModelConfigUpdate, ModelConfigResponse,
    ModelConfigListResponse
)
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context
from service.model_config_service import (
    get_models_service, get_model_detail_service, create_model_service,
    update_model_service, delete_model_service, get_platform_models_service,
    get_available_embedding_models, test_model_service
)

from model.user import User


model_router = APIRouter(prefix="/models", tags=["模型管理 Model"])


@model_router.get("", summary="获取模型配置列表")
def list_models(
    model_type: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取模型配置列表"""
    ctx = get_request_context(current_user)
    result = get_models_service(db, ctx, model_type, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@model_router.get("/platform", summary="获取平台预置模型")
def list_platform_models(db: Session = Depends(get_db)):
    """获取平台预置模型列表"""
    result = get_platform_models_service(db)
    return ApiResponse.success(data=result)


@model_router.get("/embedding", summary="获取可用Embedding模型")
def list_embedding_models(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取可用的Embedding模型"""
    ctx = get_request_context(current_user)
    result = get_available_embedding_models(db, ctx)
    return ApiResponse.success(data=result)


@model_router.get("/{model_id}", summary="获取模型配置详情")
def get_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取模型配置详情"""
    ctx = get_request_context(current_user)
    result = get_model_detail_service(db, ctx, model_id)
    return ApiResponse.success(data=result)


@model_router.post("", summary="创建模型配置")
def create_model(
    data: ModelConfigCreate,
    db: Session = Depends(get_db),
    ctx = require_permission("model:create")
):
    """创建模型配置"""
    result = create_model_service(
        db, ctx, data.name, data.model_key, data.model_type,
        data.api_type, data.base_url, data.api_key, data.visibility,
        support_tool_call=data.support_tool_call,
        support_vision=data.support_vision,
        support_reasoning=data.support_reasoning,
        context_length=data.context_length,
        max_tokens=data.max_tokens,
        default_config=data.default_config
    )
    return ApiResponse.success(data=result)


@model_router.put("/{model_id}", summary="更新模型配置")
def update_model(
    model_id: int,
    data: ModelConfigUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新模型配置"""
    ctx = get_request_context(current_user)
    result = update_model_service(db, ctx, model_id, **data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@model_router.delete("/{model_id}", summary="删除模型配置")
def delete_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除模型配置"""
    ctx = get_request_context(current_user)
    delete_model_service(db, ctx, model_id)
    return ApiResponse.success(message="模型配置已删除")


@model_router.post("/{model_id}/test", summary="测试模型配置")
def test_model(
    model_id: int,
    db: Session = Depends(get_db),
    ctx = require_permission("model:test")
):
    """测试模型配置"""
    result = test_model_service(db, ctx, model_id)
    return ApiResponse.success(data=result)