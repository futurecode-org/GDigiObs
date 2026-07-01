"""聊天内容 AI 检测业务逻辑"""

import logging
from typing import Dict, List, Optional

from sqlalchemy.orm import Session

from core.ai_chat_detector import detect_chat_content, merge_risk_level, merge_risk_tags
from core.dependencies import RequestContext
from core.exceptions import NotFoundException, BadRequestException, ForbiddenException
from dao.conversation_dao import (
    get_chat_messages_for_audit,
    get_text_messages_for_ai_detection,
    update_message_ai_detection_result,
)
from dao.model_config_dao import get_model_config_by_id
from dao.audit_dao import create_audit_log
from model.conversation import Message
from model.model_config import ModelConfig
from model.user import User

logger = logging.getLogger(__name__)


def _resolve_llm_model(db: Session, model_id: Optional[int], tenant_id: Optional[int] = None) -> ModelConfig:
    """解析要使用的 LLM 模型"""
    from dao.model_config_dao import get_platform_models

    if model_id:
        model = get_model_config_by_id(db, model_id)
        if not model or model.deleted_at:
            raise NotFoundException("模型配置不存在")
        if model.status != "enabled":
            raise BadRequestException("模型配置未启用")
        if model.model_type != "llm":
            raise BadRequestException("该模型不是 LLM 模型")
        # 权限检查：系统调度或超级管理员 tenant_id 为空时跳过租户范围检查
        if model.visibility == "platform":
            pass
        elif model.visibility == "tenant":
            if tenant_id is not None and model.tenant_id != tenant_id:
                raise ForbiddenException("无权使用该模型")
        return model

    # 未指定时，优先使用平台预置 LLM
    platform_models = get_platform_models(db, model_type="llm")
    if platform_models:
        return platform_models[0]

    raise BadRequestException("未找到可用的 LLM 模型，请配置或指定 model_id")


def _apply_detection_to_message(
    db: Session,
    message: Message,
    result: Dict,
    model_id: Optional[int]
) -> Dict:
    """将 AI 检测结果写入消息，并同步最终风险等级"""
    ai_risk_level = result.get("risk_level", "none")
    ai_risk_tags = result.get("risk_tags", [])
    ai_reason = result.get("reason", "")

    # 合并最终风险等级与标签
    final_risk_level = merge_risk_level(message.risk_level, ai_risk_level)
    final_risk_tags = merge_risk_tags(message.risk_tags, ai_risk_tags)

    # 如果静态审计已经是 block，保持 blocked；否则根据 AI 结果调整
    if message.audit_status == "blocked":
        audit_status = "blocked"
    elif final_risk_level == "high":
        audit_status = "reviewing"
    elif final_risk_level == "medium":
        audit_status = "reviewing"
    else:
        audit_status = message.audit_status or "passed"

    update_message_ai_detection_result(
        db,
        message.id,
        ai_risk_level=ai_risk_level,
        ai_risk_tags=ai_risk_tags,
        ai_model_id=model_id,
        ai_reason=ai_reason,
        audit_status=audit_status,
        risk_level=final_risk_level,
        risk_tags=final_risk_tags,
    )

    # 记录审计日志
    try:
        create_audit_log(
            db,
            tenant_id=message.tenant_id,
            audit_type="message",
            user_id=None,
            risk_level=final_risk_level,
            risk_tags=final_risk_tags,
            content_summary=message.content[:200] if message.content else "",
            object_type="message",
            object_id=message.id,
            result={
                "ai_risk_level": ai_risk_level,
                "ai_risk_tags": ai_risk_tags,
                "ai_reason": ai_reason,
                "model_id": model_id,
                "success": result.get("success", True),
                "error": result.get("error"),
            },
        )
    except Exception as e:
        logger.error(f"记录 AI 检测审计日志失败: message_id={message.id}, error={e}")

    return {
        "message_id": message.id,
        "ai_risk_level": ai_risk_level,
        "ai_risk_tags": ai_risk_tags,
        "ai_reason": ai_reason,
        "risk_level": final_risk_level,
        "risk_tags": final_risk_tags,
        "audit_status": audit_status,
        "success": result.get("success", True),
        "error": result.get("error"),
    }


async def detect_chat_content_service(
    db: Session, content: str, model_id: Optional[int] = None,
    tenant_id: Optional[int] = None
) -> Dict:
    """对任意文本进行 AI 检测，不持久化"""
    if not content or not content.strip():
        raise BadRequestException("检测内容不能为空")

    model = _resolve_llm_model(db, model_id, tenant_id)
    result = await detect_chat_content(content, model)
    return {
        "model_id": model.id,
        "model_name": model.name,
        "risk_level": result.get("risk_level", "none"),
        "risk_tags": result.get("risk_tags", []),
        "reason": result.get("reason", ""),
        "success": result.get("success", True),
        "error": result.get("error"),
    }


async def detect_message_service(
    db: Session, message_id: int, model_id: Optional[int] = None,
    tenant_id: Optional[int] = None
) -> Dict:
    """对单条消息进行 AI 检测并持久化结果"""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise NotFoundException("消息不存在")

    if message.message_type != "text" or not message.content:
        raise BadRequestException("仅支持文本消息检测")

    model = _resolve_llm_model(db, model_id, tenant_id or message.tenant_id)
    result = await detect_chat_content(message.content, model)
    return _apply_detection_to_message(db, message, result, model.id)


async def detect_recent_messages_service(
    db: Session, limit: int = 100, model_id: Optional[int] = None,
    minutes: int = None, only_unchecked: bool = True
) -> Dict:
    """批量检测近期消息"""
    model = _resolve_llm_model(db, model_id)
    messages = get_text_messages_for_ai_detection(
        db, limit=limit, minutes=minutes, only_unchecked=only_unchecked
    )

    processed = 0
    failed = 0
    high_risk = 0
    medium_risk = 0

    for message in messages:
        try:
            result = await detect_chat_content(message.content, model)
            applied = _apply_detection_to_message(db, message, result, model.id)
            processed += 1
            if applied.get("risk_level") == "high":
                high_risk += 1
            elif applied.get("risk_level") == "medium":
                medium_risk += 1
            # 每次提交后刷新对象，避免会话过期问题
            db.refresh(message)
        except Exception as e:
            failed += 1
            logger.error(f"批量检测消息失败: message_id={message.id}, error={e}")

    return {
        "processed": processed,
        "failed": failed,
        "high_risk": high_risk,
        "medium_risk": medium_risk,
        "model_id": model.id,
        "model_name": model.name,
    }


async def run_scheduled_chat_ai_detection():
    """定时任务入口"""
    from database.session import Session
    from core.config import settings

    if not getattr(settings, "CHAT_AI_DETECTION_ENABLED", False):
        logger.info("聊天 AI 自动检测已关闭")
        return

    db = Session()
    try:
        model_id = getattr(settings, "CHAT_AI_DETECTION_MODEL_ID", None)
        batch_size = getattr(settings, "CHAT_AI_DETECTION_BATCH_SIZE", 50)
        result = await detect_recent_messages_service(
            db, limit=batch_size, model_id=model_id, only_unchecked=True
        )
        logger.info(f"聊天 AI 自动检测完成: {result}")
    except Exception as e:
        logger.error(f"聊天 AI 自动检测任务异常: {e}")
    finally:
        db.close()


def get_chat_messages_for_audit_service(
    db: Session, ctx: RequestContext,
    audit_status: str = None, risk_level: str = None,
    keyword: str = None, page: int = 1, page_size: int = 20
) -> Dict:
    """获取聊天审计消息列表"""
    if not ctx.is_super_admin and not ctx.is_tenant_admin:
        raise ForbiddenException("需要管理员权限")

    tenant_id = None if ctx.is_super_admin else ctx.tenant_id
    messages, total = get_chat_messages_for_audit(
        db, tenant_id=tenant_id, audit_status=audit_status,
        risk_level=risk_level, keyword=keyword,
        page=page, page_size=page_size
    )

    items = []
    sender_ids = {m.sender_id for m in messages}
    users = {u.id: u for u in db.query(User).filter(User.id.in_(sender_ids)).all()} if sender_ids else {}

    for msg in messages:
        sender = users.get(msg.sender_id)
        items.append({
            "id": msg.id,
            "conversation_id": msg.conversation_id,
            "sender_id": msg.sender_id,
            "sender_name": sender.nickname or sender.username if sender else f"用户{msg.sender_id}",
            "content": msg.content,
            "message_type": msg.message_type,
            "audit_status": msg.audit_status,
            "risk_level": msg.risk_level,
            "risk_tags": msg.risk_tags or [],
            "ai_risk_level": msg.ai_risk_level,
            "ai_risk_tags": msg.ai_risk_tags or [],
            "ai_detected_at": msg.ai_detected_at.isoformat() if msg.ai_detected_at else None,
            "ai_model_id": msg.ai_model_id,
            "ai_reason": msg.ai_reason,
            "created_at": msg.created_at.isoformat() if msg.created_at else None,
        })

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }
