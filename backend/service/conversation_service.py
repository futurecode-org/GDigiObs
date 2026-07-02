"""会话管理业务逻辑层"""
import logging
import re
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime

from dao.conversation_dao import (
    get_or_create_direct_conversation, get_user_conversations,
    get_conversation_by_id, get_conversation_members, is_conversation_member,
    create_message, get_conversation_messages, mark_messages_as_read,
    recall_message, hide_conversation, pin_conversation, mute_conversation,
    get_conversation_member, update_message_audit_result, update_message_content
)
from dao.group_dao import is_group_member_muted, get_group_member
from dao.user_dao import get_user_by_id
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext
from service.audit_risk_service import audit_message_content, create_message_audit_log, create_message_alert
from core.ws_manager import broadcast_message_new, broadcast_message_recalled, broadcast_message_read, broadcast_conversation_updated, broadcast_message_updated
from dao.conversation_dao import get_conversation_members
from model.user import User
from model.conversation import Conversation, Message
from dao.dify_dao import get_group_dify_app_members, get_dify_app_by_id
from service.dify_service import invoke_app_service, stream_invoke_app_service

logger = logging.getLogger(__name__)


def create_direct_conversation(db: Session, current_user: User, target_user_id: int) -> Dict:
    """创建单聊会话"""
    # 检查目标用户
    target_user = get_user_by_id(db, target_user_id)
    if not target_user:
        raise NotFoundException("目标用户不存在")
    
    # 暂时取消租户限制，允许跨租户会话
    # if current_user.tenant_id != target_user.tenant_id:
    #     raise ForbiddenException("无法与非同租户用户发起会话")
    
    # 获取或创建会话
    conversation = get_or_create_direct_conversation(
        db, current_user.id, target_user_id, current_user.tenant_id
    )
    
    # 获取成员信息
    members = get_conversation_members(db, conversation.id)
    member_info = []
    for member in members:
        user = get_user_by_id(db, member.user_id)
        member_info.append({
            "user_id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "avatar_file_id": user.avatar_file_id,
            "unread_count": member.unread_count
        })
    
    # 获取当前用户未读数
    current_member = get_conversation_member(db, conversation.id, current_user.id)
    unread_count = current_member.unread_count if current_member else 0
    
    return {
        "conversation": {
            "id": conversation.id,
            "tenant_id": conversation.tenant_id,
            "type": conversation.type,
            "last_message_at": conversation.last_message_at
        },
        "members": member_info,
        "unread_count": unread_count
    }


def get_conversations(db: Session, current_user: User) -> List[Dict]:
    """获取用户会话列表"""
    conversations = get_user_conversations(db, current_user.id)
    
    result = []
    for conv in conversations:
        # 获取成员信息
        members = get_conversation_members(db, conv.id)
        
        # 构建成员信息列表
        member_info = []
        for member in members:
            user = get_user_by_id(db, member.user_id)
            member_info.append({
                "user_id": user.id,
                "username": user.username,
                "nickname": user.nickname,
                "avatar_file_id": user.avatar_file_id,
                "unread_count": member.unread_count
            })
        
        # 对于单聊，获取对方信息
        if conv.type == "direct":
            other_member = None
            for member in members:
                if member.user_id != current_user.id:
                    other_member = member
                    break
            
            if other_member:
                other_user = get_user_by_id(db, other_member.user_id)
                conv_name = other_user.nickname or other_user.username
            else:
                conv_name = "未知用户"
        else:
            # 群聊名称
            conv_name = conv.group.name if conv.group else "群聊"
        
        # 获取当前用户未读数
        current_member = get_conversation_member(db, conv.id, current_user.id)
        unread_count = current_member.unread_count if current_member else 0
        
        result.append({
            "id": conv.id,
            "type": conv.type,
            "group_id": conv.group_id,
            "name": conv_name,
            "members": member_info,
            "last_message_at": conv.last_message_at,
            "unread_count": unread_count,
            "pinned": current_member.pinned if current_member else False,
            "muted": current_member.muted if current_member else False
        })
    
    return result


def get_conversation_detail(db: Session, current_user: User, conversation_id: int) -> Dict:
    """获取会话详情"""
    conversation = get_conversation_by_id(db, conversation_id)
    if not conversation:
        raise NotFoundException("会话不存在")
    
    # 检查权限
    if not is_conversation_member(db, conversation_id, current_user.id):
        raise ForbiddenException("无权访问此会话")
    
    # 获取成员信息
    members = get_conversation_members(db, conversation_id)
    member_info = []
    
    # 如果是群聊，获取群成员角色信息
    group_member_roles = {}
    if conversation.type == "group" and conversation.group_id:
        from dao.group_dao import get_group_members
        group_members = get_group_members(db, conversation.group_id)
        for gm in group_members:
            group_member_roles[gm.user_id] = gm.role
    
    for member in members:
        user = get_user_by_id(db, member.user_id)
        member_info.append({
            "user_id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "avatar_file_id": user.avatar_file_id,
            "role": group_member_roles.get(member.user_id) if conversation.type == "group" else None
        })

    dify_app_members = []
    if conversation.type == "group" and conversation.group_id:
        for dify_member in get_group_dify_app_members(db, conversation.group_id):
            app = get_dify_app_by_id(db, dify_member.dify_app_id)
            if app and app.status != "deleted":
                dify_app_members.append({
                    "id": dify_member.id,
                    "group_id": conversation.group_id,
                    "dify_app_id": app.id,
                    "name": app.name,
                    "app_type": app.app_type,
                    "status": app.status,
                    "role": "dify_app",
                    "joined_at": dify_member.created_at.isoformat() if dify_member.created_at else None
                })
    
    # 获取当前用户未读数
    current_member = get_conversation_member(db, conversation_id, current_user.id)
    unread_count = current_member.unread_count if current_member else 0
    
    return {
        "conversation": {
            "id": conversation.id,
            "tenant_id": conversation.tenant_id,
            "type": conversation.type,
            "group_id": conversation.group_id,
            "last_message_at": conversation.last_message_at
        },
        "members": member_info,
        "dify_app_members": dify_app_members,
        "unread_count": unread_count
    }


def send_message(db: Session, current_user: User, conversation_id: int,
                 message_type: str, content: str = None, file_id: int = None) -> Dict:
    """发送消息"""
    # 检查会话是否存在
    conversation = get_conversation_by_id(db, conversation_id)
    if not conversation:
        raise NotFoundException("会话不存在")
    
    # 检查权限
    if not is_conversation_member(db, conversation_id, current_user.id):
        raise ForbiddenException("无权在此会话发送消息")
    
    # 全局禁言检查
    if current_user.muted_until and current_user.muted_until > datetime.now():
        raise ForbiddenException("您已被全局禁言，无法发送消息")
    
    # 群聊时检查禁言状态
    if conversation.type == "group" and conversation.group_id:
        if is_group_member_muted(db, conversation.group_id, current_user.id):
            raise ForbiddenException("您已被禁言，无法发送消息")
    
    # 文本消息审计
    audit_result = None
    if message_type == "text" and content:
        audit_result = audit_message_content(db, content, current_user.tenant_id)
        if audit_result.action == "block":
            logger.warning(f"消息被拦截: user_id={current_user.id}, reason={audit_result.reason}")
    
    # 确定审计状态
    audit_status = "passed"
    risk_level = "none"
    risk_tags = []
    if audit_result:
        if audit_result.action == "block":
            audit_status = "blocked"
        elif audit_result.action == "review":
            audit_status = "reviewing"
        else:
            audit_status = "passed"
        risk_level = audit_result.risk_level
        risk_tags = audit_result.risk_tags
    
    # 创建消息
    message = create_message(
        db, current_user.tenant_id, conversation_id, current_user.id,
        message_type, content, file_id, audit_status, risk_level, risk_tags
    )
    
    # 记录审计日志，高风险生成告警
    if audit_result:
        create_message_audit_log(db, current_user.tenant_id, message, audit_result)
        if audit_result.action == "block":
            ctx = RequestContext(
                user_id=current_user.id,
                tenant_id=current_user.tenant_id,
                username=current_user.username or ""
            )
            create_message_alert(db, ctx, message, audit_result)
    
    logger.info(f"用户发送消息: user_id={current_user.id}, conversation_id={conversation_id}")
    
    # 获取会话成员列表（排除发送者）用于推送
    members = get_conversation_members(db, conversation_id)
    recipient_user_ids = [m.user_id for m in members if m.user_id != current_user.id]
    
    result = {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "sender_type": message.sender_type,
        "sender_display_name": message.sender_display_name,
        "message_type": message.message_type,
        "content": message.content,
        "created_at": message.created_at,
        "audit_status": message.audit_status,
        "risk_level": message.risk_level,
        "risk_tags": message.risk_tags,
        "recipient_user_ids": recipient_user_ids
    }

    return result


async def process_dify_employee_replies(
    db: Session,
    current_user: User,
    conversation_id: int,
    content: str,
    recipient_user_ids: List[int]
):
    """后台处理群聊 @ Dify 数字员工回复并推送。"""
    conversation = get_conversation_by_id(db, conversation_id)
    if not conversation:
        return
    if conversation.type != "group" or not conversation.group_id:
        return
    reply_recipient_user_ids = sorted(set([*recipient_user_ids, current_user.id]))

    ctx = RequestContext(
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        username=current_user.username or ""
    )
    for group_member in get_group_dify_app_members(db, conversation.group_id):
        app = get_dify_app_by_id(db, group_member.dify_app_id)
        if not app or app.status != "enabled" or not app.use_as_digital_employee:
            continue

        mention_pattern = re.compile(rf"@{re.escape(app.name)}(?:\s|$)")
        if not mention_pattern.search(content):
            continue

        query = mention_pattern.sub("", content).strip()
        if not query:
            query = content.replace(f"@{app.name}", "").strip()

        if app.response_mode == "streaming":
            reply = create_message(
                db,
                current_user.tenant_id,
                conversation.id,
                current_user.id,
                "text",
                "",
                None,
                "passed",
                "none",
                [],
                sender_type="dify_app",
                sender_display_name=app.name,
                dify_app_id=app.id
            )
            message_data = _format_dify_reply_message(reply)
            await broadcast_message_new(conversation_id, message_data, reply_recipient_user_ids)
            await broadcast_conversation_updated(conversation_id, reply_recipient_user_ids)

            answer = ""
            async for event in stream_invoke_app_service(
                db,
                ctx,
                app.id,
                inputs={},
                query=query,
                conversation_id=None,
                files=None,
                scene="group_chat",
                system_conversation_id=conversation.id
            ):
                chunk = event.get("answer")
                if not chunk and isinstance(event.get("data"), dict):
                    chunk = event["data"].get("answer")
                if not chunk:
                    continue
                answer += chunk
                updated = update_message_content(db, reply.id, answer)
                if updated:
                    await broadcast_message_updated(conversation_id, _format_dify_reply_message(updated), reply_recipient_user_ids)

            if not answer:
                updated = update_message_content(db, reply.id, "Dify 应用未返回内容")
                if updated:
                    await broadcast_message_updated(conversation_id, _format_dify_reply_message(updated), reply_recipient_user_ids)
            continue

        invoke_result = await invoke_app_service(
            db,
            ctx,
            app.id,
            inputs={},
            query=query,
            conversation_id=None,
            files=None,
            scene="group_chat",
            system_conversation_id=conversation.id
        )
        answer = invoke_result.get("answer") or "Dify 应用未返回内容"
        reply = create_message(
            db,
            current_user.tenant_id,
            conversation.id,
            current_user.id,
            "text",
            answer,
            None,
            "passed",
            "none",
            [],
            sender_type="dify_app",
            sender_display_name=app.name,
            dify_app_id=app.id
        )
        await broadcast_message_new(conversation_id, _format_dify_reply_message(reply), reply_recipient_user_ids)
        await broadcast_conversation_updated(conversation_id, reply_recipient_user_ids)


def _format_dify_reply_message(reply: Message) -> Dict:
    return {
        "id": reply.id,
        "conversation_id": reply.conversation_id,
        "sender_id": reply.sender_id,
        "sender_type": reply.sender_type,
        "sender_display_name": reply.sender_display_name,
        "sender_name": reply.sender_display_name,
        "dify_app_id": reply.dify_app_id,
        "message_type": reply.message_type,
        "content": reply.content,
        "created_at": reply.created_at.isoformat() if reply.created_at else None,
        "recalled_at": None,
        "recalled": False,
        "audit_status": reply.audit_status,
        "risk_level": reply.risk_level,
        "risk_tags": reply.risk_tags,
    }


async def _call_mentioned_dify_employees(
    db: Session, current_user: User, conversation: Conversation, content: str
) -> List[Dict]:
    """群聊中 @ Dify 数字员工后调用 Dify，并将回复作为消息落库。"""
    if conversation.type != "group" or not conversation.group_id:
        return []

    group_dify_members = get_group_dify_app_members(db, conversation.group_id)
    if not group_dify_members:
        return []

    ctx = RequestContext(
        user_id=current_user.id,
        tenant_id=current_user.tenant_id,
        username=current_user.username or ""
    )
    replies = []
    for group_member in group_dify_members:
        app = get_dify_app_by_id(db, group_member.dify_app_id)
        if not app or app.status != "enabled" or not app.use_as_digital_employee:
            continue

        mention_pattern = re.compile(rf"@{re.escape(app.name)}(?:\s|$)")
        if not mention_pattern.search(content):
            continue

        query = mention_pattern.sub("", content).strip()
        if not query:
            query = content.replace(f"@{app.name}", "").strip()

        invoke_result = await invoke_app_service(
            db,
            ctx,
            app.id,
            inputs={},
            query=query,
            conversation_id=None,
            files=None,
            scene="group_chat",
            system_conversation_id=conversation.id
        )
        answer = invoke_result.get("answer") or "Dify 应用未返回内容"
        reply = create_message(
            db,
            current_user.tenant_id,
            conversation.id,
            current_user.id,
            "text",
            answer,
            None,
            "passed",
            "none",
            [],
            sender_type="dify_app",
            sender_display_name=app.name,
            dify_app_id=app.id
        )
        replies.append({
            "id": reply.id,
            "conversation_id": reply.conversation_id,
            "sender_id": reply.sender_id,
            "sender_type": reply.sender_type,
            "sender_display_name": reply.sender_display_name,
            "sender_name": reply.sender_display_name,
            "dify_app_id": reply.dify_app_id,
            "message_type": reply.message_type,
            "content": reply.content,
            "created_at": reply.created_at,
            "audit_status": reply.audit_status,
            "risk_level": reply.risk_level,
            "risk_tags": reply.risk_tags,
        })

    return replies


def get_messages(db: Session, current_user: User, conversation_id: int, 
                 page: int = 1, page_size: int = 50) -> Dict:
    """获取会话消息列表"""
    # 检查权限
    if not is_conversation_member(db, conversation_id, current_user.id):
        raise ForbiddenException("无权访问此会话")
    
    messages = get_conversation_messages(db, conversation_id, page, page_size)
    
    # 转换为响应格式
    message_list = []
    for msg in messages:
        sender = get_user_by_id(db, msg.sender_id)
        message_list.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_type": msg.sender_type,
            "sender_display_name": msg.sender_display_name,
            "dify_app_id": msg.dify_app_id,
            "sender_name": msg.sender_display_name if msg.sender_type == "dify_app" else (sender.nickname or sender.username if sender else ""),
            "message_type": msg.message_type,
            "content": msg.content,
            "file_id": msg.file_id,
            "created_at": msg.created_at,
            "recalled_at": msg.recalled_at,
            "recalled": msg.recalled_at is not None,
            "audit_status": msg.audit_status,
            "risk_level": msg.risk_level,
            "risk_tags": msg.risk_tags,
        })
    
    return {
        "messages": message_list,
        "total": len(messages),
        "page": page,
        "page_size": page_size
    }


def mark_as_read(db: Session, current_user: User, conversation_id: int) -> Dict:
    """标记消息已读"""
    if not is_conversation_member(db, conversation_id, current_user.id):
        raise ForbiddenException("无权访问此会话")
    
    mark_messages_as_read(db, conversation_id, current_user.id)
    
    # 获取会话成员列表（排除当前用户）用于推送
    members = get_conversation_members(db, conversation_id)
    recipient_user_ids = [m.user_id for m in members if m.user_id != current_user.id]
    
    return {
        "conversation_id": conversation_id,
        "user_id": current_user.id,
        "recipient_user_ids": recipient_user_ids
    }


def recall_message_service(db: Session, current_user: User, message_id: int) -> Dict:
    """撤回消息"""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        raise BadRequestException("消息不存在")
    
    conversation_id = message.conversation_id
    
    success = recall_message(db, message_id, current_user.id)
    if not success:
        raise BadRequestException("消息不存在或已超过撤回时间限制")
    
    # 获取会话成员列表（排除当前用户）用于推送
    members = get_conversation_members(db, conversation_id)
    recipient_user_ids = [m.user_id for m in members if m.user_id != current_user.id]
    
    return {
        "message_id": message_id,
        "conversation_id": conversation_id,
        "recipient_user_ids": recipient_user_ids
    }


def update_conversation_settings(db: Session, current_user: User, conversation_id: int,
                                  pinned: bool = None, muted: bool = None, hidden: bool = None):
    """更新会话设置"""
    if not is_conversation_member(db, conversation_id, current_user.id):
        raise ForbiddenException("无权访问此会话")
    
    if pinned is not None:
        pin_conversation(db, conversation_id, current_user.id, pinned)
    
    if muted is not None:
        mute_conversation(db, conversation_id, current_user.id, muted)
    
    if hidden is not None:
        hide_conversation(db, conversation_id, current_user.id)
