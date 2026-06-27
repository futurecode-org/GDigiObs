"""审计日志管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.audit import OperationLogResponse, AuditLogResponse, OperationLogListResponse
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context
from service.audit_service import (
    get_operation_logs_service, get_audit_logs_service,
    get_ask_records_service, get_ask_record_detail_service,
    create_ask_record_service, update_ask_record_service, save_ask_record_service
)

from model.user import User


audit_router = APIRouter(prefix="/audit", tags=["审计管理 Audit"])


# 操作日志
@audit_router.get("/operations", summary="获取操作日志")
def list_operation_logs(
    module: str = None,
    action: str = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取操作日志"""
    ctx = get_request_context(current_user)
    result = get_operation_logs_service(db, ctx, module, action, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


# 审计日志
@audit_router.get("/logs", summary="获取审计日志")
def list_audit_logs(
    audit_type: str = None,
    risk_level: str = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取审计日志"""
    ctx = get_request_context(current_user)
    result = get_audit_logs_service(db, ctx, audit_type, risk_level, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


# 智能问数
ask_router = APIRouter(prefix="/ask", tags=["智能问数 Ask"])


@ask_router.get("", summary="获取问数记录列表")
def list_ask_records(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取问数记录列表"""
    ctx = get_request_context(current_user)
    result = get_ask_records_service(db, ctx, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@ask_router.get("/{record_id}", summary="获取问数记录详情")
def get_ask_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取问数记录详情"""
    ctx = get_request_context(current_user)
    result = get_ask_record_detail_service(db, ctx, record_id)
    return ApiResponse.success(data=result)


@ask_router.post("", summary="创建问数记录")
def create_ask_record(
    question: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建问数记录"""
    ctx = get_request_context(current_user)
    result = create_ask_record_service(db, ctx, question)
    return ApiResponse.success(data=result)


@ask_router.put("/{record_id}", summary="更新问数记录")
def update_ask_record(
    record_id: int,
    answer: str = None,
    data_source: str = None,
    chart_type: str = None,
    chart_config: dict = None,
    result_data: dict = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新问数记录"""
    ctx = get_request_context(current_user)
    update_data = {}
    if answer is not None:
        update_data["answer"] = answer
    if data_source is not None:
        update_data["data_source"] = data_source
    if chart_type is not None:
        update_data["chart_type"] = chart_type
    if chart_config is not None:
        update_data["chart_config"] = chart_config
    if result_data is not None:
        update_data["result_data"] = result_data
    
    result = update_ask_record_service(db, ctx, record_id, **update_data)
    return ApiResponse.success(data=result)


@ask_router.post("/{record_id}/save", summary="收藏/取消收藏")
def save_ask_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """收藏/取消收藏问数记录"""
    ctx = get_request_context(current_user)
    result = save_ask_record_service(db, ctx, record_id)
    return ApiResponse.success(data=result)