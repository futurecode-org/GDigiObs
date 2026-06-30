"""会话管理业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from dao.conversation_dao import (
    get_or_create_direct_conversation, get_user_conversations,
    get_conversation_by_id, get_conversation_members, is_conversation_member,
    create_message, get_conversation_messages, mark_messages_as_read,
    recall_message, hide_conversation, pin_conversation, mute_conversation,
    get_conversation_member, update_message_audit_result
)
from dao.group_dao import is_group_member_muted, get_group_member
from dao.user_dao import get_user_by_id
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.message_auditor import audit_message
from core.ws_manager import broadcast_message_new, broadcast_message_recalled, broadcast_message_read, broadcast_conversation_updated
from dao.conversation_dao import get_conversation_members
from model.user import User
from model.conversation import Conversation, Message

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
    
    # 获取当前用户未读数
    current_member = get_conversation_member(db, conversation_id, current_user.id)
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
    
    # 群聊时检查禁言状态
    if conversation.type == "group" and conversation.group_id:
        if is_group_member_muted(db, conversation.group_id, current_user.id):
            raise ForbiddenException("您已被禁言，无法发送消息")
    
    # 文本消息审计
    audit_result = None
    if message_type == "text" and content:
        audit_result = audit_message(content, current_user.id, current_user.tenant_id)
        
        if audit_result.audit_action == "block":
            logger.warning(f"消息被拦截: user_id={current_user.id}, reason={audit_result.blocked_reason}")
            raise BadRequestException(f"消息内容不符合规范: {audit_result.blocked_reason}")
    
    # 确定审计状态
    audit_status = "passed"
    risk_level = "none"
    risk_tags = []
    if audit_result:
        if audit_result.audit_action == "review":
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
    
    logger.info(f"用户发送消息: user_id={current_user.id}, conversation_id={conversation_id}")
    
    # 获取会话成员列表（排除发送者）用于推送
    members = get_conversation_members(db, conversation_id)
    recipient_user_ids = [m.user_id for m in members if m.user_id != current_user.id]
    
    result = {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "message_type": message.message_type,
        "content": message.content,
        "created_at": message.created_at,
        "audit_status": message.audit_status,
        "risk_level": message.risk_level,
        "risk_tags": message.risk_tags,
        "recipient_user_ids": recipient_user_ids
    }
    
    return result


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
            "sender_name": sender.nickname or sender.username if sender else "",
            "message_type": msg.message_type,
            "content": msg.content,
            "file_id": msg.file_id,
            "created_at": msg.created_at,
            "recalled_at": msg.recalled_at,
            "recalled": msg.recalled_at is not None
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