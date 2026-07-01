"""审计风控业务逻辑层"""
import logging
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from dao.alert_dao import (
    get_enabled_sensitive_words, create_alert_record, resolve_alert_record,
    get_alert_records, count_alert_records, get_alert_record_by_id,
    get_alert_rules, get_alert_rule_by_id, update_alert_rule,
    create_sensitive_word, get_sensitive_words, count_sensitive_words,
    get_sensitive_word_by_id, update_sensitive_word, delete_sensitive_word
)
from dao.user_dao import get_user_by_id, get_users
from dao.conversation_dao import get_conversation_by_id
from model.conversation import Message
from model.user import User
from model.alert import SensitiveWord, AlertRecord, AlertRule
from service.audit_service import create_audit_log_service
from service.notification_service import send_notification_service
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


# 风险类别与中文显示名
RISK_CATEGORY_LABELS = {
    "political": "涉政",
    "porn": "涉黄",
    "insult": "辱骂",
    "violence": "暴恐",
    "ad": "广告",
    "privacy": "隐私泄露",
    "secret": "商业机密",
    "illegal": "违法违规",
    "custom": "自定义敏感词",
}

# 默认静态兜底敏感词（未配置数据库敏感词时仍具备基础过滤能力）
DEFAULT_STATIC_WORDS = {
    "political": ["习近平", "胡锦涛", "江泽民", "毛泽东", "邓小平", "党中央", "国务院", "中央军委", "中南海", "天安门"],
    "porn": ["色情", "裸体", "性爱", "性交", "手淫", "嫖娼", "卖淫", "AV", "三级片", "露点", "艳照"],
    "violence": ["杀人", "自杀", "爆炸", "恐怖", "袭击", "枪支", "弹药", "毒品", "贩毒", "吸毒"],
    "insult": ["傻逼", "草泥马", "操你妈", "去死", "滚", "垃圾", "脑残"],
    "ad": ["广告", "推广", "促销", "优惠", "打折", "免费", "加盟", "代理", "微商"],
    "illegal": ["违法", "犯罪", "法院", "警察", "逮捕", "判刑", "通缉", "逃犯"],
}

DEFAULT_CATEGORY_RISK = {
    "political": "high",
    "porn": "high",
    "violence": "high",
    "insult": "medium",
    "ad": "low",
    "privacy": "medium",
    "secret": "medium",
    "illegal": "high",
    "custom": "medium",
}

RISK_PRIORITY = {"none": 0, "low": 1, "medium": 2, "high": 3}


class AuditContentResult:
    """内容审计结果"""
    def __init__(self):
        self.is_passed = True
        self.risk_level = "none"
        self.risk_tags: List[str] = []
        self.detected_categories: List[str] = []
        self.matched_words: Dict[str, List[str]] = {}
        self.action = "allow"
        self.reason = ""
        self.content_summary = ""

    def to_dict(self) -> Dict:
        return {
            "is_passed": self.is_passed,
            "risk_level": self.risk_level,
            "risk_tags": self.risk_tags,
            "detected_categories": self.detected_categories,
            "matched_words": self.matched_words,
            "action": self.action,
            "reason": self.reason,
            "content_summary": self.content_summary,
        }


def _compile_pattern(word: SensitiveWord):
    """编译敏感词匹配模式"""
    if word.is_regex:
        try:
            return re.compile(word.word, re.IGNORECASE)
        except re.error:
            return re.compile(re.escape(word.word), re.IGNORECASE)
    return re.compile(re.escape(word.word), re.IGNORECASE)


def _match_static_words(content: str) -> Dict[str, List[str]]:
    """匹配默认静态敏感词"""
    result: Dict[str, List[str]] = {}
    for category, words in DEFAULT_STATIC_WORDS.items():
        pattern = re.compile("|".join(re.escape(w) for w in words), re.IGNORECASE)
        matches = pattern.findall(content)
        if matches:
            result[category] = list(set(matches))
    return result


def _match_db_words(db: Session, content: str, tenant_id: int = None) -> Dict[str, List[str]]:
    """匹配数据库中的敏感词，按类别聚合"""
    words = get_enabled_sensitive_words(db, tenant_id)
    result: Dict[str, List[str]] = {}
    for word in words:
        pattern = _compile_pattern(word)
        matches = pattern.findall(content)
        if matches:
            result.setdefault(word.category, [])
            result[word.category].extend(matches)
    return result


def audit_message_content(db: Session, content: str, tenant_id: int = None) -> AuditContentResult:
    """审计消息内容，返回风险等级与建议动作"""
    result = AuditContentResult()

    if not content or not content.strip():
        result.content_summary = "空消息"
        return result

    content = content.strip()
    if len(content) > 5000:
        result.is_passed = False
        result.risk_level = "high"
        result.risk_tags = ["content_too_long"]
        result.action = "block"
        result.reason = "消息内容超过长度限制"
        result.content_summary = content[:200]
        return result

    # 合并数据库敏感词与静态兜底敏感词
    db_matches = _match_db_words(db, content, tenant_id)
    static_matches = _match_static_words(content)

    all_categories = set(db_matches.keys()) | set(static_matches.keys())
    if not all_categories:
        result.is_passed = True
        result.risk_level = "none"
        result.action = "allow"
        result.content_summary = content[:200]
        return result

    # 汇总每个类别的命中词
    matched_words: Dict[str, List[str]] = {}
    for category in all_categories:
        words = list(set(db_matches.get(category, []) + static_matches.get(category, [])))
        if words:
            matched_words[category] = words

    # 根据类别确定风险等级（数据库中的 risk_level 优先级高于默认映射）
    max_risk = "low"
    detected_categories = []
    for category in matched_words.keys():
        detected_categories.append(category)
        # 查找数据库中该类别启用的敏感词的最高风险等级
        category_words = [w for w in get_enabled_sensitive_words(db, tenant_id) if w.category == category]
        if category_words:
            category_risk = max(category_words, key=lambda w: RISK_PRIORITY.get(w.risk_level, 0)).risk_level
        else:
            category_risk = DEFAULT_CATEGORY_RISK.get(category, "medium")
        if RISK_PRIORITY.get(category_risk, 0) > RISK_PRIORITY.get(max_risk, 0):
            max_risk = category_risk

    result.is_passed = False
    result.risk_level = max_risk
    result.detected_categories = detected_categories
    result.matched_words = matched_words
    result.risk_tags = [f"sensitive_{c}" for c in detected_categories]
    result.content_summary = content[:200]

    if max_risk == "high":
        result.action = "block"
        result.reason = f"检测到高风险内容: {', '.join(RISK_CATEGORY_LABELS.get(c, c) for c in detected_categories)}"
    elif max_risk == "medium":
        result.action = "review"
        result.reason = f"检测到中等风险内容: {', '.join(RISK_CATEGORY_LABELS.get(c, c) for c in detected_categories)}"
    else:
        result.action = "allow"
        result.reason = f"检测到低风险内容: {', '.join(RISK_CATEGORY_LABELS.get(c, c) for c in detected_categories)}"

    return result


def create_message_audit_log(db: Session, tenant_id: int, message: Message, audit_result: AuditContentResult):
    """为消息创建审计日志"""
    create_audit_log_service(
        db, tenant_id, "message", message.sender_id,
        risk_level=audit_result.risk_level,
        risk_tags=audit_result.risk_tags,
        content_summary=audit_result.content_summary,
        object_type="message",
        object_id=message.id,
        result=audit_result.to_dict()
    )


def _get_admin_user_ids(db: Session, tenant_id: int = None) -> List[int]:
    """获取需要接收告警的管理员用户ID（简化：租户内所有用户 + 平台管理员）"""
    from dao.rbac_dao import get_user_roles
    from model.role import Role

    users = get_users(db, tenant_id=tenant_id, page_size=1000)
    admin_ids = []
    for u in users:
        roles = get_user_roles(db, u.id)
        if any(r.code in ("super_admin", "tenant_admin", "admin") for r in roles):
            admin_ids.append(u.id)
    return admin_ids


def create_message_alert(db: Session, ctx: RequestContext, message: Message, audit_result: AuditContentResult):
    """为高风险消息创建告警并通知管理员"""
    if not ctx:
        return None

    # 查询匹配的告警规则
    rules = get_alert_rules(db, tenant_id=ctx.tenant_id, alert_type="message_high_risk", enabled=True)
    if not rules:
        # 未配置规则时仍创建告警记录，但只发站内通知
        channels = {"in_app": True}
    else:
        channels = {}
        for rule in rules:
            channels.update(rule.channels or {})

    title = f"聊天消息命中高风险: {RISK_CATEGORY_LABELS.get(audit_result.detected_categories[0], '敏感内容')}" if audit_result.detected_categories else "聊天消息命中高风险"
    content = f"发送者: {message.sender_id}, 会话: {message.conversation_id}, 摘要: {audit_result.content_summary}"

    alert = create_alert_record(
        db, ctx.tenant_id or 0, "message_high_risk",
        title=title, content=content,
        source_type="message", source_id=message.id,
        risk_level=audit_result.risk_level,
        notified_channels=channels
    )

    # 发送站内通知给管理员
    if channels.get("in_app"):
        admin_ids = _get_admin_user_ids(db, ctx.tenant_id)
        for admin_id in admin_ids:
            send_notification_service(
                db, ctx.tenant_id or 0, admin_id,
                "audit_alert", title, content,
                {"alert_id": alert.id, "message_id": message.id, "risk_level": audit_result.risk_level},
                channel="in_app"
            )

    logger.info(f"生成聊天消息告警: alert_id={alert.id}, message_id={message.id}")
    return alert


def get_message_audit_list(db: Session, ctx: RequestContext,
                           risk_level: str = None, risk_category: str = None,
                           audit_status: str = None, keyword: str = None,
                           page: int = 1, page_size: int = 20) -> Dict:
    """获取消息审计列表"""
    from sqlalchemy import desc, or_

    query = db.query(Message)
    if not ctx.is_super_admin:
        query = query.filter(Message.tenant_id == ctx.tenant_id)

    if risk_level:
        query = query.filter(Message.risk_level == risk_level)
    if risk_category:
        query = query.filter(Message.risk_tags.contains([f"sensitive_{risk_category}"]))
    if audit_status:
        query = query.filter(Message.audit_status == audit_status)
    if keyword:
        query = query.filter(or_(
            Message.content.like(f"%{keyword}%"),
            Message.risk_tags.contains([keyword])
        ))

    total = query.count()
    messages = query.order_by(desc(Message.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    items = []
    for msg in messages:
        sender = get_user_by_id(db, msg.sender_id)
        conversation = get_conversation_by_id(db, msg.conversation_id)
        items.append({
            "id": msg.id,
            "tenant_id": msg.tenant_id,
            "conversation_id": msg.conversation_id,
            "conversation_type": conversation.type if conversation else None,
            "sender_id": msg.sender_id,
            "sender_name": sender.nickname or sender.username if sender else "未知用户",
            "message_type": msg.message_type,
            "content": msg.content,
            "audit_status": msg.audit_status,
            "risk_level": msg.risk_level,
            "risk_tags": msg.risk_tags or [],
            "risk_categories": [tag.replace("sensitive_", "") for tag in (msg.risk_tags or []) if tag.startswith("sensitive_")],
            "ai_risk_level": msg.ai_risk_level,
            "ai_risk_tags": msg.ai_risk_tags or [],
            "ai_detected_at": msg.ai_detected_at.isoformat() if msg.ai_detected_at else None,
            "ai_model_id": msg.ai_model_id,
            "ai_reason": msg.ai_reason,
            "created_at": msg.created_at,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


def get_message_audit_detail(db: Session, ctx: RequestContext, message_id: int) -> Dict:
    """获取消息审计详情"""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise NotFoundException("消息不存在")
    if not ctx.is_super_admin and msg.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此消息")

    sender = get_user_by_id(db, msg.sender_id)
    conversation = get_conversation_by_id(db, msg.conversation_id)
    return {
        "id": msg.id,
        "tenant_id": msg.tenant_id,
        "conversation_id": msg.conversation_id,
        "conversation_type": conversation.type if conversation else None,
        "sender_id": msg.sender_id,
        "sender_name": sender.nickname or sender.username if sender else "未知用户",
        "message_type": msg.message_type,
        "content": msg.content,
        "audit_status": msg.audit_status,
        "risk_level": msg.risk_level,
        "risk_tags": msg.risk_tags or [],
        "created_at": msg.created_at,
    }


def get_message_context(db: Session, ctx: RequestContext, message_id: int, limit: int = 5) -> Dict:
    """获取消息上下文"""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise NotFoundException("消息不存在")
    if not ctx.is_super_admin and msg.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此消息")

    # 前 N 条
    before = db.query(Message).filter(
        Message.conversation_id == msg.conversation_id,
        Message.id < message_id
    ).order_by(Message.id.desc()).limit(limit).all()

    # 后 N 条（不包含自身）
    after = db.query(Message).filter(
        Message.conversation_id == msg.conversation_id,
        Message.id > message_id
    ).order_by(Message.id.asc()).limit(limit).all()

    def _serialize(m: Message):
        sender = get_user_by_id(db, m.sender_id)
        return {
            "id": m.id,
            "sender_id": m.sender_id,
            "sender_name": sender.nickname or sender.username if sender else "未知用户",
            "message_type": m.message_type,
            "content": m.content,
            "audit_status": m.audit_status,
            "risk_level": m.risk_level,
            "created_at": m.created_at,
        }

    return {
        "current": _serialize(msg),
        "before": [_serialize(m) for m in reversed(before)],
        "after": [_serialize(m) for m in after],
    }


def review_message(db: Session, ctx: RequestContext, message_id: int, audit_status: str,
                   risk_level: str = None, risk_tags: List[str] = None) -> Dict:
    """人工复核消息"""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise NotFoundException("消息不存在")
    if not ctx.is_super_admin and msg.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权复核此消息")

    if audit_status not in ("passed", "blocked", "reviewing"):
        raise BadRequestException("无效的审计状态")

    msg.audit_status = audit_status
    if risk_level:
        msg.risk_level = risk_level
    if risk_tags is not None:
        msg.risk_tags = risk_tags
    msg.updated_at = datetime.now()
    db.commit()
    db.refresh(msg)

    # 记录操作审计日志
    create_audit_log_service(
        db, ctx.tenant_id or 0, "message", ctx.user_id,
        risk_level=msg.risk_level,
        risk_tags=msg.risk_tags,
        content_summary=f"人工复核消息: {message_id} -> {audit_status}",
        object_type="message", object_id=message_id,
        result={"audit_status": audit_status}
    )

    return {"id": msg.id, "audit_status": msg.audit_status, "risk_level": msg.risk_level}


def trigger_message_alert(db: Session, ctx: RequestContext, message_id: int) -> Dict:
    """手动对消息触发告警"""
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise NotFoundException("消息不存在")
    if not ctx.is_super_admin and msg.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权操作此消息")

    audit_result = audit_message_content(db, msg.content or "", msg.tenant_id)
    alert = create_message_alert(db, ctx, msg, audit_result)
    return {"alert_id": alert.id if alert else None}


def mute_user(db: Session, ctx: RequestContext, user_id: int, duration_minutes: int):
    """全局禁言用户"""
    if not ctx.is_admin:
        raise ForbiddenException("需要管理员权限")
    if duration_minutes <= 0:
        raise BadRequestException("禁言时长必须大于0分钟")

    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权禁言该用户")

    user.muted_until = datetime.now() + timedelta(minutes=duration_minutes)
    user.updated_at = datetime.now()
    db.commit()
    db.refresh(user)

    # 通知用户
    send_notification_service(
        db, user.tenant_id or 0, user.id,
        "user_banned", "您已被禁言",
        f"由于违反社区规定，您已被禁言 {duration_minutes} 分钟",
        {"muted_until": user.muted_until.isoformat()},
        channel="in_app"
    )

    return {"id": user.id, "muted_until": user.muted_until}


def unmute_user(db: Session, ctx: RequestContext, user_id: int):
    """解除全局禁言"""
    if not ctx.is_admin:
        raise ForbiddenException("需要管理员权限")
    user = get_user_by_id(db, user_id)
    if not user:
        raise NotFoundException("用户不存在")
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权操作该用户")

    user.muted_until = None
    user.updated_at = datetime.now()
    db.commit()
    db.refresh(user)
    return {"id": user.id, "muted_until": None}


# ========== 敏感词服务 ==========

def get_sensitive_words_service(db: Session, ctx: RequestContext, **filters) -> Dict:
    """敏感词列表服务"""
    scope = filters.get("scope")
    category = filters.get("category")
    risk_level = filters.get("risk_level")
    enabled = filters.get("enabled")
    keyword = filters.get("keyword")
    page = filters.get("page", 1)
    page_size = filters.get("page_size", 20)

    tenant_id = None if ctx.is_super_admin else ctx.tenant_id
    # 非超级管理员只能看自己租户+平台级
    if not ctx.is_super_admin and scope == "tenant" and tenant_id is None:
        raise ForbiddenException("无法查看租户级敏感词")

    words = get_sensitive_words(
        db, tenant_id=tenant_id, scope=scope, category=category,
        risk_level=risk_level, enabled=enabled, keyword=keyword,
        page=page, page_size=page_size
    )
    total = count_sensitive_words(
        db, tenant_id=tenant_id, scope=scope, category=category,
        risk_level=risk_level, enabled=enabled, keyword=keyword
    )

    items = []
    for w in words:
        creator = get_user_by_id(db, w.created_by) if w.created_by else None
        items.append({
            "id": w.id,
            "tenant_id": w.tenant_id,
            "scope": "platform" if w.tenant_id is None else "tenant",
            "word": w.word,
            "category": w.category,
            "category_label": RISK_CATEGORY_LABELS.get(w.category, w.category),
            "risk_level": w.risk_level,
            "is_enabled": w.is_enabled,
            "is_regex": w.is_regex,
            "created_by_name": creator.nickname or creator.username if creator else None,
            "created_at": w.created_at,
            "updated_at": w.updated_at,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


def create_sensitive_word_service(db: Session, ctx: RequestContext, data: Dict) -> Dict:
    """创建敏感词"""
    if not ctx.is_super_admin and data.get("scope") == "platform":
        raise ForbiddenException("无权创建平台级敏感词")

    tenant_id = None if data.get("scope") == "platform" else ctx.tenant_id
    word = data.get("word", "").strip()
    if not word:
        raise BadRequestException("敏感词不能为空")

    sw = create_sensitive_word(
        db, tenant_id=tenant_id, word=word,
        category=data.get("category", "custom"),
        risk_level=data.get("risk_level", "medium"),
        is_enabled=data.get("is_enabled", True),
        is_regex=data.get("is_regex", False),
        created_by=ctx.user_id
    )
    return {"id": sw.id, "word": sw.word}


def update_sensitive_word_service(db: Session, ctx: RequestContext, word_id: int, data: Dict) -> Dict:
    """更新敏感词"""
    sw = get_sensitive_word_by_id(db, word_id)
    if not sw:
        raise NotFoundException("敏感词不存在")
    if not ctx.is_super_admin and sw.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权编辑该敏感词")

    update_data = {k: v for k, v in data.items() if k in ("word", "category", "risk_level", "is_enabled", "is_regex")}
    if "scope" in data:
        if not ctx.is_super_admin and data["scope"] == "platform":
            raise ForbiddenException("无权修改为平台级")
        update_data["tenant_id"] = None if data["scope"] == "platform" else ctx.tenant_id

    sw = update_sensitive_word(db, word_id, **update_data)
    return {"id": sw.id, "updated_at": sw.updated_at}


def delete_sensitive_word_service(db: Session, ctx: RequestContext, word_id: int):
    """删除敏感词"""
    sw = get_sensitive_word_by_id(db, word_id)
    if not sw:
        raise NotFoundException("敏感词不存在")
    if not ctx.is_super_admin and sw.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除该敏感词")
    delete_sensitive_word(db, word_id)
    return {"deleted": True}


def batch_import_sensitive_words(db: Session, ctx: RequestContext, words_text: str, category: str = "custom",
                                 risk_level: str = "medium", scope: str = "tenant") -> Dict:
    """批量导入敏感词"""
    if not words_text:
        raise BadRequestException("导入内容不能为空")
    if not ctx.is_super_admin and scope == "platform":
        raise ForbiddenException("无权导入平台级敏感词")

    tenant_id = None if scope == "platform" else ctx.tenant_id
    separators = re.compile(r"[\n,，;；]")
    raw_words = [w.strip() for w in separators.split(words_text) if w.strip()]
    created = 0
    for word in raw_words:
        create_sensitive_word(
            db, tenant_id=tenant_id, word=word, category=category,
            risk_level=risk_level, is_enabled=True, is_regex=False,
            created_by=ctx.user_id
        )
        created += 1

    return {"created": created}


# ========== 告警服务 ==========

def get_alert_records_service(db: Session, ctx: RequestContext, **filters) -> Dict:
    """告警记录列表服务"""
    tenant_id = None if ctx.is_super_admin else ctx.tenant_id
    status = filters.get("status")
    alert_type = filters.get("alert_type")
    risk_level = filters.get("risk_level")
    page = filters.get("page", 1)
    page_size = filters.get("page_size", 20)

    records = get_alert_records(
        db, tenant_id=tenant_id, status=status,
        alert_type=alert_type, risk_level=risk_level,
        page=page, page_size=page_size
    )
    total = count_alert_records(
        db, tenant_id=tenant_id, status=status,
        alert_type=alert_type, risk_level=risk_level
    )

    items = []
    for record in records:
        resolver = get_user_by_id(db, record.resolved_by) if record.resolved_by else None
        items.append({
            "id": record.id,
            "tenant_id": record.tenant_id,
            "alert_type": record.alert_type,
            "source_type": record.source_type,
            "source_id": record.source_id,
            "title": record.title,
            "content": record.content,
            "risk_level": record.risk_level,
            "status": record.status,
            "notified_channels": record.notified_channels or {},
            "resolved_by_name": resolver.nickname or resolver.username if resolver else None,
            "resolved_at": record.resolved_at,
            "created_at": record.created_at,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size
    }


def resolve_alert_service(db: Session, ctx: RequestContext, alert_id: int) -> Dict:
    """处理告警"""
    alert = get_alert_record_by_id(db, alert_id)
    if not alert:
        raise NotFoundException("告警不存在")
    if not ctx.is_super_admin and alert.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权处理该告警")

    alert = resolve_alert_record(db, alert_id, ctx.user_id)
    return {"id": alert.id, "status": alert.status, "resolved_at": alert.resolved_at}


def get_alert_rules_service(db: Session, ctx: RequestContext, alert_type: str = None) -> List[Dict]:
    """告警规则列表服务"""
    tenant_id = None if ctx.is_super_admin else ctx.tenant_id
    rules = get_alert_rules(db, tenant_id=tenant_id, alert_type=alert_type)
    return [{
        "id": r.id,
        "tenant_id": r.tenant_id,
        "scope": "platform" if r.tenant_id is None else "tenant",
        "rule_name": r.rule_name,
        "alert_type": r.alert_type,
        "trigger_condition": r.trigger_condition or {},
        "channels": r.channels or {},
        "enabled": r.enabled,
        "created_at": r.created_at,
    } for r in rules]


def update_alert_rule_service(db: Session, ctx: RequestContext, rule_id: int, data: Dict) -> Dict:
    """更新告警规则"""
    rule = get_alert_rule_by_id(db, rule_id)
    if not rule:
        raise NotFoundException("规则不存在")
    if not ctx.is_super_admin and rule.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权编辑该规则")

    update_data = {k: v for k, v in data.items() if k in ("rule_name", "trigger_condition", "channels", "enabled")}
    rule = update_alert_rule(db, rule_id, **update_data)
    return {"id": rule.id, "enabled": rule.enabled}


# ========== 默认数据初始化 ==========

def init_default_risk_data(db: Session):
    """初始化平台级默认敏感词与告警规则"""
    from dao.alert_dao import create_alert_rule

    # 默认告警规则
    existing_rules = get_alert_rules(db, tenant_id=None, alert_type="message_high_risk")
    if not existing_rules:
        create_alert_rule(
            db, tenant_id=None, rule_name="聊天消息高风险告警",
            alert_type="message_high_risk",
            trigger_condition={"risk_level": "high"},
            channels={"in_app": True, "browser": True, "email": False},
            enabled=True
        )
        logger.info("初始化默认聊天消息高风险告警规则")

    # 默认敏感词：将静态兜底词写入数据库（仅平台级，首次启动）
    existing_words = db.query(SensitiveWord).filter(SensitiveWord.tenant_id.is_(None)).first()
    if not existing_words:
        for category, words in DEFAULT_STATIC_WORDS.items():
            for word in words:
                create_sensitive_word(
                    db, tenant_id=None, word=word, category=category,
                    risk_level=DEFAULT_CATEGORY_RISK.get(category, "medium"),
                    is_enabled=True, is_regex=False
                )
        logger.info("初始化平台级默认敏感词")
