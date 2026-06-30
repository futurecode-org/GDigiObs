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
            "support_reasoning": model.support_reasoning,
            "context_length": model.context_length,
            "max_tokens": model.max_tokens,
            "temperature": model.temperature,
            "visibility": model.visibility,
            "status": model.status,
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
        "temperature": model.temperature,
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


def toggle_model_status_service(db: Session, ctx: RequestContext, model_id: int, status: str) -> Dict:
    """启用/停用模型配置"""
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
    
    if status not in ["enabled", "disabled"]:
        raise BadRequestException("状态值无效，应为 enabled 或 disabled")
    
    model = update_model_config(db, model_id, status=status)
    
    logger.info(f"{'启用' if status == 'enabled' else '停用'}模型配置: model_id={model_id}")
    
    return {
        "id": model.id,
        "name": model.name,
        "status": model.status,
        "updated_at": model.updated_at
    }


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


def _call_openai_compatible(base_url: str, api_key: str, model_key: str, max_tokens: int = 10) -> Dict:
    """调用 OpenAI 兼容格式的 API 进行连通性测试"""
    import urllib.request
    import json
    import ssl
    
    # 确保 base_url 不以 / 结尾
    base_url = base_url.rstrip("/")
    
    # 构建请求
    url = f"{base_url}/chat/completions"
    headers = {
        "Content-Type": "application/json",
    }
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    
    payload = {
        "model": model_key,
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": max_tokens,
    }
    
    def _do_request(context):
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30, context=context) as response:
            result = json.loads(response.read().decode("utf-8"))
            usage = result.get("usage", {})
            return {
                "success": True,
                "response": result,
                "message": "连通成功",
                "prompt_tokens": usage.get("prompt_tokens"),
                "completion_tokens": usage.get("completion_tokens"),
                "total_tokens": usage.get("total_tokens"),
            }
    
    # 先尝试正常 SSL 验证
    import certifi
    try:
        ctx = ssl.create_default_context(cafile=certifi.where())
        return _do_request(ctx)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            error_json = json.loads(error_body)
            error_msg = error_json.get("error", {}).get("message", error_body)
        except:
            error_msg = error_body or str(e)
        return {
            "success": False,
            "message": f"API 返回错误: {error_msg}",
            "status_code": e.code
        }
    except Exception as e:
        # SSL 证书验证失败时，尝试不验证模式
        if "CERTIFICATE_VERIFY_FAILED" in str(e):
            try:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                return _do_request(ctx)
            except urllib.error.HTTPError as e2:
                error_body = e2.read().decode("utf-8")
                try:
                    error_json = json.loads(error_body)
                    error_msg = error_json.get("error", {}).get("message", error_body)
                except:
                    error_msg = error_body or str(e2)
                return {
                    "success": False,
                    "message": f"API 返回错误: {error_msg}",
                    "status_code": e2.code
                }
            except Exception as e2:
                return {
                    "success": False,
                    "message": f"请求失败: {str(e2)}"
                }
        return {
            "success": False,
            "message": f"请求失败: {str(e)}"
        }


def _call_ollama(base_url: str, model_key: str) -> Dict:
    """调用 Ollama API 进行连通性测试"""
    import urllib.request
    import json
    import ssl
    import certifi
    
    base_url = base_url.rstrip("/")
    url = f"{base_url}/api/generate"
    
    payload = {
        "model": model_key,
        "prompt": "hi",
        "stream": False,
        "options": {
            "num_predict": 10
        }
    }
    
    def _do_request(context):
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30, context=context) as response:
            result = json.loads(response.read().decode("utf-8"))
            # Ollama /api/generate 返回的 eval_count 可近似为 completion tokens
            eval_count = result.get("eval_count")
            return {
                "success": True,
                "response": result,
                "message": "连通成功",
                "completion_tokens": eval_count,
            }
    
    try:
        ctx = ssl.create_default_context(cafile=certifi.where())
        return _do_request(ctx)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            error_json = json.loads(error_body)
            error_msg = error_json.get("error", error_body)
        except:
            error_msg = error_body or str(e)
        return {
            "success": False,
            "message": f"API 返回错误: {error_msg}",
            "status_code": e.code
        }
    except Exception as e:
        if "CERTIFICATE_VERIFY_FAILED" in str(e):
            try:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                return _do_request(ctx)
            except urllib.error.HTTPError as e2:
                error_body = e2.read().decode("utf-8")
                try:
                    error_json = json.loads(error_body)
                    error_msg = error_json.get("error", error_body)
                except:
                    error_msg = error_body or str(e2)
                return {
                    "success": False,
                    "message": f"API 返回错误: {error_msg}",
                    "status_code": e2.code
                }
            except Exception as e2:
                return {
                    "success": False,
                    "message": f"请求失败: {str(e2)}"
                }
        return {
            "success": False,
            "message": f"请求失败: {str(e)}"
        }


def _call_anthropic(base_url: str, api_key: str, model_key: str, max_tokens: int = 10) -> Dict:
    """调用 Anthropic API 进行连通性测试"""
    import urllib.request
    import json
    import ssl
    import certifi
    
    base_url = base_url.rstrip("/")
    url = f"{base_url}/messages"
    
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    }
    
    payload = {
        "model": model_key,
        "messages": [{"role": "user", "content": "hi"}],
        "max_tokens": max_tokens,
    }
    
    def _do_request(context):
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30, context=context) as response:
            result = json.loads(response.read().decode("utf-8"))
            usage = result.get("usage", {})
            return {
                "success": True,
                "response": result,
                "message": "连通成功",
                "prompt_tokens": usage.get("input_tokens"),
                "completion_tokens": usage.get("output_tokens"),
                "total_tokens": usage.get("input_tokens", 0) + usage.get("output_tokens", 0) if usage.get("input_tokens") is not None and usage.get("output_tokens") is not None else None,
            }
    
    try:
        ctx = ssl.create_default_context(cafile=certifi.where())
        return _do_request(ctx)
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            error_json = json.loads(error_body)
            error_msg = error_json.get("error", {}).get("message", error_body)
        except:
            error_msg = error_body or str(e)
        return {
            "success": False,
            "message": f"API 返回错误: {error_msg}",
            "status_code": e.code
        }
    except Exception as e:
        if "CERTIFICATE_VERIFY_FAILED" in str(e):
            try:
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                return _do_request(ctx)
            except urllib.error.HTTPError as e2:
                error_body = e2.read().decode("utf-8")
                try:
                    error_json = json.loads(error_body)
                    error_msg = error_json.get("error", {}).get("message", error_body)
                except:
                    error_msg = error_body or str(e2)
                return {
                    "success": False,
                    "message": f"API 返回错误: {error_msg}",
                    "status_code": e2.code
                }
            except Exception as e2:
                return {
                    "success": False,
                    "message": f"请求失败: {str(e2)}"
                }
        return {
            "success": False,
            "message": f"请求失败: {str(e)}"
        }


def test_model_connectivity_service(
    db: Session, ctx: RequestContext,
    base_url: str, api_key: str, model_key: str,
    api_type: str = "openai", max_tokens: int = 10
) -> Dict:
    """测试模型连通性（不依赖数据库中的模型记录）"""
    
    if not base_url:
        raise BadRequestException("Base URL 不能为空")
    
    if not model_key:
        raise BadRequestException("模型标识不能为空")
    
    logger.info(f"测试模型连通性: api_type={api_type}, base_url={base_url}, model_key={model_key}")
    
    # 根据 API 类型选择对应的测试方法
    if api_type == "ollama":
        result = _call_ollama(base_url, model_key)
    elif api_type == "anthropic":
        if not api_key:
            raise BadRequestException("Anthropic API 需要提供 API Key")
        result = _call_anthropic(base_url, api_key, model_key, max_tokens)
    else:
        # openai 和 custom 都使用 OpenAI 兼容格式
        result = _call_openai_compatible(base_url, api_key, model_key, max_tokens)
    
    return result


def test_model_service(db: Session, ctx: RequestContext, model_id: int) -> Dict:
    """测试模型配置（基于数据库中已保存的模型）"""
    model = get_model_config_by_id(db, model_id)
    if not model:
        raise NotFoundException("模型配置不存在")
    
    # 权限检查
    if model.visibility == "tenant":
        if not ctx.is_super_admin and model.tenant_id != ctx.tenant_id:
            raise ForbiddenException("无权访问此模型配置")
    elif model.visibility == "personal":
        if model.owner_id != ctx.user_id:
            raise ForbiddenException("无权访问此模型配置")
    
    # 解密 API Key
    api_key = ""
    if model.api_key_encrypted:
        try:
            api_key = decrypt_api_key(model.api_key_encrypted)
        except Exception as e:
            logger.warning(f"解密 API Key 失败: {e}")
    
    result = test_model_connectivity_service(
        db, ctx,
        base_url=model.base_url,
        api_key=api_key,
        model_key=model.model_key,
        api_type=model.api_type,
        max_tokens=10
    )
    
    return {
        "model_id": model_id,
        "test_result": "success" if result["success"] else "failed",
        "message": result["message"],
        "details": result.get("response")
    }


def get_model_call_logs_service(db: Session, ctx: RequestContext, model_id: int = None,
                                page: int = 1, page_size: int = 20) -> Dict:
    """获取模型调用日志"""
    from model.log import OperationLog
    from sqlalchemy import desc
    
    query = db.query(OperationLog).filter(
        OperationLog.object_type == "model_config"
    )
    
    if model_id:
        query = query.filter(OperationLog.object_id == model_id)
    
    if not ctx.is_super_admin and ctx.tenant_id:
        query = query.filter(OperationLog.tenant_id == ctx.tenant_id)
    
    total = query.count()
    logs = query.order_by(desc(OperationLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()
    
    log_list = []
    for log in logs:
        log_list.append({
            "id": log.id,
            "user_id": log.user_id,
            "module": log.module,
            "action": log.action,
            "object_type": log.object_type,
            "object_id": log.object_id,
            "status": log.status,
            "error_message": log.error_message,
            "created_at": log.created_at
        })
    
    return {
        "items": log_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_model_token_usage_service(db: Session, ctx: RequestContext, model_id: int = None) -> Dict:
    """获取模型Token消耗统计"""
    # TODO: 实现真实的Token消耗统计
    # 目前返回模拟数据，后续可接入真实的调用记录表
    
    return {
        "total_calls": 0,
        "total_tokens": 0,
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "average_tokens_per_call": 0,
        "period": "all"
    }
