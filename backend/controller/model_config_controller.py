"""模型配置管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.model_config import (
    ModelConfigCreate, ModelConfigUpdate, ModelConfigResponse,
    ModelConfigListResponse, ModelConnectivityTest, ModelToggleStatus
)
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext
from service.model_config_service import (
    get_models_service, get_model_detail_service, create_model_service,
    update_model_service, delete_model_service, toggle_model_status_service,
    get_platform_models_service, get_available_embedding_models, test_model_service,
    get_model_call_logs_service, get_model_token_usage_service,
    get_model_usage_ranking_service, test_model_connectivity_service
)

from model.user import User


model_router = APIRouter(prefix="/models", tags=["模型管理 Model"])


@model_router.get("", summary="获取模型配置列表")
def list_models(
    model_type: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取模型配置列表"""
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
    ctx: RequestContext = Depends(get_request_context)
):
    """获取可用的Embedding模型"""
    result = get_available_embedding_models(db, ctx)
    return ApiResponse.success(data=result)


@model_router.post("/test-connectivity", summary="测试模型连通性")
def test_connectivity(
    data: ModelConnectivityTest,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """测试模型连通性（无需先保存模型）"""
    result = test_model_connectivity_service(
        db, ctx,
        base_url=data.base_url,
        api_key=data.api_key or "",
        model_key=data.model_key,
        api_type=data.api_type,
        max_tokens=data.max_tokens or 10
    )
    return ApiResponse.success(data=result)


@model_router.get("/{model_id}", summary="获取模型配置详情")
def get_model(
    model_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取模型配置详情"""
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
        temperature=data.temperature,
        currency=data.currency,
        input_price=data.input_price,
        output_price=data.output_price,
        default_config=data.default_config
    )
    return ApiResponse.success(data=result)


@model_router.put("/{model_id}", summary="更新模型配置")
def update_model(
    model_id: int,
    data: ModelConfigUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新模型配置"""
    result = update_model_service(db, ctx, model_id, **data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@model_router.delete("/{model_id}", summary="删除模型配置")
def delete_model(
    model_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除模型配置"""
    delete_model_service(db, ctx, model_id)
    return ApiResponse.success(message="模型配置已删除")


@model_router.post("/{model_id}/toggle", summary="启用/停用模型配置")
def toggle_model_status(
    model_id: int,
    data: ModelToggleStatus,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """启用/停用模型配置，status: enabled/disabled"""
    result = toggle_model_status_service(db, ctx, model_id, data.status)
    return ApiResponse.success(data=result)


@model_router.post("/{model_id}/test", summary="测试模型配置")
def test_model(
    model_id: int,
    db: Session = Depends(get_db),
    ctx = require_permission("model:test")
):
    """测试模型配置"""
    result = test_model_service(db, ctx, model_id)
    return ApiResponse.success(data=result)


@model_router.get("/{model_id}/logs", summary="获取模型调用日志")
def get_model_logs(
    model_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取模型调用日志"""
    result = get_model_call_logs_service(db, ctx, model_id, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@model_router.get("/{model_id}/token-usage", summary="获取模型Token消耗")
def get_model_token_usage(
    model_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取模型Token消耗统计"""
    result = get_model_token_usage_service(db, ctx, model_id)
    return ApiResponse.success(data=result)


@model_router.get("/rankings/usage", summary="获取模型调用排行")
def get_model_usage_ranking(
    top_n: int = 5,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取模型调用排行及估算费用（工作台用）"""
    result = get_model_usage_ranking_service(db, ctx, top_n)
    return ApiResponse.success(data=result)


# 路由顺序关键：所有静态路径必须放在 /{model_id} 之前，否则会被捕获为 model_id
