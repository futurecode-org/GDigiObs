"""Dify 数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import desc, or_
from typing import List, Optional, Dict

from model.dify import DifyProvider, DifyApp, DifyConversation, DifyCallLog, ChatAssistant


def get_dify_providers(db: Session, tenant_id: int = None, page: int = 1, page_size: int = 20) -> List[DifyProvider]:
    """获取 Dify Provider 列表"""
    query = db.query(DifyProvider).filter(DifyProvider.status != "deleted")
    
    if tenant_id:
        query = query.filter(or_(
            DifyProvider.visibility == "platform",
            DifyProvider.tenant_id == tenant_id
        ))
    
    return query.order_by(desc(DifyProvider.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def get_dify_provider_by_id(db: Session, provider_id: int) -> Optional[DifyProvider]:
    """获取 Dify Provider 详情"""
    return db.query(DifyProvider).filter(
        DifyProvider.id == provider_id,
        DifyProvider.status != "deleted"
    ).first()


def create_dify_provider(db: Session, tenant_id: int = None, owner_id: int = None, **kwargs) -> DifyProvider:
    """创建 Dify Provider"""
    provider = DifyProvider(tenant_id=tenant_id, owner_id=owner_id, **kwargs)
    db.add(provider)
    db.commit()
    return provider


def update_dify_provider(db: Session, provider_id: int, **kwargs) -> DifyProvider:
    """更新 Dify Provider"""
    provider = get_dify_provider_by_id(db, provider_id)
    if not provider:
        return None
    
    for key, value in kwargs.items():
        if hasattr(provider, key):
            setattr(provider, key, value)
    
    db.commit()
    return provider


def delete_dify_provider(db: Session, provider_id: int) -> bool:
    """删除 Dify Provider"""
    provider = get_dify_provider_by_id(db, provider_id)
    if not provider:
        return False
    
    provider.status = "deleted"
    db.commit()
    return True


def count_dify_providers(db: Session, tenant_id: int = None) -> int:
    """统计 Dify Provider 数量"""
    query = db.query(DifyProvider).filter(DifyProvider.status != "deleted")
    
    if tenant_id:
        query = query.filter(or_(
            DifyProvider.visibility == "platform",
            DifyProvider.tenant_id == tenant_id
        ))
    
    return query.count()


def get_dify_apps(db: Session, tenant_id: int = None, app_type: str = None, page: int = 1, page_size: int = 20) -> List[DifyApp]:
    """获取 Dify App 列表"""
    query = db.query(DifyApp).filter(DifyApp.status != "deleted")
    
    if tenant_id:
        query = query.filter(or_(
            DifyApp.visibility == "public",
            DifyApp.visibility == "platform",
            DifyApp.tenant_id == tenant_id
        ))
    
    if app_type:
        query = query.filter(DifyApp.app_type == app_type)
    
    return query.order_by(desc(DifyApp.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def get_dify_app_by_id(db: Session, app_id: int) -> Optional[DifyApp]:
    """获取 Dify App 详情"""
    return db.query(DifyApp).filter(
        DifyApp.id == app_id,
        DifyApp.status != "deleted"
    ).first()


def create_dify_app(db: Session, tenant_id: int = None, owner_id: int = None, **kwargs) -> DifyApp:
    """创建 Dify App"""
    app = DifyApp(tenant_id=tenant_id, owner_id=owner_id, **kwargs)
    db.add(app)
    db.commit()
    return app


def update_dify_app(db: Session, app_id: int, **kwargs) -> DifyApp:
    """更新 Dify App"""
    app = get_dify_app_by_id(db, app_id)
    if not app:
        return None
    
    for key, value in kwargs.items():
        if hasattr(app, key):
            setattr(app, key, value)
    
    db.commit()
    return app


def delete_dify_app(db: Session, app_id: int) -> bool:
    """删除 Dify App"""
    app = get_dify_app_by_id(db, app_id)
    if not app:
        return False
    
    app.status = "deleted"
    db.commit()
    return True


def count_dify_apps(db: Session, tenant_id: int = None, app_type: str = None) -> int:
    """统计 Dify App 数量"""
    query = db.query(DifyApp).filter(DifyApp.status != "deleted")
    
    if tenant_id:
        query = query.filter(or_(
            DifyApp.visibility == "public",
            DifyApp.visibility == "platform",
            DifyApp.tenant_id == tenant_id
        ))
    
    if app_type:
        query = query.filter(DifyApp.app_type == app_type)
    
    return query.count()


def get_dify_conversation(db: Session, tenant_id: int, user_id: int, dify_app_id: int,
                          system_conversation_type: str, system_conversation_id: int = None) -> Optional[DifyConversation]:
    """获取 Dify 会话映射"""
    query = db.query(DifyConversation).filter(
        DifyConversation.tenant_id == tenant_id,
        DifyConversation.user_id == user_id,
        DifyConversation.dify_app_id == dify_app_id,
        DifyConversation.system_conversation_type == system_conversation_type,
        DifyConversation.status == "active"
    )
    
    if system_conversation_id:
        query = query.filter(DifyConversation.system_conversation_id == system_conversation_id)
    
    return query.first()


def create_dify_conversation(db: Session, tenant_id: int, user_id: int, dify_app_id: int,
                             system_conversation_type: str, dify_conversation_id: str,
                             system_conversation_id: int = None, title: str = None) -> DifyConversation:
    """创建 Dify 会话映射"""
    conversation = DifyConversation(
        tenant_id=tenant_id,
        user_id=user_id,
        dify_app_id=dify_app_id,
        system_conversation_type=system_conversation_type,
        system_conversation_id=system_conversation_id,
        dify_conversation_id=dify_conversation_id,
        title=title
    )
    db.add(conversation)
    db.commit()
    return conversation


def update_dify_conversation(db: Session, conversation_id: int, **kwargs) -> DifyConversation:
    """更新 Dify 会话映射"""
    conversation = db.query(DifyConversation).filter(DifyConversation.id == conversation_id).first()
    if not conversation:
        return None
    
    for key, value in kwargs.items():
        if hasattr(conversation, key):
            setattr(conversation, key, value)
    
    db.commit()
    return conversation


def close_dify_conversation(db: Session, tenant_id: int, user_id: int, dify_app_id: int,
                            system_conversation_id: int = None) -> bool:
    """关闭 Dify 会话映射"""
    conversation = get_dify_conversation(db, tenant_id, user_id, dify_app_id, "assistant", system_conversation_id)
    if not conversation:
        return False
    
    conversation.status = "closed"
    db.commit()
    return True


def get_dify_call_logs(db: Session, tenant_id: int, dify_app_id: int = None, call_scene: str = None,
                       page: int = 1, page_size: int = 50) -> List[DifyCallLog]:
    """获取 Dify 调用日志"""
    query = db.query(DifyCallLog).filter(DifyCallLog.tenant_id == tenant_id)
    
    if dify_app_id:
        query = query.filter(DifyCallLog.dify_app_id == dify_app_id)
    
    if call_scene:
        query = query.filter(DifyCallLog.call_scene == call_scene)
    
    return query.order_by(desc(DifyCallLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def create_dify_call_log(db: Session, **kwargs) -> DifyCallLog:
    """创建 Dify 调用日志"""
    log = DifyCallLog(**kwargs)
    db.add(log)
    db.commit()
    return log


def get_chat_assistants(db: Session, tenant_id: int = None, page: int = 1, page_size: int = 20) -> List[ChatAssistant]:
    """获取聊天助手列表"""
    query = db.query(ChatAssistant).filter(ChatAssistant.status != "deleted")
    
    if tenant_id:
        query = query.filter(or_(
            ChatAssistant.visibility == "public",
            ChatAssistant.tenant_id == tenant_id
        ))
    
    return query.order_by(desc(ChatAssistant.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def get_chat_assistant_by_id(db: Session, assistant_id: int) -> Optional[ChatAssistant]:
    """获取聊天助手详情"""
    return db.query(ChatAssistant).filter(
        ChatAssistant.id == assistant_id,
        ChatAssistant.status != "deleted"
    ).first()


def create_chat_assistant(db: Session, tenant_id: int, owner_id: int, **kwargs) -> ChatAssistant:
    """创建聊天助手"""
    assistant = ChatAssistant(tenant_id=tenant_id, owner_id=owner_id, **kwargs)
    db.add(assistant)
    db.commit()
    return assistant


def update_chat_assistant(db: Session, assistant_id: int, **kwargs) -> ChatAssistant:
    """更新聊天助手"""
    assistant = get_chat_assistant_by_id(db, assistant_id)
    if not assistant:
        return None
    
    for key, value in kwargs.items():
        if hasattr(assistant, key):
            setattr(assistant, key, value)
    
    db.commit()
    return assistant


def delete_chat_assistant(db: Session, assistant_id: int) -> bool:
    """删除聊天助手"""
    assistant = get_chat_assistant_by_id(db, assistant_id)
    if not assistant:
        return False
    
    assistant.status = "deleted"
    db.commit()
    return True


def count_chat_assistants(db: Session, tenant_id: int = None) -> int:
    """统计聊天助手数量"""
    query = db.query(ChatAssistant).filter(ChatAssistant.status != "deleted")
    
    if tenant_id:
        query = query.filter(or_(
            ChatAssistant.visibility == "public",
            ChatAssistant.tenant_id == tenant_id
        ))
    
    return query.count()
