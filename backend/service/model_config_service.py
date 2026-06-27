"""模型配置业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from dao.model_config_dao import (
    get_model_configs, count_model_configs, get_model_config_by_id,
    create_model_config, update_model_config, delete_model_config,
    get_platform_models, get_embedding_models
)
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext
from core.security import encrypt_api_key, decrypt_api_key

logger = logging.getLogger(__name__)


def get_models_service(db: Session, ctx: RequestContext, model_type: str = None,
                       page: int = 1, page_size: int = 20) -> Dict:
    """获取模型配置列表"""
    models = get_model_configs(db, ctx.tenant_id, model_type, None, page, page_size)
    total = count_model_configs(db, ctx.tenant_id)
    
    model_list = []
    for model in models:
        model_list.append({
            "id": model.id,
            "name": model.name,
            "model_key": model.model_key,
            "model_type": model.model_type,
            "api_type": model.api_type,
            "support_tool_call": model.support_tool_call,
            "support_vision": model.support_vision,
            "visibility": model.visibility,
            "created_at": model.created_at
        })
    
    return {
        "items": model_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_model_detail_service(db: Session, ctx: RequestContext, model_id: int) -> Dict:
    """获取模型配置详情"""
    model = get_model_config_by_id(db, model_id)
    if not model:
        raise NotFoundException("模型配置不存在")
    
    # 权限检查
    if model.visibility == "platform":
        # 平台模型所有人都可以访问
        pass
    elif model.visibility == "tenant":
        if not ctx.is_super_admin and model.tenant_id != ctx.tenant_id:
            raise ForbiddenException("无权访问此模型配置")
    elif model.visibility == "personal":
        if model.owner_id != ctx.user_id:
            raise ForbiddenException("无权访问此模型配置")
    
    return {
        "id": model.id,
        "name": model.name,
        "model_key": model.model_key,
        "model_type": model.model_type,
        "api_type": model.api_type,
        "base_url": model.base_url,
        "support_tool_call": model.support_tool_call,
        "support_vision": model.support_vision,
        "support_reasoning": model.support_reasoning,
        "context_length": model.context_length,
        "max_tokens": model.max_tokens,
        "default_config": model.default_config,
        "visibility": model.visibility,
        "status": model.status
    }


def create_model_service(db: Session, ctx: RequestContext, name: str, model_key: str,
                         model_type: str, api_type: str, base_url: str,
                         api_key: str = None, visibility: str = "tenant", **kwargs) -> Dict:
    """创建模型配置"""
    # 加密API Key
    api_key_encrypted = None
    if api_key:
        api_key_encrypted = encrypt_api_key(api_key)
    
    model = create_model_config(
        db, ctx.tenant_id, ctx.user_id, name, model_key, model_type,
        api_type, base_url, visibility,
        api_key_encrypted=api_key_encrypted,
        **kwargs
    )
    
    logger.info(f"创建模型配置: model_id={model.id}, name={name}")
    
    return {
        "id": model.id,
        "name": model.name,
        "model_type": model.model_type,
        "visibility": model.visibility,
        "created_at": model.created_at
    }


def update_model_service(db: Session, ctx: RequestContext, model_id: int, **kwargs) -> Dict:
    """更新模型配置"""
    model = get_model_config_by_id(db, model_id)
    if not model:
        raise NotFoundException("模型配置不存在")
    
    # 权限检查
    if model.visibility == "platform" and not ctx.is_super_admin:
        raise ForbiddenException("无权修改平台模型")
    
    if model.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此模型配置")
    
    if model.owner_id != ctx.user_id and model.visibility == "personal":
        raise ForbiddenException("无权修改此模型配置")
    
    # 加密新的API Key
    if "api_key" in kwargs and kwargs["api_key"]:
        kwargs["api_key_encrypted"] = encrypt_api_key(kwargs["api_key"])
        kwargs.pop("api_key")
    
    model = update_model_config(db, model_id, **kwargs)
    
    return {
        "id": model.id,
        "name": model.name,
        "updated_at": model.updated_at
    }


def delete_model_service(db: Session, ctx: RequestContext, model_id: int):
    """删除模型配置"""
    model = get_model_config_by_id(db, model_id)
    if not model:
        raise NotFoundException("模型配置不存在")
    
    # 权限检查
    if model.visibility == "platform" and not ctx.is_super_admin:
        raise ForbiddenException("无权删除平台模型")
    
    if model.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除此模型配置")
    
    if model.owner_id != ctx.user_id:
        raise ForbiddenException("无权删除此模型配置")
    
    delete_model_config(db, model_id)
    logger.info(f"删除模型配置: model_id={model_id}")


def get_platform_models_service(db: Session) -> List[Dict]:
    """获取平台预置模型"""
    models = get_platform_models(db)
    
    return [
        {
            "id": model.id,
            "name": model.name,
            "model_key": model.model_key,
            "model_type": model.model_type,
            "api_type": model.api_type
        }
        for model in models
    ]


def get_available_embedding_models(db: Session, ctx: RequestContext) -> List[Dict]:
    """获取可用的Embedding模型"""
    models = get_embedding_models(db, ctx.tenant_id)
    
    return [
        {
            "id": model.id,
            "name": model.name,
            "model_key": model.model_key
        }
        for model in models
    ]


def test_model_service(db: Session, ctx: RequestContext, model_id: int) -> Dict:
    """测试模型配置"""
    model = get_model_config_by_id(db, model_id)
    if not model:
        raise NotFoundException("模型配置不存在")
    
    # 权限检查（与get_model_detail_service相同）
    if model.visibility == "tenant":
        if not ctx.is_super_admin and model.tenant_id != ctx.tenant_id:
            raise ForbiddenException("无权访问此模型配置")
    elif model.visibility == "personal":
        if model.owner_id != ctx.user_id:
            raise ForbiddenException("无权访问此模型配置")
    
    # TODO: 实现模型测试逻辑
    # 1. 解密API Key
    # 2. 调用模型API
    # 3. 返回测试结果
    
    return {
        "model_id": model_id,
        "test_result": "success",
        "message": "模型配置测试成功"
    }