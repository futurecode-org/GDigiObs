"""Embedding客户端模块"""
import logging
import httpx
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class EmbeddingResult(BaseModel):
    """Embedding结果"""
    embeddings: List[List[float]] = []
    success: bool = True
    error_message: str = ""
    model_name: str = ""
    token_usage: Dict = {}


class BaseEmbeddingClient(ABC):
    """Embedding客户端基类"""
    
    def __init__(self, config: Dict):
        self.config = config
    
    @abstractmethod
    async def embed(self, texts: List[str]) -> EmbeddingResult:
        """获取文本的Embedding向量"""
        pass


class OpenAIEmbeddingClient(BaseEmbeddingClient):
    """OpenAI 兼容 API 的 Embedding 客户端"""
    
    async def embed(self, texts: List[str]) -> EmbeddingResult:
        try:
            base_url = self.config.get("base_url", "").rstrip("/")
            api_key = self.config.get("api_key", "")
            model_key = self.config.get("model_key", "text-embedding-ada-002")
            
            if not base_url or not api_key:
                return EmbeddingResult(success=False, error_message="Embedding 配置不完整")
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            url = f"{base_url}/embeddings"
            
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, json={
                    "model": model_key,
                    "input": texts
                }, headers=headers)
                
                resp.raise_for_status()
                data = resp.json()
                
                embeddings = []
                if "data" in data:
                    for item in data["data"]:
                        embeddings.append(item.get("embedding", []))
                
                usage = data.get("usage", {})
                
                return EmbeddingResult(
                    embeddings=embeddings,
                    success=True,
                    model_name=model_key,
                    token_usage=usage
                )
        
        except Exception as e:
            logger.error(f"Embedding 调用失败: {str(e)}")
            return EmbeddingResult(
                success=False,
                error_message=str(e),
                model_name=model_key
            )


class DifyEmbeddingClient(BaseEmbeddingClient):
    """Dify Embedding客户端"""
    
    async def embed(self, texts: List[str]) -> EmbeddingResult:
        try:
            base_url = self.config.get("base_url")
            api_key = self.config.get("api_key")
            
            if not base_url or not api_key:
                return EmbeddingResult(success=False, error_message="Dify配置不完整")
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            url = f"{base_url.rstrip('/')}/v1/embeddings"
            
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, json={
                    "inputs": {"texts": texts},
                    "response_mode": "blocking",
                    "user": "system"
                }, headers=headers)
                
                resp.raise_for_status()
                data = resp.json()
                
                embeddings = []
                if "data" in data:
                    for item in data["data"]:
                        embeddings.append(item.get("embedding", []))
                
                return EmbeddingResult(
                    embeddings=embeddings,
                    success=True,
                    model_name="dify"
                )
        
        except Exception as e:
            logger.error(f"Dify Embedding调用失败: {str(e)}")
            return EmbeddingResult(
                success=False,
                error_message=str(e),
                model_name="dify"
            )


class EmbeddingClientFactory:
    """Embedding客户端工厂"""
    
    @classmethod
    def create_client(cls, api_type: str, config: Dict) -> Optional[BaseEmbeddingClient]:
        """创建Embedding客户端"""
        if api_type == "dify":
            return DifyEmbeddingClient(config)
        elif api_type in ("openai", "anthropic", "ollama", "custom"):
            return OpenAIEmbeddingClient(config)
        
        logger.error(f"未知的Embedding类型: {api_type}")
        return None
    
    @classmethod
    def create_from_model_config(cls, model_config) -> Optional[BaseEmbeddingClient]:
        """从 ModelConfig 对象创建 Embedding 客户端"""
        from core.security import decrypt_api_key
        
        config = {
            "base_url": model_config.base_url,
            "api_key": decrypt_api_key(model_config.api_key_encrypted) if model_config.api_key_encrypted else "",
            "model_key": model_config.model_key
        }
        return cls.create_client(model_config.api_type, config)
    
    @classmethod
    def get_supported_types(cls) -> List[str]:
        """获取支持的Embedding类型列表"""
        return ["openai", "anthropic", "ollama", "dify", "custom"]
