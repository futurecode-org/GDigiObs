"""数据清洗数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict
from datetime import datetime

from model.clean import CleanRule, CleanLog


def get_clean_rules(db: Session, tenant_id: int, page: int = 1, page_size: int = 20) -> List[CleanRule]:
    """获取清洗规则列表"""
    return db.query(CleanRule).filter(
        CleanRule.tenant_id == tenant_id
    ).order_by(desc(CleanRule.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def get_clean_rule_by_id(db: Session, rule_id: int) -> Optional[CleanRule]:
    """获取清洗规则详情"""
    return db.query(CleanRule).filter(CleanRule.id == rule_id).first()


def create_clean_rule(db: Session, tenant_id: int, name: str, rule_type: str,
                      config: Dict, **kwargs) -> CleanRule:
    """创建清洗规则"""
    rule = CleanRule(
        tenant_id=tenant_id,
        name=name,
        rule_type=rule_type,
        config=config,
        **kwargs
    )
    db.add(rule)
    db.commit()
    return rule


def update_clean_rule(db: Session, rule_id: int, **kwargs) -> CleanRule:
    """更新清洗规则"""
    rule = get_clean_rule_by_id(db, rule_id)
    if not rule:
        return None
    
    for key, value in kwargs.items():
        if hasattr(rule, key):
            setattr(rule, key, value)
    
    db.commit()
    return rule


def delete_clean_rule(db: Session, rule_id: int) -> bool:
    """删除清洗规则"""
    rule = get_clean_rule_by_id(db, rule_id)
    if not rule:
        return False
    
    db.delete(rule)
    db.commit()
    return True


def get_clean_logs(db: Session, tenant_id: int, rule_id: int = None,
                   page: int = 1, page_size: int = 50) -> List[CleanLog]:
    """获取清洗日志"""
    query = db.query(CleanLog).filter(CleanLog.tenant_id == tenant_id)
    
    if rule_id:
        query = query.filter(CleanLog.rule_id == rule_id)
    
    return query.order_by(desc(CleanLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def create_clean_log(db: Session, tenant_id: int, rule_id: int, task_id: int = None,
                     total: int = 0, success: int = 0, failed: int = 0,
                     status: str = "success") -> CleanLog:
    """创建清洗日志"""
    log = CleanLog(
        tenant_id=tenant_id,
        rule_id=rule_id,
        task_id=task_id,
        executed_at=datetime.now(),
        total=total,
        success=success,
        failed=failed,
        status=status
    )
    db.add(log)
    db.commit()
    return log