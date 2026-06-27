"""数据清洗控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, get_request_context, RequestContext
from service.clean_service import (
    get_rules_service, get_rule_detail_service, create_rule_service,
    update_rule_service, delete_rule_service, execute_clean_service,
    get_logs_service
)

from model.user import User


clean_router = APIRouter(prefix="/clean", tags=["数据清洗 Clean"])


@clean_router.get("/rules", summary="获取清洗规则列表")
def list_rules(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取清洗规则列表"""
    result = get_rules_service(db, ctx, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@clean_router.get("/rules/{rule_id}", summary="获取清洗规则详情")
def get_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取清洗规则详情"""
    result = get_rule_detail_service(db, ctx, rule_id)
    return ApiResponse.success(data=result)


@clean_router.post("/rules", summary="创建清洗规则")
def create_rule(
    name: str,
    rule_type: str,
    config: dict,
    description: str = None,
    task_ids: list = None,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """创建清洗规则"""
    result = create_rule_service(
        db, ctx, name, rule_type, config,
        description=description,
        task_ids=task_ids
    )
    return ApiResponse.success(data=result)


@clean_router.put("/rules/{rule_id}", summary="更新清洗规则")
def update_rule(
    rule_id: int,
    name: str = None,
    rule_type: str = None,
    config: dict = None,
    description: str = None,
    task_ids: list = None,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新清洗规则"""
    update_data = {}
    if name is not None:
        update_data["name"] = name
    if rule_type is not None:
        update_data["rule_type"] = rule_type
    if config is not None:
        update_data["config"] = config
    if description is not None:
        update_data["description"] = description
    if task_ids is not None:
        update_data["task_ids"] = task_ids
    
    result = update_rule_service(db, ctx, rule_id, **update_data)
    return ApiResponse.success(data=result)


@clean_router.delete("/rules/{rule_id}", summary="删除清洗规则")
def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除清洗规则"""
    delete_rule_service(db, ctx, rule_id)
    return ApiResponse.success(message="清洗规则已删除")


@clean_router.post("/rules/{rule_id}/execute", summary="执行清洗规则")
def execute_clean(
    rule_id: int,
    task_id: int = None,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """执行清洗规则"""
    result = execute_clean_service(db, ctx, rule_id, task_id)
    return ApiResponse.success(data=result)


@clean_router.get("/logs", summary="获取清洗日志")
def list_logs(
    rule_id: int = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取清洗日志"""
    result = get_logs_service(db, ctx, rule_id, page, page_size)
    paginated = PaginatedData(
        items=result,
        total=len(result),
        page=page,
        page_size=page_size
    )
    return PaginatedResponse.success(data=paginated)