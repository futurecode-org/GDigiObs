"""Dify 控制器"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import Optional, List, Dict
import json

from database.session import get_db
from core.dependencies import get_request_context, RequestContext
from core.response import ApiResponse
from schema.dify import (
    DifyProviderCreate, DifyProviderUpdate, DifyProviderResponse,
    DifyAppCreate, DifyAppUpdate, DifyAppResponse,
    DifyInvokeRequest, DifyInvokeResponse, DifyCallLogResponse,
    ChatAssistantCreate, ChatAssistantUpdate, ChatAssistantResponse,
    ChatRequest
)
from service.dify_service import (
    get_providers_service, get_provider_service, create_provider_service,
    update_provider_service, delete_provider_service, test_provider_service,
    get_apps_service, get_app_service, create_app_service, update_app_service,
    delete_app_service, invoke_app_service, stream_invoke_app_service,
    test_app_service, get_call_logs_service,
    get_assistants_service, get_assistant_service, create_assistant_service,
    update_assistant_service, delete_assistant_service, chat_with_assistant_service,
    get_apps_by_provider_service
)

dify_router = APIRouter(prefix="/dify", tags=["Dify"])
assistant_router = APIRouter(prefix="/chat-assistants", tags=["ChatAssistant"])


@dify_router.get("/providers", summary="获取 Dify Provider 列表")
def get_providers(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = get_providers_service(db, ctx, page, page_size)
    return ApiResponse.success(data=result)


@dify_router.post("/providers", summary="创建 Dify Provider")
def create_provider(
    data: DifyProviderCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    provider = create_provider_service(db, ctx, data.dict())
    return ApiResponse.success(data=DifyProviderResponse.from_orm(provider))


@dify_router.get("/providers/{provider_id}", summary="获取 Dify Provider 详情")
def get_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    provider = get_provider_service(db, ctx, provider_id)
    return ApiResponse.success(data=DifyProviderResponse.from_orm(provider))


@dify_router.put("/providers/{provider_id}", summary="更新 Dify Provider")
def update_provider(
    provider_id: int,
    data: DifyProviderUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    provider = update_provider_service(db, ctx, provider_id, data.dict(exclude_unset=True))
    return ApiResponse.success(data=DifyProviderResponse.from_orm(provider))


@dify_router.delete("/providers/{provider_id}", summary="删除 Dify Provider")
def delete_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    delete_provider_service(db, ctx, provider_id)
    return ApiResponse.success(message="删除成功")


@dify_router.post("/providers/{provider_id}/test", summary="测试 Dify Provider 连接")
async def test_provider(
    provider_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = await test_provider_service(db, ctx, provider_id)
    return ApiResponse.success(data=result)


@dify_router.get("/providers/{provider_id}/apps", summary="获取 Provider 下的 App 列表")
def get_provider_apps(
    provider_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = get_apps_by_provider_service(db, ctx, provider_id)
    return ApiResponse.success(data=result)


@dify_router.get("/apps", summary="获取 Dify App 列表")
def get_apps(
    app_type: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = get_apps_service(db, ctx, app_type, page, page_size)
    return ApiResponse.success(data=result)


@dify_router.post("/apps", summary="创建 Dify App")
def create_app(
    data: DifyAppCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    app = create_app_service(db, ctx, data.dict())
    return ApiResponse.success(data=DifyAppResponse.from_orm(app))


@dify_router.get("/apps/{app_id}", summary="获取 Dify App 详情")
def get_app(
    app_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    app = get_app_service(db, ctx, app_id)
    return ApiResponse.success(data=DifyAppResponse.from_orm(app))


@dify_router.put("/apps/{app_id}", summary="更新 Dify App")
def update_app(
    app_id: int,
    data: DifyAppUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    app = update_app_service(db, ctx, app_id, data.dict(exclude_unset=True))
    return ApiResponse.success(data=DifyAppResponse.from_orm(app))


@dify_router.delete("/apps/{app_id}", summary="删除 Dify App")
def delete_app(
    app_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    delete_app_service(db, ctx, app_id)
    return ApiResponse.success(message="删除成功")


@dify_router.post("/apps/{app_id}/test", summary="测试调用 Dify App")
async def test_app(
    app_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = await test_app_service(db, ctx, app_id)
    return ApiResponse.success(data=result)


@dify_router.post("/apps/{app_id}/invoke", summary="调用 Dify App")
async def invoke_app(
    app_id: int,
    data: DifyInvokeRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = await invoke_app_service(
        db, ctx, app_id,
        data.inputs, data.query, data.conversation_id,
        data.files, data.scene
    )
    return ApiResponse.success(data=result)


@dify_router.post("/apps/{app_id}/stream", summary="流式调用 Dify App")
async def stream_invoke_app(
    app_id: int,
    data: DifyInvokeRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    
    async def event_generator():
        async for event in stream_invoke_app_service(
            db, ctx, app_id,
            data.inputs, data.query, data.conversation_id,
            data.files, data.scene
        ):
            yield f"data: {json.dumps(event)}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")


@dify_router.get("/call-logs", summary="获取 Dify 调用日志")
def get_call_logs(
    dify_app_id: Optional[int] = Query(None),
    call_scene: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = get_call_logs_service(db, ctx, dify_app_id, call_scene, page, page_size)
    return ApiResponse.success(data=result)


@assistant_router.get("", summary="获取聊天助手列表")
def get_assistants(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = get_assistants_service(db, ctx, page, page_size)
    return ApiResponse.success(data=result)


@assistant_router.post("", summary="创建聊天助手")
def create_assistant(
    data: ChatAssistantCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    assistant = create_assistant_service(db, ctx, data.dict())
    return ApiResponse.success(data=ChatAssistantResponse.from_orm(assistant))


@assistant_router.get("/{assistant_id}", summary="获取聊天助手详情")
def get_assistant(
    assistant_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    assistant = get_assistant_service(db, ctx, assistant_id)
    return ApiResponse.success(data=ChatAssistantResponse.from_orm(assistant))


@assistant_router.put("/{assistant_id}", summary="更新聊天助手")
def update_assistant(
    assistant_id: int,
    data: ChatAssistantUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    assistant = update_assistant_service(db, ctx, assistant_id, data.dict(exclude_unset=True))
    return ApiResponse.success(data=ChatAssistantResponse.from_orm(assistant))


@assistant_router.delete("/{assistant_id}", summary="删除聊天助手")
def delete_assistant(
    assistant_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    delete_assistant_service(db, ctx, assistant_id)
    return ApiResponse.success(message="删除成功")


@assistant_router.post("/{assistant_id}/chat", summary="与助手对话")
async def chat_with_assistant(
    assistant_id: int,
    data: ChatRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    result = await chat_with_assistant_service(
        db, ctx, assistant_id, data.message, data.conversation_id, data.files
    )
    return ApiResponse.success(data=result)