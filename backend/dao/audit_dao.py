"""审计日志数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime

from model.log import OperationLog, AuditLog, AskRecord, AskSqlLog


# 操作日志
def get_operation_logs(db: Session, tenant_id: int, module: str = None,
                       action: str = None, user_id: int = None,
                       page: int = 1, page_size: int = 50) -> List[OperationLog]:
    """获取操作日志列表"""
    query = db.query(OperationLog).filter(OperationLog.tenant_id == tenant_id)
    
    if module:
        query = query.filter(OperationLog.module == module)
    
    if action:
        query = query.filter(OperationLog.action == action)
    
    if user_id:
        query = query.filter(OperationLog.user_id == user_id)
    
    return query.order_by(desc(OperationLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_operation_logs(db: Session, tenant_id: int) -> int:
    """统计操作日志数量"""
    return db.query(OperationLog).filter(OperationLog.tenant_id == tenant_id).count()


def create_operation_log(db: Session, tenant_id: int, user_id: int,
                         module: str, action: str, **kwargs) -> OperationLog:
    """创建操作日志"""
    log = OperationLog(
        tenant_id=tenant_id,
        user_id=user_id,
        module=module,
        action=action,
        **kwargs
    )
    db.add(log)
    db.commit()
    return log


# 审计日志
def get_audit_logs(db: Session, tenant_id: int, audit_type: str = None,
                   risk_level: str = None, page: int = 1, page_size: int = 50) -> List[AuditLog]:
    """获取审计日志列表"""
    query = db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id)
    
    if audit_type:
        query = query.filter(AuditLog.audit_type == audit_type)
    
    if risk_level:
        query = query.filter(AuditLog.risk_level == risk_level)
    
    return query.order_by(desc(AuditLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_audit_logs(db: Session, tenant_id: int) -> int:
    """统计审计日志数量"""
    return db.query(AuditLog).filter(AuditLog.tenant_id == tenant_id).count()


def create_audit_log(db: Session, tenant_id: int, audit_type: str,
                     user_id: int = None, **kwargs) -> AuditLog:
    """创建审计日志"""
    log = AuditLog(
        tenant_id=tenant_id,
        audit_type=audit_type,
        user_id=user_id,
        **kwargs
    )
    db.add(log)
    db.commit()
    return log


# 智能问数记录
def get_ask_records(db: Session, tenant_id: int, user_id: int = None,
                    page: int = 1, page_size: int = 20) -> List[AskRecord]:
    """获取问数记录列表"""
    query = db.query(AskRecord).filter(AskRecord.tenant_id == tenant_id)
    
    if user_id:
        query = query.filter(AskRecord.user_id == user_id)
    
    return query.order_by(desc(AskRecord.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_ask_records(db: Session, tenant_id: int) -> int:
    """统计问数记录数量"""
    return db.query(AskRecord).filter(AskRecord.tenant_id == tenant_id).count()


def create_ask_record(db: Session, tenant_id: int, user_id: int, question: str, **kwargs) -> AskRecord:
    """创建问数记录"""
    record = AskRecord(
        tenant_id=tenant_id,
        user_id=user_id,
        question=question,
        **kwargs
    )
    db.add(record)
    db.commit()
    return record


def update_ask_record(db: Session, record_id: int, **kwargs) -> AskRecord:
    """更新问数记录"""
    record = db.query(AskRecord).filter(AskRecord.id == record_id).first()
    if not record:
        return None
    
    for key, value in kwargs.items():
        if hasattr(record, key):
            setattr(record, key, value)
    
    db.commit()
    return record


def get_ask_record_by_id(db: Session, record_id: int) -> Optional[AskRecord]:
    """获取问数记录详情"""
    return db.query(AskRecord).filter(AskRecord.id == record_id).first()


# 问数SQL日志
def create_ask_sql_log(db: Session, tenant_id: int, ask_record_id: int,
                       user_id: int, sql: str, **kwargs) -> AskSqlLog:
    """创建问数SQL日志"""
    log = AskSqlLog(
        tenant_id=tenant_id,
        ask_record_id=ask_record_id,
        user_id=user_id,
        sql=sql,
        **kwargs
    )
    db.add(log)
    db.commit()
    return log


def update_ask_sql_log(db: Session, log_id: int, **kwargs) -> AskSqlLog:
    """更新问数SQL日志"""
    log = db.query(AskSqlLog).filter(AskSqlLog.id == log_id).first()
    if not log:
        return None
    
    for key, value in kwargs.items():
        if hasattr(log, key):
            setattr(log, key, value)
    
    db.commit()
    return log