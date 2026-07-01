"""聊天内容 AI 检测客户端

支持通过 model_configs 中配置的模型进行单条内容风险识别。
目前支持 api_type: openai / custom（OpenAI 兼容格式） / anthropic / ollama。
"""

import json
import logging
import re
from typing import Dict, List, Optional

import httpx

from core.security import decrypt_api_key
from model.model_config import ModelConfig

logger = logging.getLogger(__name__)

RISK_CATEGORIES = [
    "涉政",
    "涉黄",
    "辱骂",
    "暴恐",
    "广告",
    "隐私泄露",
    "商业机密",
    "违法违规",
    "自定义",
]

_SYSTEM_PROMPT = (
    "你是一名内容安全审核助手。请对以下聊天内容进行风险检测。"
    "如果内容安全，返回 risk_level 为 none；如果存在风险，返回 low/medium/high。"
    "risk_tags 只能从以下类别中选择：" + "、".join(RISK_CATEGORIES) + "。"
    "reason 用一句话说明判定理由。"
    "必须且仅返回如下 JSON 格式，不要包含其他文字：\n"
    '{"risk_level": "none|low|medium|high", "risk_tags": ["涉政"], "reason": "..."}'
)

_RISK_ORDER = {"none": 0, "low": 1, "medium": 2, "high": 3}


def _safe_json_loads(text: str) -> Optional[Dict]:
    """尝试从模型输出中解析 JSON"""
    text = text.strip()
    # 去除 markdown 代码块
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
    try:
        return json.loads(text)
    except Exception:
        return None


def _normalize_risk_level(level: Optional[str]) -> str:
    if not level:
        return "none"
    level = str(level).strip().lower()
    if level in ("high", "medium", "low", "none"):
        return level
    # 兼容常见表述
    if level in ("严重", "高危"):
        return "high"
    if level in ("中危", "中等"):
        return "medium"
    if level in ("低危", "轻微"):
        return "low"
    return "none"


def _normalize_tags(tags) -> List[str]:
    if not tags:
        return []
    if isinstance(tags, str):
        tags = [tags]
    result = []
    for tag in tags:
        tag = str(tag).strip()
        if tag in RISK_CATEGORIES:
            result.append(tag)
    return list(set(result))


def _extract_json_from_text(text: str) -> Optional[Dict]:
    """如果模型混有解释文本，尝试从中提取 JSON 对象"""
    # 匹配第一个 { ... }
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return _safe_json_loads(match.group(0))
    return None


def _build_messages(content: str) -> List[Dict]:
    return [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user", "content": content},
    ]


async def _call_openai_compatible(
    base_url: str, api_key: Optional[str], model_key: str, messages: List[Dict], max_tokens: int = 512
) -> str:
    """调用 OpenAI 兼容 chat/completions 接口"""
    url = f"{base_url.rstrip('/')}/chat/completions"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"

    payload = {
        "model": model_key,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": 0.1,
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        return result["choices"][0]["message"]["content"]


async def _call_anthropic(
    base_url: str, api_key: str, model_key: str, messages: List[Dict], max_tokens: int = 512
) -> str:
    """调用 Anthropic messages 接口"""
    url = f"{base_url.rstrip('/')}/messages"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
    }

    # Anthropic 使用 system 参数，而不是 system role message
    system_msg = ""
    user_messages = []
    for msg in messages:
        if msg.get("role") == "system":
            system_msg = msg.get("content", "")
        else:
            user_messages.append(msg)

    payload = {
        "model": model_key,
        "messages": user_messages,
        "max_tokens": max_tokens,
        "temperature": 0.1,
    }
    if system_msg:
        payload["system"] = system_msg

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        return result["content"][0]["text"]


async def _call_ollama(
    base_url: str, model_key: str, messages: List[Dict], num_predict: int = 512
) -> str:
    """调用 Ollama /api/generate 接口"""
    url = f"{base_url.rstrip('/')}/api/generate"

    # 将 messages 合并为 prompt
    prompt_parts = []
    for msg in messages:
        role = msg.get("role", "user")
        content = msg.get("content", "")
        if role == "system":
            prompt_parts.append(f"System: {content}")
        elif role == "user":
            prompt_parts.append(f"User: {content}")
        else:
            prompt_parts.append(f"{role.capitalize()}: {content}")
    prompt = "\n".join(prompt_parts)

    payload = {
        "model": model_key,
        "prompt": prompt,
        "stream": False,
        "options": {"num_predict": num_predict, "temperature": 0.1},
    }

    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        result = response.json()
        return result.get("response", "")


async def detect_chat_content(content: str, model_config: ModelConfig) -> Dict:
    """对单条聊天内容进行 AI 风险检测

    返回:
        {
            "risk_level": "none|low|medium|high",
            "risk_tags": ["涉政", ...],
            "reason": "...",
            "raw_response": "...",
            "success": bool,
            "error": "..."
        }
    """
    if not content or not content.strip():
        return {
            "risk_level": "none",
            "risk_tags": [],
            "reason": "空内容",
            "success": True,
        }

    api_key = ""
    if model_config.api_key_encrypted:
        try:
            api_key = decrypt_api_key(model_config.api_key_encrypted)
        except Exception as e:
            logger.warning(f"解密模型 API Key 失败: {e}")

    messages = _build_messages(content[:4000])
    raw_response = ""

    try:
        api_type = model_config.api_type or "openai"
        if api_type == "ollama":
            raw_response = await _call_ollama(
                model_config.base_url, model_config.model_key, messages
            )
        elif api_type == "anthropic":
            if not api_key:
                raise ValueError("Anthropic API 需要提供 API Key")
            raw_response = await _call_anthropic(
                model_config.base_url, api_key, model_config.model_key, messages
            )
        else:
            # openai / custom 统一使用 OpenAI 兼容格式
            raw_response = await _call_openai_compatible(
                model_config.base_url, api_key, model_config.model_key, messages
            )
    except Exception as e:
        logger.error(f"AI 检测请求失败: model_id={model_config.id}, error={e}")
        return {
            "risk_level": "none",
            "risk_tags": [],
            "reason": f"AI 检测请求失败: {e}",
            "raw_response": raw_response,
            "success": False,
            "error": str(e),
        }

    parsed = _safe_json_loads(raw_response)
    if not parsed:
        parsed = _extract_json_from_text(raw_response)

    if not parsed:
        logger.warning(f"AI 检测返回无法解析为 JSON: {raw_response[:200]}")
        return {
            "risk_level": "none",
            "risk_tags": [],
            "reason": "模型返回格式异常，无法解析",
            "raw_response": raw_response,
            "success": False,
            "error": "invalid_response_format",
        }

    risk_level = _normalize_risk_level(parsed.get("risk_level"))
    risk_tags = _normalize_tags(parsed.get("risk_tags"))
    reason = str(parsed.get("reason", "")).strip() or "AI 模型判定"

    return {
        "risk_level": risk_level,
        "risk_tags": risk_tags,
        "reason": reason,
        "raw_response": raw_response,
        "success": True,
    }


def merge_risk_level(current: Optional[str], ai: Optional[str]) -> str:
    """合并静态审计与 AI 审计风险等级，取最高"""
    current_level = _RISK_ORDER.get(current, 0)
    ai_level = _RISK_ORDER.get(ai, 0)
    return "high" if max(current_level, ai_level) >= 3 else (
        "medium" if max(current_level, ai_level) >= 2 else (
            "low" if max(current_level, ai_level) >= 1 else "none"
        )
    )


def merge_risk_tags(current: Optional[List[str]], ai: Optional[List[str]]) -> List[str]:
    """合并风险标签并去重"""
    tags = set(current or [])
    tags.update(ai or [])
    return sorted(tags)
