"""数据采集控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.collect import (
    CollectPlatformCreate, CollectPlatformResponse,
    CollectTaskCreate, CollectTaskUpdate, CollectTaskResponse,
    CollectedItemResponse, CollectedItemUpdate,
    CollectTaskListResponse, CollectedItemListResponse
)
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context
from service.collect_service import (
    get_platforms_service, create_platform_service,
    get_tasks_service, get_task_detail_service, create_task_service,
    update_task_service, delete_task_service, enable_task_service, disable_task_service,
    get_items_service, get_item_detail_service, update_item_service,
    clean_item_service, analyze_item_service, get_logs_service
)

from model.user import User


collect_router = APIRouter(prefix="/collect", tags=["数据采集 Collect"])


# 采集平台管理（管理员功能）
@collect_router.get("/platforms", summary="获取采集平台列表")
def list_platforms(db: Session = Depends(get_db)):
    """获取所有采集平台"""
    result = get_platforms_service(db)
    return ApiResponse.success(data=result)


@collect_router.post("/platforms", summary="创建采集平台")
def create_platform(
    data: CollectPlatformCreate,
    db: Session = Depends(get_db),
    ctx = require_permission("collect:platform:create")
):
    """创建采集平台"""
    result = create_platform_service(db, data.name, data.platform_type, 
                                     data.default_method, data.config_schema)
    return ApiResponse.success(data=result)


# 采集任务管理
@collect_router.get("/tasks", summary="获取采集任务列表")
def list_tasks(
    page: int = 1,
    page_size: int = 20,
    is_public: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取采集任务列表"""
    ctx = get_request_context(current_user)
    result = get_tasks_service(db, ctx, page, page_size, is_public)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@collect_router.get("/tasks/{task_id}", summary="获取采集任务详情")
def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取采集任务详情"""
    ctx = get_request_context(current_user)
    result = get_task_detail_service(db, ctx, task_id)
    return ApiResponse.success(data=result)


@collect_router.post("/tasks", summary="创建采集任务")
def create_task(
    data: CollectTaskCreate,
    db: Session = Depends(get_db),
    ctx = require_permission("collect:task:create")
):
    """创建采集任务"""
    result = create_task_service(
        db, ctx, data.name, data.platform_id, data.collect_method,
        source_url=data.source_url,
        request_config=data.request_config,
        parse_rule=data.parse_rule,
        schedule_config=data.schedule_config,
        is_public=data.is_public
    )
    return ApiResponse.success(data=result)


@collect_router.put("/tasks/{task_id}", summary="更新采集任务")
def update_task(
    task_id: int,
    data: CollectTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新采集任务"""
    ctx = get_request_context(current_user)
    result = update_task_service(db, ctx, task_id, **data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@collect_router.delete("/tasks/{task_id}", summary="删除采集任务")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除采集任务"""
    ctx = get_request_context(current_user)
    delete_task_service(db, ctx, task_id)
    return ApiResponse.success(message="任务已删除")


@collect_router.post("/tasks/{task_id}/enable", summary="启用采集任务")
def enable_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """启用采集任务"""
    ctx = get_request_context(current_user)
    enable_task_service(db, ctx, task_id)
    return ApiResponse.success(message="任务已启用")


@collect_router.post("/tasks/{task_id}/disable", summary="禁用采集任务")
def disable_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """禁用采集任务"""
    ctx = get_request_context(current_user)
    disable_task_service(db, ctx, task_id)
    return ApiResponse.success(message="任务已禁用")


# 采集数据管理
@collect_router.get("/items", summary="获取采集数据列表")
def list_items(
    task_id: int = None,
    status: str = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取采集数据列表"""
    ctx = get_request_context(current_user)
    result = get_items_service(db, ctx, task_id, status, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@collect_router.get("/items/{item_id}", summary="获取采集数据详情")
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取采集数据详情"""
    ctx = get_request_context(current_user)
    result = get_item_detail_service(db, ctx, item_id)
    return ApiResponse.success(data=result)


@collect_router.put("/items/{item_id}", summary="更新采集数据")
def update_item(
    item_id: int,
    data: CollectedItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新采集数据"""
    ctx = get_request_context(current_user)
    result = update_item_service(db, ctx, item_id, **data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@collect_router.post("/items/{item_id}/clean", summary="数据清洗")
def clean_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """标记数据为已清洗"""
    ctx = get_request_context(current_user)
    clean_item_service(db, ctx, item_id)
    return ApiResponse.success(message="数据已清洗")


@collect_router.post("/items/{item_id}/analyze", summary="数据分析")
def analyze_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """标记数据为已分析"""
    ctx = get_request_context(current_user)
    analyze_item_service(db, ctx, item_id)
    return ApiResponse.success(message="数据已分析")


# 采集日志
@collect_router.get("/logs", summary="获取采集日志")
def list_logs(
    task_id: int = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取采集日志列表"""
    ctx = get_request_context(current_user)
    result = get_logs_service(db, ctx, task_id, page, page_size)
    return ApiResponse.success(data=result)