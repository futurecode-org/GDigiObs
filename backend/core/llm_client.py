"""LLM 客户端模块 - 用于知识库问答生成答案"""
import logging
import httpx
from typing import Dict, Optional

from core.security import decrypt_api_key
from model.model_config import ModelConfig

logger = logging.getLogger(__name__)


class LLMClient:
    """通用 LLM 客户端，支持 OpenAI 兼容 API"""
    
    def __init__(self, model_config: ModelConfig):
        self.model_config = model_config
        self.base_url = model_config.base_url.rstrip("/")
        self.api_key = decrypt_api_key(model_config.api_key_encrypted) if model_config.api_key_encrypted else ""
        self.model_key = model_config.model_key
        self.api_type = model_config.api_type
    
    async def chat(self, messages: list, temperature: float = 0.7, max_tokens: int = 1024) -> Optional[str]:
        """
        调用 LLM 生成回复
        
        Args:
            messages: 消息列表，格式 [{"role": "system"/"user"/"assistant", "content": "..."}]
            temperature: 温度参数
            max_tokens: 最大生成 token 数
            
        Returns:
            生成的文本内容，失败返回 None
        """
        try:
            if not self.base_url or not self.api_key:
                logger.error("LLM 配置不完整: base_url 或 api_key 缺失")
                return None
            
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            # 构建请求体
            payload = {
                "model": self.model_key,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            
            # Anthropic API 格式特殊处理
            if self.api_type == "anthropic":
                url = f"{self.base_url}/messages"
                # Anthropic 使用 system 作为顶层字段
                system_msg = None
                filtered_messages = []
                for msg in messages:
                    if msg.get("role") == "system":
                        system_msg = msg.get("content", "")
                    else:
                        filtered_messages.append(msg)
                
                payload = {
                    "model": self.model_key,
                    "messages": filtered_messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature
                }
                if system_msg:
                    payload["system"] = system_msg
            else:
                # OpenAI 兼容格式
                url = f"{self.base_url}/chat/completions"
            
            async with httpx.AsyncClient(timeout=120) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                
                # 解析响应
                if self.api_type == "anthropic":
                    content = data.get("content", [])
                    if content and len(content) > 0:
                        return content[0].get("text", "")
                else:
                    choices = data.get("choices", [])
                    if choices and len(choices) > 0:
                        return choices[0].get("message", {}).get("content", "")
                
                logger.warning("LLM 返回空响应")
                return None
        
        except httpx.HTTPStatusError as e:
            logger.error(f"LLM HTTP 错误: {e.response.status_code} - {e.response.text}")
            return None
        except Exception as e:
            logger.error(f"LLM 调用失败: {str(e)}")
            return None


class LLMClientFactory:
    """LLM 客户端工厂"""
    
    @classmethod
    def create_from_model_config(cls, model_config: ModelConfig) -> Optional[LLMClient]:
        """从 ModelConfig 对象创建 LLM 客户端"""
        if not model_config:
            return None
        return LLMClient(model_config)
