"""数据分析控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, get_request_context
from service.analysis_service import (
    get_tasks_service, get_task_detail_service, create_task_service,
    update_task_service, delete_task_service, execute_analysis_service,
    get_logs_service
)

from model.user import User


analysis_router = APIRouter(prefix="/analysis", tags=["数据分析 Analysis"])


@analysis_router.get("/tasks", summary="获取分析任务列表")
def list_tasks(
    analysis_type: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取分析任务列表"""
    ctx = get_request_context(current_user)
    result = get_tasks_service(db, ctx, analysis_type, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@analysis_router.get("/tasks/{task_id}", summary="获取分析任务详情")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取分析任务详情"""
    ctx = get_request_context(current_user)
    result = get_task_detail_service(db, ctx, task_id)
    return ApiResponse.success(data=result)


@analysis_router.post("/tasks", summary="创建分析任务")
def create_task(
    name: str,
    analysis_type: str,
    data_source: dict,
    config: dict = None,
    description: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建分析任务"""
    ctx = get_request_context(current_user)
    result = create_task_service(
        db, ctx, name, analysis_type, data_source, config,
        description=description
    )
    return ApiResponse.success(data=result)


@analysis_router.put("/tasks/{task_id}", summary="更新分析任务")
def update_task(
    task_id: int,
    name: str = None,
    analysis_type: str = None,
    data_source: dict = None,
    config: dict = None,
    description: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新分析任务"""
    ctx = get_request_context(current_user)
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if analysis_type is not None:
        update_data["analysis_type"] = analysis_type
    if data_source is not None:
        update_data["data_source"] = data_source
    if config is not None:
        update_data["config"] = config
    if description is not None:
        update_data["description"] = description
    
    result = update_task_service(db, ctx, task_id, **update_data)
    return ApiResponse.success(data=result)


@analysis_router.delete("/tasks/{task_id}", summary="删除分析任务")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除分析任务"""
    ctx = get_request_context(current_user)
    delete_task_service(db, ctx, task_id)
    return ApiResponse.success(message="分析任务已删除")


@analysis_router.post("/tasks/{task_id}/execute", summary="执行分析任务")
def execute_analysis(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """执行分析任务"""
    ctx = get_request_context(current_user)
    result = execute_analysis_service(db, ctx, task_id)
    return ApiResponse.success(data=result)


@analysis_router.get("/logs", summary="获取分析日志")
def list_logs(
    task_id: int = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取分析日志"""
    ctx = get_request_context(current_user)
    result = get_logs_service(db, ctx, task_id, page, page_size)
    paginated = PaginatedData(
        items=result,
        total=len(result),
        page=page,
        page_size=page_size
    )
    return PaginatedResponse.success(data=paginated)