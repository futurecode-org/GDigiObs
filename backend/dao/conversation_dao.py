"""会话管理数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, func
from typing import List, Optional
from datetime import datetime

from model.conversation import Conversation, ConversationMember, Message
from model.user import User


def get_or_create_direct_conversation(db: Session, user_id1: int, user_id2: int, tenant_id: int) -> Conversation:
    """获取或创建单聊会话"""
    # 查找现有单聊会话
    existing = db.query(Conversation).join(ConversationMember, and_(
        Conversation.id == ConversationMember.conversation_id,
        ConversationMember.user_id.in_([user_id1, user_id2])
    )).filter(
        Conversation.tenant_id == tenant_id,
        Conversation.type == "direct"
    ).group_by(Conversation.id).having(
        func.count(ConversationMember.user_id) == 2
    ).first()
    
    if existing:
        # 验证是否包含这两个用户
        members = db.query(ConversationMember).filter(
            ConversationMember.conversation_id == existing.id
        ).all()
        member_ids = [m.user_id for m in members]
        if user_id1 in member_ids and user_id2 in member_ids:
            return existing
    
    # 创建新会话
    conversation = Conversation(
        tenant_id=tenant_id,
        type="direct"
    )
    db.add(conversation)
    db.flush()
    
    # 添加成员
    member1 = ConversationMember(
        conversation_id=conversation.id,
        user_id=user_id1
    )
    member2 = ConversationMember(
        conversation_id=conversation.id,
        user_id=user_id2
    )
    db.add_all([member1, member2])
    db.commit()
    
    return conversation


def get_or_create_group_conversation(db: Session, group_id: int, tenant_id: int, owner_id: int) -> Conversation:
    """获取或创建群组会话"""
    # 查找现有群组会话
    existing = db.query(Conversation).filter(
        Conversation.tenant_id == tenant_id,
        Conversation.type == "group",
        Conversation.group_id == group_id
    ).first()
    
    if existing:
        return existing
    
    # 创建新会话
    conversation = Conversation(
        tenant_id=tenant_id,
        type="group",
        group_id=group_id
    )
    db.add(conversation)
    db.flush()
    
    # 添加群主为会话成员
    member = ConversationMember(
        conversation_id=conversation.id,
        user_id=owner_id
    )
    db.add(member)
    db.commit()
    
    return conversation


def add_user_to_group_conversation(db: Session, group_id: int, user_id: int):
    """将用户添加到群组会话"""
    conversation = db.query(Conversation).filter(
        Conversation.type == "group",
        Conversation.group_id == group_id
    ).first()
    
    if not conversation:
        return False
    
    # 检查是否已经是会话成员
    existing = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation.id,
        ConversationMember.user_id == user_id
    ).first()
    
    if existing:
        return False
    
    # 添加到会话成员
    member = ConversationMember(
        conversation_id=conversation.id,
        user_id=user_id
    )
    db.add(member)
    db.commit()
    
    return True


def get_user_conversations(db: Session, user_id: int) -> List[Conversation]:
    """获取用户的所有会话"""
    conversations = db.query(Conversation).join(ConversationMember).filter(
        ConversationMember.user_id == user_id,
        ConversationMember.hidden == False
    ).order_by(desc(Conversation.last_message_at)).all()
    return conversations


def get_conversation_by_id(db: Session, conversation_id: int) -> Optional[Conversation]:
    """获取会话详情"""
    return db.query(Conversation).filter(Conversation.id == conversation_id).first()


def get_conversation_members(db: Session, conversation_id: int) -> List[ConversationMember]:
    """获取会话成员列表"""
    return db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id
    ).all()


def is_conversation_member(db: Session, conversation_id: int, user_id: int) -> bool:
    """检查用户是否是会话成员"""
    member = db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == user_id
    ).first()
    return member is not None


def get_conversation_member(db: Session, conversation_id: int, user_id: int) -> Optional[ConversationMember]:
    """获取用户在会话中的成员信息"""
    return db.query(ConversationMember).filter(
        ConversationMember.conversation_id == conversation_id,
        ConversationMember.user_id == user_id
    ).first()


def update_conversation_last_message(db: Session, conversation_id: int, message_id: int):
    """更新会话最近消息"""
    conversation = get_conversation_by_id(db, conversation_id)
    if conversation:
        conversation.last_message_id = message_id
        conversation.last_message_at = datetime.now()
        db.commit()


def create_message(db: Session, tenant_id: int, conversation_id: int, sender_id: int,
                   message_type: str, content: str = None, file_id: int = None,
                   audit_status: str = "passed", risk_level: str = "none", risk_tags: list = None) -> Message:
    """创建消息"""
    message = Message(
        tenant_id=tenant_id,
        conversation_id=conversation_id,
        sender_id=sender_id,
        message_type=message_type,
        content=content,
        file_id=file_id,
        audit_status=audit_status,
        risk_level=risk_level,
        risk_tags=risk_tags or []
    )
    db.add(message)
    db.flush()
    
    # 更新会话最近消息
    update_conversation_last_message(db, conversation_id, message.id)
    
    # 增加其他成员未读数
    members = get_conversation_members(db, conversation_id)
    for member in members:
        if member.user_id != sender_id:
            member.unread_count += 1
    
    db.commit()
    return message


def update_message_audit_result(db: Session, message_id: int, audit_status: str, 
                                risk_level: str = None, risk_tags: list = None):
    """更新消息审计结果"""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        return False
    
    message.audit_status = audit_status
    if risk_level:
        message.risk_level = risk_level
    if risk_tags:
        message.risk_tags = risk_tags
    
    db.commit()
    return True


def update_message_ai_detection_result(
    db: Session, message_id: int,
    ai_risk_level: str, ai_risk_tags: list,
    ai_model_id: int = None, ai_reason: str = None,
    audit_status: str = None, risk_level: str = None, risk_tags: list = None
):
    """更新消息 AI 检测结果，并同步最终风险等级"""
    message = db.query(Message).filter(Message.id == message_id).first()
    if not message:
        return False

    from datetime import datetime
    message.ai_risk_level = ai_risk_level
    message.ai_risk_tags = ai_risk_tags or []
    message.ai_detected_at = datetime.now()
    message.ai_model_id = ai_model_id
    message.ai_reason = ai_reason

    if audit_status:
        message.audit_status = audit_status
    if risk_level:
        message.risk_level = risk_level
    if risk_tags is not None:
        message.risk_tags = risk_tags

    db.commit()
    return True


def get_text_messages_for_ai_detection(
    db: Session, limit: int = 100, minutes: int = None, only_unchecked: bool = True
) -> List[Message]:
    """获取待 AI 检测的文本消息"""
    from datetime import datetime, timedelta
    query = db.query(Message).filter(
        Message.message_type == "text",
        Message.recalled_at == None
    )
    if only_unchecked:
        query = query.filter(Message.ai_detected_at == None)
    if minutes:
        since = datetime.now() - timedelta(minutes=minutes)
        query = query.filter(Message.created_at >= since)

    return query.order_by(desc(Message.created_at)).limit(limit).all()


def count_messages_for_ai_detection(db: Session, only_unchecked: bool = True, minutes: int = None) -> int:
    """统计待 AI 检测的文本消息数量"""
    from datetime import datetime, timedelta
    query = db.query(Message).filter(
        Message.message_type == "text",
        Message.recalled_at == None
    )
    if only_unchecked:
        query = query.filter(Message.ai_detected_at == None)
    if minutes:
        since = datetime.now() - timedelta(minutes=minutes)
        query = query.filter(Message.created_at >= since)
    return query.count()


def get_chat_messages_for_audit(
    db: Session, tenant_id: int = None, audit_status: str = None,
    risk_level: str = None, keyword: str = None,
    page: int = 1, page_size: int = 20
):
    """获取聊天审计消息列表"""
    query = db.query(Message).filter(Message.message_type == "text")
    if tenant_id:
        query = query.filter(Message.tenant_id == tenant_id)
    if audit_status:
        query = query.filter(Message.audit_status == audit_status)
    if risk_level:
        query = query.filter(Message.risk_level == risk_level)
    if keyword:
        query = query.filter(Message.content.contains(keyword))

    total = query.count()
    messages = query.order_by(desc(Message.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    return messages, total


def get_conversation_messages(db: Session, conversation_id: int, page: int = 1,
                              page_size: int = 50) -> List[Message]:
    """获取会话消息列表"""
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id,
        Message.recalled_at == None
    ).order_by(desc(Message.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    return messages


def mark_messages_as_read(db: Session, conversation_id: int, user_id: int):
    """标记消息为已读"""
    member = get_conversation_member(db, conversation_id, user_id)
    if member:
        # 获取会话最近消息
        conversation = get_conversation_by_id(db, conversation_id)
        if conversation and conversation.last_message_id:
            member.last_read_message_id = conversation.last_message_id
            member.unread_count = 0
            db.commit()


def recall_message(db: Session, message_id: int, user_id: int) -> bool:
    """撤回消息"""
    message = db.query(Message).filter(
        Message.id == message_id,
        Message.sender_id == user_id,
        Message.recalled_at == None
    ).first()
    
    if not message:
        return False
    
    # 检查是否在撤回时间限制内（2分钟）
    time_diff = datetime.now() - message.created_at
    if time_diff.total_seconds() > 120:
        return False
    
    message.recalled_at = datetime.now()
    db.commit()
    return True


def hide_conversation(db: Session, conversation_id: int, user_id: int):
    """隐藏会话"""
    member = get_conversation_member(db, conversation_id, user_id)
    if member:
        member.hidden = True
        db.commit()


def pin_conversation(db: Session, conversation_id: int, user_id: int, pinned: bool):
    """置顶会话"""
    member = get_conversation_member(db, conversation_id, user_id)
    if member:
        member.pinned = pinned
        db.commit()


def mute_conversation(db: Session, conversation_id: int, user_id: int, muted: bool):
    """设置会话免打扰"""
    member = get_conversation_member(db, conversation_id, user_id)
    if member:
        member.muted = muted
        db.commit()