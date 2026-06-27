"""审计日志业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from dao.audit_dao import (
    get_operation_logs, count_operation_logs, create_operation_log,
    get_audit_logs, count_audit_logs, create_audit_log,
    get_ask_records, count_ask_records, create_ask_record,
    update_ask_record, get_ask_record_by_id, create_ask_sql_log,
    update_ask_sql_log
)
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext
from core.sql_validator import validate_sql, SqlValidationResult

logger = logging.getLogger(__name__)


# 操作日志
def get_operation_logs_service(db: Session, ctx: RequestContext, module: str = None,
                               action: str = None, page: int = 1, page_size: int = 50) -> Dict:
    """获取操作日志列表"""
    if not ctx.is_super_admin:
        raise ForbiddenException("只有管理员可以查看操作日志")
    
    logs = get_operation_logs(db, ctx.tenant_id, module, action, None, page, page_size)
    total = count_operation_logs(db, ctx.tenant_id)
    
    log_list = []
    for log in logs:
        log_list.append({
            "id": log.id,
            "module": log.module,
            "action": log.action,
            "object_type": log.object_type,
            "object_id": log.object_id,
            "status": log.status,
            "created_at": log.created_at
        })
    
    return {
        "items": log_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def log_operation_service(db: Session, tenant_id: int, user_id: int,
                          module: str, action: str, **kwargs):
    """记录操作日志"""
    create_operation_log(db, tenant_id, user_id, module, action, **kwargs)


# 审计日志
def get_audit_logs_service(db: Session, ctx: RequestContext, audit_type: str = None,
                           risk_level: str = None, page: int = 1, page_size: int = 50) -> Dict:
    """获取审计日志列表"""
    if not ctx.is_super_admin:
        raise ForbiddenException("只有管理员可以查看审计日志")
    
    logs = get_audit_logs(db, ctx.tenant_id, audit_type, risk_level, page, page_size)
    total = count_audit_logs(db, ctx.tenant_id)
    
    log_list = []
    for log in logs:
        log_list.append({
            "id": log.id,
            "audit_type": log.audit_type,
            "risk_level": log.risk_level,
            "risk_tags": log.risk_tags,
            "content_summary": log.content_summary,
            "created_at": log.created_at
        })
    
    return {
        "items": log_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def create_audit_log_service(db: Session, tenant_id: int, audit_type: str,
                             user_id: int = None, **kwargs):
    """创建审计日志"""
    create_audit_log(db, tenant_id, audit_type, user_id, **kwargs)


# 智能问数
def get_ask_records_service(db: Session, ctx: RequestContext, page: int = 1,
                            page_size: int = 20) -> Dict:
    """获取问数记录列表"""
    records = get_ask_records(db, ctx.tenant_id, ctx.user_id, page, page_size)
    total = count_ask_records(db, ctx.tenant_id)
    
    record_list = []
    for record in records:
        record_list.append({
            "id": record.id,
            "question": record.question,
            "answer": record.answer,
            "data_source": record.data_source,
            "chart_type": record.chart_type,
            "is_saved": record.is_saved,
            "created_at": record.created_at
        })
    
    return {
        "items": record_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_ask_record_detail_service(db: Session, ctx: RequestContext, record_id: int) -> Dict:
    """获取问数记录详情"""
    record = get_ask_record_by_id(db, record_id)
    if not record:
        raise NotFoundException("问数记录不存在")
    
    if not ctx.is_super_admin and record.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此问数记录")
    
    return {
        "id": record.id,
        "question": record.question,
        "answer": record.answer,
        "data_source": record.data_source,
        "chart_type": record.chart_type,
        "chart_config": record.chart_config,
        "result_data": record.result_data,
        "is_saved": record.is_saved,
        "created_at": record.created_at
    }


def create_ask_record_service(db: Session, ctx: RequestContext, question: str, **kwargs) -> Dict:
    """创建问数记录"""
    record = create_ask_record(db, ctx.tenant_id, ctx.user_id, question, **kwargs)
    
    logger.info(f"创建问数记录: record_id={record.id}")
    
    return {
        "id": record.id,
        "question": record.question,
        "created_at": record.created_at
    }


def update_ask_record_service(db: Session, ctx: RequestContext, record_id: int, **kwargs) -> Dict:
    """更新问数记录"""
    record = get_ask_record_by_id(db, record_id)
    if not record:
        raise NotFoundException("问数记录不存在")
    
    if record.user_id != ctx.user_id:
        raise ForbiddenException("无权修改此问数记录")
    
    record = update_ask_record(db, record_id, **kwargs)
    
    return {
        "id": record.id,
        "updated_at": record.updated_at
    }


def save_ask_record_service(db: Session, ctx: RequestContext, record_id: int):
    """收藏/取消收藏问数记录"""
    record = get_ask_record_by_id(db, record_id)
    if not record:
        raise NotFoundException("问数记录不存在")
    
    if record.user_id != ctx.user_id:
        raise ForbiddenException("无权操作此问数记录")
    
    record.is_saved = not record.is_saved
    db.commit()
    
    return {"is_saved": record.is_saved}


# SQL安全校验
def validate_sql_query_service(db: Session, ctx: RequestContext, sql: str, **kwargs) -> Dict:
    """校验SQL查询语句的安全性"""
    data_scope = {
        "scope_type": kwargs.get("data_scope_type"),
        "department_ids": kwargs.get("department_ids"),
        "user_id": ctx.user_id
    }
    
    result = validate_sql(sql, ctx.tenant_id, data_scope)
    
    if not result.is_valid:
        create_audit_log_service(
            db, ctx.tenant_id, "sql", ctx.user_id,
            risk_level="high",
            risk_tags=result.detected_threats,
            content_summary=f"SQL校验失败: {result.error_message}"
        )
        raise BadRequestException(result.error_message)
    
    create_ask_sql_log(db, ctx.tenant_id, ctx.user_id, sql, result.sanitized_sql, "validated")
    
    return {
        "is_valid": result.is_valid,
        "sanitized_sql": result.sanitized_sql,
        "detected_threats": result.detected_threats,
        "tables": result.extract_tables(sql)
    }


def execute_sql_query_service(db: Session, ctx: RequestContext, sql: str, **kwargs) -> Dict:
    """执行SQL查询并记录日志"""
    data_scope = {
        "scope_type": kwargs.get("data_scope_type"),
        "department_ids": kwargs.get("department_ids"),
        "user_id": ctx.user_id
    }
    
    validation_result = validate_sql(sql, ctx.tenant_id, data_scope)
    
    if not validation_result.is_valid:
        create_audit_log_service(
            db, ctx.tenant_id, "sql", ctx.user_id,
            risk_level="high",
            risk_tags=validation_result.detected_threats,
            content_summary=f"SQL执行失败(校验不通过): {validation_result.error_message}"
        )
        raise BadRequestException(validation_result.error_message)
    
    try:
        result = db.execute(validation_result.sanitized_sql)
        rows = result.fetchall()
        columns = result.keys()
        
        data = []
        for row in rows:
            data.append(dict(zip(columns, row)))
        
        create_ask_sql_log(db, ctx.tenant_id, ctx.user_id, sql, validation_result.sanitized_sql, "executed",
                          execution_time=0, row_count=len(data))
        
        create_audit_log_service(
            db, ctx.tenant_id, "sql", ctx.user_id,
            risk_level="low",
            content_summary=f"SQL执行成功，返回{len(data)}行数据"
        )
        
        return {
            "data": data,
            "row_count": len(data),
            "sanitized_sql": validation_result.sanitized_sql
        }
    
    except Exception as e:
        create_ask_sql_log(db, ctx.tenant_id, ctx.user_id, sql, validation_result.sanitized_sql, "failed",
                          error_message=str(e))
        
        create_audit_log_service(
            db, ctx.tenant_id, "sql", ctx.user_id,
            risk_level="medium",
            content_summary=f"SQL执行失败: {str(e)}"
        )
        
        raise BadRequestException(f"SQL执行失败: {str(e)}")