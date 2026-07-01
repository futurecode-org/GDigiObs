"""审计日志管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.audit import (
    OperationLogResponse, AuditLogResponse, OperationLogListResponse,
    AskRecordCreate, AskRecordUpdate,
    SensitiveWordCreate, SensitiveWordUpdate, SensitiveWordBatchImport,
    MessageReviewRequest, AlertRuleUpdate,
    ChatDetectRequest, ChatDetectResponse,
    ChatMessageDetectRequest, ChatMessageAuditListResponse,
    ChatDetectBatchRequest, ChatDetectBatchResponse,
)
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext, require_admin
from service.audit_service import (
    get_operation_logs_service, get_audit_logs_service,
    get_ask_records_service, get_ask_record_detail_service,
    create_ask_record_service, update_ask_record_service, save_ask_record_service
)
from service.audit_risk_service import (
    get_message_audit_list, get_message_audit_detail, get_message_context,
    review_message, trigger_message_alert,
    get_sensitive_words_service, create_sensitive_word_service,
    update_sensitive_word_service, delete_sensitive_word_service,
    batch_import_sensitive_words,
    get_alert_records_service, resolve_alert_service,
    get_alert_rules_service, update_alert_rule_service
)
from service.chat_ai_detection_service import (
    detect_chat_content_service, detect_message_service,
    detect_recent_messages_service, get_chat_messages_for_audit_service
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


# 聊天审计消息
@audit_router.get("/chat-messages", summary="获取聊天审计消息列表")
def list_chat_messages(
    audit_status: str = None,
    risk_level: str = None,
    keyword: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取聊天审计消息列表"""
    result = get_chat_messages_for_audit_service(
        db, ctx, audit_status=audit_status, risk_level=risk_level,
        keyword=keyword, page=page, page_size=page_size
    )
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@audit_router.post("/chat/detect", summary="AI 检测聊天内容")
async def detect_chat_content_endpoint(
    data: ChatDetectRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_permission("audit:chat_detect")
):
    """对任意聊天内容进行 AI 风险检测（不持久化）"""
    result = await detect_chat_content_service(
        db, data.content, model_id=data.model_id, tenant_id=ctx.tenant_id
    )
    return ApiResponse.success(data=result)


@audit_router.post("/chat-messages/{message_id}/detect", summary="AI 检测单条消息")
async def detect_chat_message_endpoint(
    message_id: int,
    data: ChatMessageDetectRequest = ChatMessageDetectRequest(),
    db: Session = Depends(get_db),
    ctx: RequestContext = require_permission("audit:chat_detect")
):
    """对指定消息进行 AI 风险检测并持久化结果"""
    result = await detect_message_service(
        db, message_id, model_id=data.model_id, tenant_id=ctx.tenant_id
    )
    return ApiResponse.success(data=result)


@audit_router.post("/chat/detect-batch", summary="批量 AI 检测近期消息")
async def detect_chat_batch_endpoint(
    data: ChatDetectBatchRequest = ChatDetectBatchRequest(),
    db: Session = Depends(get_db),
    ctx: RequestContext = require_permission("audit:chat_detect")
):
    """批量检测近期未 AI 检测的文本消息"""
    result = await detect_recent_messages_service(
        db, limit=data.limit, model_id=data.model_id, only_unchecked=True
    )
    return ApiResponse.success(data=result)


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


# ==================== 聊天消息审计 ====================

@audit_router.get("/messages", summary="聊天消息审计列表")
def list_message_audits(
    risk_level: str = None,
    risk_category: str = None,
    audit_status: str = None,
    keyword: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """获取聊天消息审计列表"""
    result = get_message_audit_list(
        db, ctx, risk_level=risk_level, risk_category=risk_category,
        audit_status=audit_status, keyword=keyword, page=page, page_size=page_size
    )
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )
    return PaginatedResponse.success(data=paginated)


@audit_router.get("/messages/{message_id}", summary="消息审计详情")
def get_message_audit(
    message_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """获取单条消息审计详情"""
    result = get_message_audit_detail(db, ctx, message_id)
    return ApiResponse.success(data=result)


@audit_router.get("/messages/{message_id}/context", summary="消息上下文")
def get_message_audit_context(
    message_id: int,
    limit: int = 5,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """查看消息上下文（前后各N条）"""
    result = get_message_context(db, ctx, message_id, limit=limit)
    return ApiResponse.success(data=result)


@audit_router.post("/messages/{message_id}/review", summary="人工复核消息")
def review_message_audit(
    message_id: int,
    data: MessageReviewRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """人工复核消息审计结果"""
    result = review_message(
        db, ctx, message_id,
        audit_status=data.audit_status,
        risk_level=data.risk_level,
        risk_tags=data.risk_tags
    )
    return ApiResponse.success(data=result)


@audit_router.post("/messages/{message_id}/alert", summary="手动触发告警")
def trigger_message_audit_alert(
    message_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """对指定消息手动触发告警"""
    result = trigger_message_alert(db, ctx, message_id)
    return ApiResponse.success(data=result)


# ==================== 敏感词库 ====================

@audit_router.get("/sensitive-words", summary="敏感词列表")
def list_sensitive_words(
    scope: str = None,
    category: str = None,
    risk_level: str = None,
    enabled: bool = None,
    keyword: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """获取敏感词库列表"""
    result = get_sensitive_words_service(
        db, ctx, scope=scope, category=category, risk_level=risk_level,
        enabled=enabled, keyword=keyword, page=page, page_size=page_size
    )
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )
    return PaginatedResponse.success(data=paginated)


@audit_router.post("/sensitive-words", summary="新增敏感词")
def create_sensitive_word_endpoint(
    data: SensitiveWordCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """新增自定义敏感词"""
    result = create_sensitive_word_service(db, ctx, data.model_dump())
    return ApiResponse.success(data=result)


@audit_router.post("/sensitive-words/batch", summary="批量导入敏感词")
def batch_import_sensitive_words_endpoint(
    data: SensitiveWordBatchImport,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """批量导入敏感词"""
    result = batch_import_sensitive_words(
        db, ctx, data.words, category=data.category,
        risk_level=data.risk_level, scope=data.scope
    )
    return ApiResponse.success(data=result)


@audit_router.put("/sensitive-words/{word_id}", summary="编辑敏感词")
def update_sensitive_word_endpoint(
    word_id: int,
    data: SensitiveWordUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """编辑敏感词"""
    result = update_sensitive_word_service(db, ctx, word_id, data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@audit_router.delete("/sensitive-words/{word_id}", summary="删除敏感词")
def delete_sensitive_word_endpoint(
    word_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """删除敏感词"""
    result = delete_sensitive_word_service(db, ctx, word_id)
    return ApiResponse.success(data=result)


# ==================== 告警管理 ====================

@audit_router.get("/alerts", summary="告警记录列表")
def list_alerts(
    status: str = None,
    alert_type: str = None,
    risk_level: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """获取告警记录列表"""
    result = get_alert_records_service(
        db, ctx, status=status, alert_type=alert_type,
        risk_level=risk_level, page=page, page_size=page_size
    )
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"],
        total_pages=result["total_pages"]
    )
    return PaginatedResponse.success(data=paginated)


@audit_router.post("/alerts/{alert_id}/resolve", summary="处理告警")
def resolve_alert_endpoint(
    alert_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """将告警标记为已处理"""
    result = resolve_alert_service(db, ctx, alert_id)
    return ApiResponse.success(data=result)


@audit_router.get("/alert-rules", summary="告警规则列表")
def list_alert_rules(
    alert_type: str = None,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """获取告警规则配置"""
    result = get_alert_rules_service(db, ctx, alert_type=alert_type)
    return ApiResponse.success(data=result)


@audit_router.put("/alert-rules/{rule_id}", summary="更新告警规则")
def update_alert_rule_endpoint(
    rule_id: int,
    data: AlertRuleUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """更新告警规则（开关、通知渠道）"""
    result = update_alert_rule_service(db, ctx, rule_id, data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


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
