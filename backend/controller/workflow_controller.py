"""工作流管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.workflow import (
    WorkflowCreate, WorkflowUpdate, WorkflowResponse, WorkflowRunResponse,
    WorkflowRunCreate, WorkflowListResponse
)
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext, RequestContext
from service.workflow_service import (
    get_workflows_service, get_workflow_detail_service, create_workflow_service,
    update_workflow_service, delete_workflow_service, enable_workflow_service,
    disable_workflow_service, run_workflow_service, get_workflow_runs_service,
    get_workflow_run_detail_service
)

from model.user import User


workflow_router = APIRouter(prefix="/workflows", tags=["工作流管理 Workflow"])


@workflow_router.get("", summary="获取工作流列表")
def list_workflows(
    status: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取工作流列表"""
    result = get_workflows_service(db, ctx, status, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@workflow_router.get("/{workflow_id}", summary="获取工作流详情")
def get_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取工作流详情"""
    result = get_workflow_detail_service(db, ctx, workflow_id)
    return ApiResponse.success(data=result)


@workflow_router.post("", summary="创建工作流")
def create_workflow(
    data: WorkflowCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """创建工作流"""
    result = create_workflow_service(
        db, ctx, data.name, data.nodes, data.edges,
        description=data.description,
        trigger_type=data.trigger_type,
        schedule_config=data.schedule_config
    )
    return ApiResponse.success(data=result)


@workflow_router.put("/{workflow_id}", summary="更新工作流")
def update_workflow(
    workflow_id: int,
    data: WorkflowUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新工作流"""
    result = update_workflow_service(db, ctx, workflow_id, **data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@workflow_router.delete("/{workflow_id}", summary="删除工作流")
def delete_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除工作流"""
    delete_workflow_service(db, ctx, workflow_id)
    return ApiResponse.success(message="工作流已删除")


@workflow_router.post("/{workflow_id}/enable", summary="启用工作流")
def enable_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """启用工作流"""
    enable_workflow_service(db, ctx, workflow_id)
    return ApiResponse.success(message="工作流已启用")


@workflow_router.post("/{workflow_id}/disable", summary="禁用工作流")
def disable_workflow(
    workflow_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """禁用工作流"""
    disable_workflow_service(db, ctx, workflow_id)
    return ApiResponse.success(message="工作流已禁用")


@workflow_router.post("/{workflow_id}/run", summary="执行工作流")
def run_workflow(
    workflow_id: int,
    data: WorkflowRunCreate = None,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """执行工作流"""
    input_data = data.input_data if data else None
    result = run_workflow_service(db, ctx, workflow_id, input_data)
    return ApiResponse.success(data=result)


@workflow_router.get("/{workflow_id}/runs", summary="获取执行记录列表")
def list_workflow_runs(
    workflow_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取工作流执行记录列表"""
    result = get_workflow_runs_service(db, ctx, workflow_id, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@workflow_router.get("/runs/{run_id}", summary="获取执行记录详情")
def get_workflow_run(
    run_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取工作流执行记录详情"""
    result = get_workflow_run_detail_service(db, ctx, run_id)
    return ApiResponse.success(data=result)