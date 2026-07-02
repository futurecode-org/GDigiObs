"""Dify 业务逻辑层"""
import logging
import time
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime

from dao.dify_dao import (
    get_dify_providers, get_dify_provider_by_id, create_dify_provider,
    update_dify_provider, delete_dify_provider, count_dify_providers,
    get_dify_apps, get_dify_app_by_id, create_dify_app, update_dify_app,
    delete_dify_app, count_dify_apps, get_dify_conversation,
    create_dify_conversation, get_dify_call_logs, create_dify_call_log,
    get_chat_assistants, get_chat_assistant_by_id, create_chat_assistant,
    update_chat_assistant, delete_chat_assistant, count_chat_assistants,
    get_dify_apps_by_provider
)
from schema.dify import (
    DifyProviderResponse, DifyAppResponse, DifyCallLogResponse, ChatAssistantResponse
)
from core.security import encrypt_api_key
from core.dify_client import DifyClient
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def get_apps_by_provider_service(db: Session, ctx: RequestContext, provider_id: int) -> Dict:
    """获取某 Provider 下的 Dify App 列表"""
    provider = get_dify_provider_by_id(db, provider_id)
    if not provider:
        raise NotFoundException("Provider不存在")
    
    if provider.visibility != "platform" and provider.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权限访问")
    
    apps = get_dify_apps_by_provider(db, provider_id)
    return {
        "items": [DifyAppResponse.model_validate(a) for a in apps],
        "total": len(apps)
    }


def get_providers_service(db: Session, ctx: RequestContext, page: int = 1, page_size: int = 20) -> Dict:
    """获取 Dify Provider 列表"""
    from schema.dify import DifyProviderResponse
    providers = get_dify_providers(db, ctx.tenant_id, page, page_size)
    total = count_dify_providers(db, ctx.tenant_id)
    
    return {
        "items": [DifyProviderResponse.model_validate(p) for p in providers],
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_provider_service(db: Session, ctx: RequestContext, provider_id: int) -> Dict:
    """获取 Dify Provider 详情"""
    provider = get_dify_provider_by_id(db, provider_id)
    if not provider:
        raise NotFoundException("Provider不存在")
    
    if provider.visibility != "platform" and provider.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权限访问")
    
    return provider


def create_provider_service(db: Session, ctx: RequestContext, data: Dict) -> Dict:
    """创建 Dify Provider"""
    encrypted_key = encrypt_api_key(data.pop("api_key"))
    
    provider = create_dify_provider(
        db,
        tenant_id=ctx.tenant_id if ctx.tenant_id else None,
        owner_id=ctx.user_id,
        api_key_encrypted=encrypted_key,
        **data
    )
    
    logger.info(f"创建 Dify Provider: id={provider.id}, name={provider.name}")
    return provider


def update_provider_service(db: Session, ctx: RequestContext, provider_id: int, data: Dict) -> Dict:
    """更新 Dify Provider"""
    provider = get_dify_provider_by_id(db, provider_id)
    if not provider:
        raise NotFoundException("Provider不存在")
    
    if provider.visibility != "platform" and provider.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权限修改")
    
    if "api_key" in data:
        data["api_key_encrypted"] = encrypt_api_key(data.pop("api_key"))
    
    provider = update_dify_provider(db, provider_id, **data)
    logger.info(f"更新 Dify Provider: id={provider_id}")
    return provider


def delete_provider_service(db: Session, ctx: RequestContext, provider_id: int, delete_kbs: bool = False) -> Dict:
    """删除 Dify Provider
    
    Args:
        delete_kbs: 是否同时删除该 Provider 关联的知识库（仅删除本地记录，不删除云端数据）
    
    Returns:
        {"deleted": bool, "deleted_kbs_count": int}
    """
    provider = get_dify_provider_by_id(db, provider_id)
    if not provider:
        raise NotFoundException("Provider不存在")
    
    if provider.visibility != "platform" and provider.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权限删除")
    
    deleted_kbs_count = 0
    if delete_kbs:
        # 查找该 Provider 关联的所有知识库，仅删除本地记录（不删除云端数据）
        from dao.knowledge_dao import get_knowledge_bases_by_dify_provider, delete_knowledge_base
        kbs = get_knowledge_bases_by_dify_provider(db, provider_id)
        for kb in kbs:
            delete_knowledge_base(db, kb.id)
            deleted_kbs_count += 1
            logger.info(f"删除关联知识库: kb_id={kb.id}, name={kb.name}, provider_id={provider_id}")
    
    delete_dify_provider(db, provider_id)
    logger.info(f"删除 Dify Provider: id={provider_id}, deleted_kbs={deleted_kbs_count}")
    return {"deleted": True, "deleted_kbs_count": deleted_kbs_count}


async def test_provider_service(db: Session, ctx: RequestContext, provider_id: int) -> Dict:
    """测试 Dify Provider 连接"""
    provider = get_dify_provider_by_id(db, provider_id)
    if not provider:
        raise NotFoundException("Provider不存在")
    
    client = DifyClient(provider)
    success = await client.test_connection()
    
    return {"success": success}


def get_apps_service(db: Session, ctx: RequestContext, app_type: str = None,
                     use_as_digital_employee: bool = None,
                     page: int = 1, page_size: int = 20) -> Dict:
    """获取 Dify App 列表"""
    apps = get_dify_apps(db, ctx.tenant_id, app_type, use_as_digital_employee, page, page_size)
    total = count_dify_apps(db, ctx.tenant_id, app_type, use_as_digital_employee)
    
    return {
        "items": [DifyAppResponse.model_validate(a) for a in apps],
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_app_service(db: Session, ctx: RequestContext, app_id: int) -> Dict:
    """获取 Dify App 详情"""
    app = get_dify_app_by_id(db, app_id)
    if not app:
        raise NotFoundException("App不存在")
    
    if app.visibility not in ["public", "platform"] and app.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权限访问")
    
    return app


def create_app_service(db: Session, ctx: RequestContext, data: Dict) -> Dict:
    """创建 Dify App"""
    provider = get_dify_provider_by_id(db, data["provider_id"])
    if not provider:
        raise NotFoundException("Provider不存在")
    
    if provider.status != "enabled":
        raise BadRequestException("Provider未启用")
    
    app = create_dify_app(
        db,
        tenant_id=ctx.tenant_id,
        owner_id=ctx.user_id,
        **data
    )
    
    logger.info(f"创建 Dify App: id={app.id}, name={app.name}, type={app.app_type}")
    return app


def update_app_service(db: Session, ctx: RequestContext, app_id: int, data: Dict) -> Dict:
    """更新 Dify App"""
    app = get_dify_app_by_id(db, app_id)
    if not app:
        raise NotFoundException("App不存在")
    
    if app.visibility not in ["public", "platform"] and app.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权限修改")
    
    app = update_dify_app(db, app_id, **data)
    logger.info(f"更新 Dify App: id={app_id}")
    return app


def delete_app_service(db: Session, ctx: RequestContext, app_id: int) -> bool:
    """删除 Dify App"""
    app = get_dify_app_by_id(db, app_id)
    if not app:
        raise NotFoundException("App不存在")
    
    if app.visibility not in ["public", "platform"] and app.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权限删除")
    
    delete_dify_app(db, app_id)
    logger.info(f"删除 Dify App: id={app_id}")
    return True


async def invoke_app_service(db: Session, ctx: RequestContext, app_id: int,
                             inputs: Dict, query: str = None, conversation_id: str = None,
                             files: List = None, scene: str = "chat",
                             system_conversation_id: int = None) -> Dict:
    """调用 Dify App (Blocking)"""
    app = get_dify_app_by_id(db, app_id)
    if not app:
        raise NotFoundException("App不存在")
    
    if app.status != "enabled":
        raise BadRequestException("App未启用")
    
    provider = get_dify_provider_by_id(db, app.provider_id)
    if not provider:
        raise NotFoundException("Provider不存在")
    
    start_time = time.time()
    
    client = DifyClient(provider)
    user_identifier = DifyClient.build_user_identifier(ctx.tenant_id, ctx.user_id)
    
    if not conversation_id and app.conversation_enabled:
        existing_conv = get_dify_conversation(
            db, ctx.tenant_id, ctx.user_id, app_id, scene, system_conversation_id
        )
        if existing_conv:
            conversation_id = existing_conv.dify_conversation_id
    
    result = await client.invoke(
        app, inputs, query, user_identifier, conversation_id, files, app.response_mode
    )
    
    latency_ms = int((time.time() - start_time) * 1000)
    
    if result.conversation_id and app.conversation_enabled:
        existing_conv = get_dify_conversation(
            db, ctx.tenant_id, ctx.user_id, app_id, scene, system_conversation_id
        )
        if not existing_conv:
            create_dify_conversation(
                db, ctx.tenant_id, ctx.user_id, app_id, scene, result.conversation_id,
                system_conversation_id=system_conversation_id
            )
    
    create_dify_call_log(
        db,
        tenant_id=ctx.tenant_id,
        user_id=ctx.user_id,
        provider_id=provider.id,
        dify_app_id=app.id,
        app_type=app.app_type,
        call_scene=scene,
        request_inputs=inputs,
        request_query=query,
        response_mode=app.response_mode,
        dify_task_id=result.task_id,
        dify_message_id=result.message_id,
        dify_conversation_id=result.conversation_id,
        answer_summary=result.answer[:500] if result.answer else None,
        dify_metadata=result.metadata,
        token_usage=result.token_usage,
        latency_ms=latency_ms,
        status="success" if result.success else "failed",
        error_message=result.error_message
    )
    
    return {
        "success": result.success,
        "answer": result.answer,
        "conversation_id": result.conversation_id,
        "task_id": result.task_id,
        "message_id": result.message_id,
        "metadata": result.metadata,
        "token_usage": result.token_usage
    }


async def chat_with_dify_digital_employee_service(
    db: Session, ctx: RequestContext, app_id: int, message: str,
    conversation_id: str = None, files: List = None
) -> Dict:
    """数字员工页面中直接与 Dify App 对话。"""
    app = get_dify_app_by_id(db, app_id)
    if not app:
        raise NotFoundException("App不存在")
    if not app.use_as_digital_employee:
        raise BadRequestException("该 App 未开启用作数字员工")

    return await invoke_app_service(
        db,
        ctx,
        app_id,
        inputs={},
        query=message,
        conversation_id=conversation_id,
        files=files,
        scene="digital_employee"
    )


async def stream_invoke_app_service(db: Session, ctx: RequestContext, app_id: int,
                                    inputs: Dict, query: str = None,
                                    conversation_id: str = None, files: List = None,
                                    scene: str = "chat",
                                    system_conversation_id: int = None):
    """调用 Dify App (Streaming)"""
    app = get_dify_app_by_id(db, app_id)
    if not app:
        raise NotFoundException("App不存在")
    
    if app.status != "enabled":
        raise BadRequestException("App未启用")
    
    provider = get_dify_provider_by_id(db, app.provider_id)
    if not provider:
        raise NotFoundException("Provider不存在")
    
    client = DifyClient(provider)
    user_identifier = DifyClient.build_user_identifier(ctx.tenant_id, ctx.user_id)
    
    if not conversation_id and app.conversation_enabled:
        existing_conv = get_dify_conversation(
            db, ctx.tenant_id, ctx.user_id, app_id, scene, system_conversation_id
        )
        if existing_conv:
            conversation_id = existing_conv.dify_conversation_id
    
    start_time = time.time()
    full_answer = ""
    final_conversation_id = conversation_id
    task_id = None
    message_id = None
    token_usage = None
    
    async for event in client.stream_invoke(app, inputs, query, user_identifier, conversation_id, files):
        yield event
        
        if event.get("answer"):
            full_answer += event.get("answer", "")
        
        if event.get("event") == "message_end":
            final_conversation_id = event.get("conversation_id")
            task_id = event.get("task_id")
            message_id = event.get("message_id")
            token_usage = event.get("usage")
    
    latency_ms = int((time.time() - start_time) * 1000)
    
    if final_conversation_id and app.conversation_enabled:
        existing_conv = get_dify_conversation(
            db, ctx.tenant_id, ctx.user_id, app_id, scene, system_conversation_id
        )
        if not existing_conv:
            create_dify_conversation(
                db, ctx.tenant_id, ctx.user_id, app_id, scene, final_conversation_id,
                system_conversation_id=system_conversation_id
            )
    
    create_dify_call_log(
        db,
        tenant_id=ctx.tenant_id,
        user_id=ctx.user_id,
        provider_id=provider.id,
        dify_app_id=app.id,
        app_type=app.app_type,
        call_scene=scene,
        request_inputs=inputs,
        request_query=query,
        response_mode="streaming",
        dify_task_id=task_id,
        dify_message_id=message_id,
        dify_conversation_id=final_conversation_id,
        answer_summary=full_answer[:500] if full_answer else None,
        token_usage=token_usage,
        latency_ms=latency_ms,
        status="success"
    )


async def test_app_service(db: Session, ctx: RequestContext, app_id: int) -> Dict:
    """测试调用 Dify App"""
    app = get_dify_app_by_id(db, app_id)
    if not app:
        raise NotFoundException("App不存在")
    
    inputs = app.default_inputs or {}
    result = await invoke_app_service(db, ctx, app_id, inputs, query="test", scene="test")
    
    return {"success": result["success"], "message": result.get("answer", "")[:100]}


def get_call_logs_service(db: Session, ctx: RequestContext, dify_app_id: int = None,
                          call_scene: str = None, page: int = 1, page_size: int = 50) -> Dict:
    """获取 Dify 调用日志"""
    logs = get_dify_call_logs(db, ctx.tenant_id, dify_app_id, call_scene, page, page_size)
    total = len(logs)
    
    return {
        "items": [DifyCallLogResponse.model_validate(l) for l in logs],
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_assistants_service(db: Session, ctx: RequestContext, page: int = 1, page_size: int = 20) -> Dict:
    """获取聊天助手列表"""
    assistants = get_chat_assistants(db, ctx.tenant_id, page, page_size)
    total = count_chat_assistants(db, ctx.tenant_id)
    
    return {
        "items": [ChatAssistantResponse.model_validate(a) for a in assistants],
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_assistant_service(db: Session, ctx: RequestContext, assistant_id: int) -> Dict:
    """获取聊天助手详情"""
    assistant = get_chat_assistant_by_id(db, assistant_id)
    if not assistant:
        raise NotFoundException("助手不存在")
    
    if assistant.visibility not in ["public"] and assistant.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权限访问")
    
    return assistant


def create_assistant_service(db: Session, ctx: RequestContext, data: Dict) -> Dict:
    """创建聊天助手"""
    if data["assistant_engine"].startswith("dify_"):
        if not data.get("dify_app_id"):
            raise BadRequestException("使用 Dify 引擎必须绑定 Dify App")
        
        dify_app = get_dify_app_by_id(db, data["dify_app_id"])
        if not dify_app:
            raise NotFoundException("Dify App不存在")
    
    assistant = create_chat_assistant(
        db,
        tenant_id=ctx.tenant_id,
        owner_id=ctx.user_id,
        **data
    )
    
    logger.info(f"创建聊天助手: id={assistant.id}, name={assistant.name}")
    return assistant


def update_assistant_service(db: Session, ctx: RequestContext, assistant_id: int, data: Dict) -> Dict:
    """更新聊天助手"""
    assistant = get_chat_assistant_by_id(db, assistant_id)
    if not assistant:
        raise NotFoundException("助手不存在")
    
    if assistant.visibility not in ["public"] and assistant.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权限修改")
    
    if data.get("assistant_engine", "").startswith("dify_"):
        if not data.get("dify_app_id"):
            raise BadRequestException("使用 Dify 引擎必须绑定 Dify App")
    
    assistant = update_chat_assistant(db, assistant_id, **data)
    logger.info(f"更新聊天助手: id={assistant_id}")
    return assistant


def delete_assistant_service(db: Session, ctx: RequestContext, assistant_id: int) -> bool:
    """删除聊天助手"""
    assistant = get_chat_assistant_by_id(db, assistant_id)
    if not assistant:
        raise NotFoundException("助手不存在")
    
    if assistant.visibility not in ["public"] and assistant.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权限删除")
    
    delete_chat_assistant(db, assistant_id)
    logger.info(f"删除聊天助手: id={assistant_id}")
    return True


async def chat_with_assistant_service(db: Session, ctx: RequestContext, assistant_id: int,
                                      message: str, conversation_id: int = None, files: List = None) -> Dict:
    """与聊天助手对话"""
    assistant = get_chat_assistant_by_id(db, assistant_id)
    if not assistant:
        raise NotFoundException("助手不存在")
    
    if assistant.status != "enabled":
        raise BadRequestException("助手未启用")
    
    if assistant.assistant_engine.startswith("dify_"):
        return await invoke_app_service(
            db, ctx, assistant.dify_app_id,
            inputs={},
            query=message,
            conversation_id=None,
            files=files,
            scene="chat"
        )
    else:
        raise BadRequestException("原生聊天助手暂未实现")
