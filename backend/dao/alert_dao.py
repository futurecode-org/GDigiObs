"""审计风控数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime

from model.alert import SensitiveWord, AlertRecord, AlertRule


# ========== 敏感词 ==========

def get_sensitive_words(db: Session, tenant_id: Optional[int] = None,
                        scope: str = None, category: str = None,
                        risk_level: str = None, enabled: bool = None,
                        keyword: str = None, page: int = 1, page_size: int = 50) -> List[SensitiveWord]:
    """获取敏感词列表"""
    query = db.query(SensitiveWord)

    if scope == "platform":
        query = query.filter(SensitiveWord.tenant_id.is_(None))
    elif scope == "tenant":
        if tenant_id is not None:
            query = query.filter(SensitiveWord.tenant_id == tenant_id)
        else:
            query = query.filter(SensitiveWord.tenant_id.isnot(None))
    elif tenant_id is not None:
        # 查看指定租户时包含平台级和该租户级
        query = query.filter(or_(SensitiveWord.tenant_id.is_(None), SensitiveWord.tenant_id == tenant_id))

    if category:
        query = query.filter(SensitiveWord.category == category)
    if risk_level:
        query = query.filter(SensitiveWord.risk_level == risk_level)
    if enabled is not None:
        query = query.filter(SensitiveWord.is_enabled == enabled)
    if keyword:
        query = query.filter(SensitiveWord.word.like(f"%{keyword}%"))

    return query.order_by(desc(SensitiveWord.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_sensitive_words(db: Session, tenant_id: Optional[int] = None,
                          scope: str = None, category: str = None,
                          risk_level: str = None, enabled: bool = None,
                          keyword: str = None) -> int:
    """统计敏感词数量"""
    query = db.query(SensitiveWord)

    if scope == "platform":
        query = query.filter(SensitiveWord.tenant_id.is_(None))
    elif scope == "tenant":
        if tenant_id is not None:
            query = query.filter(SensitiveWord.tenant_id == tenant_id)
        else:
            query = query.filter(SensitiveWord.tenant_id.isnot(None))
    elif tenant_id is not None:
        query = query.filter(or_(SensitiveWord.tenant_id.is_(None), SensitiveWord.tenant_id == tenant_id))

    if category:
        query = query.filter(SensitiveWord.category == category)
    if risk_level:
        query = query.filter(SensitiveWord.risk_level == risk_level)
    if enabled is not None:
        query = query.filter(SensitiveWord.is_enabled == enabled)
    if keyword:
        query = query.filter(SensitiveWord.word.like(f"%{keyword}%"))

    return query.count()


def get_sensitive_word_by_id(db: Session, word_id: int) -> Optional[SensitiveWord]:
    """根据ID获取敏感词"""
    return db.query(SensitiveWord).filter(SensitiveWord.id == word_id).first()


def get_enabled_sensitive_words(db: Session, tenant_id: Optional[int] = None) -> List[SensitiveWord]:
    """获取生效中的敏感词（平台级 + 指定租户级）"""
    query = db.query(SensitiveWord).filter(SensitiveWord.is_enabled == True)
    if tenant_id is not None:
        query = query.filter(or_(SensitiveWord.tenant_id.is_(None), SensitiveWord.tenant_id == tenant_id))
    return query.all()


def create_sensitive_word(db: Session, tenant_id: Optional[int], word: str, category: str,
                          risk_level: str, is_enabled: bool = True, is_regex: bool = False,
                          created_by: int = None) -> SensitiveWord:
    """创建敏感词"""
    sw = SensitiveWord(
        tenant_id=tenant_id,
        word=word,
        category=category,
        risk_level=risk_level,
        is_enabled=is_enabled,
        is_regex=is_regex,
        created_by=created_by
    )
    db.add(sw)
    db.commit()
    db.refresh(sw)
    return sw


def update_sensitive_word(db: Session, word_id: int, **kwargs) -> Optional[SensitiveWord]:
    """更新敏感词"""
    sw = get_sensitive_word_by_id(db, word_id)
    if not sw:
        return None
    for key, value in kwargs.items():
        if hasattr(sw, key):
            setattr(sw, key, value)
    sw.updated_at = datetime.now()
    db.commit()
    db.refresh(sw)
    return sw


def delete_sensitive_word(db: Session, word_id: int) -> bool:
    """删除敏感词"""
    sw = get_sensitive_word_by_id(db, word_id)
    if not sw:
        return False
    db.delete(sw)
    db.commit()
    return True


# ========== 告警记录 ==========

def get_alert_records(db: Session, tenant_id: Optional[int] = None,
                      alert_type: str = None, status: str = None,
                      risk_level: str = None, page: int = 1, page_size: int = 50) -> List[AlertRecord]:
    """获取告警记录列表"""
    query = db.query(AlertRecord)
    if tenant_id is not None:
        query = query.filter(AlertRecord.tenant_id == tenant_id)
    if alert_type:
        query = query.filter(AlertRecord.alert_type == alert_type)
    if status:
        query = query.filter(AlertRecord.status == status)
    if risk_level:
        query = query.filter(AlertRecord.risk_level == risk_level)

    return query.order_by(desc(AlertRecord.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_alert_records(db: Session, tenant_id: Optional[int] = None,
                        alert_type: str = None, status: str = None,
                        risk_level: str = None) -> int:
    """统计告警记录数量"""
    query = db.query(AlertRecord)
    if tenant_id is not None:
        query = query.filter(AlertRecord.tenant_id == tenant_id)
    if alert_type:
        query = query.filter(AlertRecord.alert_type == alert_type)
    if status:
        query = query.filter(AlertRecord.status == status)
    if risk_level:
        query = query.filter(AlertRecord.risk_level == risk_level)
    return query.count()


def get_alert_record_by_id(db: Session, alert_id: int) -> Optional[AlertRecord]:
    """根据ID获取告警记录"""
    return db.query(AlertRecord).filter(AlertRecord.id == alert_id).first()


def create_alert_record(db: Session, tenant_id: int, alert_type: str, title: str,
                        content: str = None, source_type: str = None, source_id: int = None,
                        risk_level: str = None, notified_channels: dict = None) -> AlertRecord:
    """创建告警记录"""
    alert = AlertRecord(
        tenant_id=tenant_id,
        alert_type=alert_type,
        source_type=source_type,
        source_id=source_id,
        title=title,
        content=content,
        risk_level=risk_level,
        notified_channels=notified_channels or {}
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


def resolve_alert_record(db: Session, alert_id: int, resolved_by: int) -> Optional[AlertRecord]:
    """标记告警为已处理"""
    alert = get_alert_record_by_id(db, alert_id)
    if not alert:
        return None
    alert.status = "resolved"
    alert.resolved_by = resolved_by
    alert.resolved_at = datetime.now()
    alert.updated_at = datetime.now()
    db.commit()
    db.refresh(alert)
    return alert


# ========== 告警规则 ==========

def get_alert_rules(db: Session, tenant_id: Optional[int] = None,
                    alert_type: str = None, enabled: bool = None) -> List[AlertRule]:
    """获取告警规则列表"""
    query = db.query(AlertRule)
    if tenant_id is not None:
        query = query.filter(or_(AlertRule.tenant_id.is_(None), AlertRule.tenant_id == tenant_id))
    if alert_type:
        query = query.filter(AlertRule.alert_type == alert_type)
    if enabled is not None:
        query = query.filter(AlertRule.enabled == enabled)
    return query.order_by(desc(AlertRule.created_at)).all()


def get_alert_rule_by_id(db: Session, rule_id: int) -> Optional[AlertRule]:
    """根据ID获取告警规则"""
    return db.query(AlertRule).filter(AlertRule.id == rule_id).first()


def create_alert_rule(db: Session, tenant_id: Optional[int], rule_name: str, alert_type: str,
                      trigger_condition: dict = None, channels: dict = None,
                      enabled: bool = True, created_by: int = None) -> AlertRule:
    """创建告警规则"""
    rule = AlertRule(
        tenant_id=tenant_id,
        rule_name=rule_name,
        alert_type=alert_type,
        trigger_condition=trigger_condition or {},
        channels=channels or {},
        enabled=enabled,
        created_by=created_by
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


def update_alert_rule(db: Session, rule_id: int, **kwargs) -> Optional[AlertRule]:
    """更新告警规则"""
    rule = get_alert_rule_by_id(db, rule_id)
    if not rule:
        return None
    for key, value in kwargs.items():
        if hasattr(rule, key):
            setattr(rule, key, value)
    rule.updated_at = datetime.now()
    db.commit()
    db.refresh(rule)
    return rule


def delete_alert_rule(db: Session, rule_id: int) -> bool:
    """删除告警规则"""
    rule = get_alert_rule_by_id(db, rule_id)
    if not rule:
        return False
    db.delete(rule)
    db.commit()
    return True
