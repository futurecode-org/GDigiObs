"""会话管理业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from dao.conversation_dao import (
    get_or_create_direct_conversation, get_user_conversations,
    get_conversation_by_id, get_conversation_members, is_conversation_member,
    create_message, get_conversation_messages, mark_messages_as_read,
    recall_message, hide_conversation, pin_conversation, mute_conversation,
    get_conversation_member
)
from dao.user_dao import get_user_by_id
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.message_auditor import audit_message
from model.user import User
from model.conversation import Conversation

logger = logging.getLogger(__name__)


def create_direct_conversation(db: Session, current_user: User, target_user_id: int) -> Dict:
    """创建单聊会话"""
    # 检查目标用户
    target_user = get_user_by_id(db, target_user_id)
    if not target_user:
        raise NotFoundException("目标用户不存在")
    
    # 检查是否同一租户（暂不支持跨租户聊天）
    if current_user.tenant_id != target_user.tenant_id:
        raise ForbiddenException("无法与非同租户用户发起会话")
    
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
    for member in members:
        user = get_user_by_id(db, member.user_id)
        member_info.append({
            "user_id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "avatar_file_id": user.avatar_file_id,
            "role": member.role if conversation.type == "group" else None
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
    
    # 文本消息审计
    audit_result = None
    if message_type == "text" and content:
        audit_result = audit_message(content, current_user.id, current_user.tenant_id)
        
        if audit_result.audit_action == "block":
            logger.warning(f"消息被拦截: user_id={current_user.id}, reason={audit_result.blocked_reason}")
            raise BadRequestException(f"消息内容不符合规范: {audit_result.blocked_reason}")
    
    # 创建消息
    message = create_message(
        db, current_user.tenant_id, conversation_id, current_user.id,
        message_type, content, file_id
    )
    
    logger.info(f"用户发送消息: user_id={current_user.id}, conversation_id={conversation_id}")
    
    result = {
        "id": message.id,
        "conversation_id": message.conversation_id,
        "sender_id": message.sender_id,
        "message_type": message.message_type,
        "content": message.content,
        "created_at": message.created_at
    }
    
    if audit_result and audit_result.audit_action == "review":
        result["audit_status"] = "pending_review"
        result["risk_level"] = audit_result.risk_level
    
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
        message_list.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "message_type": msg.message_type,
            "content": msg.content,
            "file_id": msg.file_id,
            "created_at": msg.created_at,
            "recalled_at": msg.recalled_at
        })
    
    return {
        "messages": message_list,
        "total": len(messages),
        "page": page,
        "page_size": page_size
    }


def mark_as_read(db: Session, current_user: User, conversation_id: int):
    """标记消息已读"""
    if not is_conversation_member(db, conversation_id, current_user.id):
        raise ForbiddenException("无权访问此会话")
    
    mark_messages_as_read(db, conversation_id, current_user.id)


def recall_message_service(db: Session, current_user: User, message_id: int):
    """撤回消息"""
    success = recall_message(db, message_id, current_user.id)
    if not success:
        raise BadRequestException("消息不存在或已超过撤回时间限制")


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