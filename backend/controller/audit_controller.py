"""审计日志管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.audit import (
    OperationLogResponse, AuditLogResponse, OperationLogListResponse,
    AskRecordCreate, AskRecordUpdate
)
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext, RequestContext
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
    ctx: RequestContext = Depends(get_request_context)
):
    """获取操作日志"""
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
    ctx: RequestContext = Depends(get_request_context)
):
    """获取审计日志"""
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
    ctx: RequestContext = Depends(get_request_context)
):
    """获取问数记录列表"""
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
    ctx: RequestContext = Depends(get_request_context)
):
    """获取问数记录详情"""
    result = get_ask_record_detail_service(db, ctx, record_id)
    return ApiResponse.success(data=result)


@ask_router.post("", summary="创建问数记录")
def create_ask_record(
    data: AskRecordCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """创建问数记录"""
    result = create_ask_record_service(db, ctx, data.question)
    return ApiResponse.success(data=result)


@ask_router.put("/{record_id}", summary="更新问数记录")
def update_ask_record(
    record_id: int,
    data: AskRecordUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新问数记录"""
    update_data = data.model_dump(exclude_unset=True)
    
    result = update_ask_record_service(db, ctx, record_id, **update_data)
    return ApiResponse.success(data=result)


@ask_router.post("/{record_id}/save", summary="收藏/取消收藏")
def save_ask_record(
    record_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """收藏/取消收藏问数记录"""
    result = save_ask_record_service(db, ctx, record_id)
    return ApiResponse.success(data=result)
