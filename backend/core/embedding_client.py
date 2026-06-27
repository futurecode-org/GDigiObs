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


class LocalEmbeddingClient(BaseEmbeddingClient):
    """本地Embedding客户端"""
    
    async def embed(self, texts: List[str]) -> EmbeddingResult:
        try:
            import numpy as np
            
            embedding_dim = self.config.get("embedding_dim", 1536)
            
            embeddings = []
            for text in texts:
                hash_value = hash(text)
                np.random.seed(hash_value)
                embedding = np.random.randn(embedding_dim).tolist()
                embeddings.append(embedding)
            
            logger.info(f"本地Embedding生成: {len(texts)}条文本")
            return EmbeddingResult(
                embeddings=embeddings,
                success=True,
                model_name="local"
            )
        
        except Exception as e:
            logger.error(f"本地Embedding生成失败: {str(e)}")
            return EmbeddingResult(
                success=False,
                error_message=str(e),
                model_name="local"
            )


class EmbeddingClientFactory:
    """Embedding客户端工厂"""
    
    CLIENTS = {
        "dify": DifyEmbeddingClient,
        "local": LocalEmbeddingClient
    }
    
    @classmethod
    def create_client(cls, provider_type: str, config: Dict) -> Optional[BaseEmbeddingClient]:
        """创建Embedding客户端"""
        if provider_type not in cls.CLIENTS:
            logger.error(f"未知的Embedding类型: {provider_type}")
            return None
        
        client_class = cls.CLIENTS[provider_type]
        return client_class(config)
    
    @classmethod
    def get_supported_types(cls) -> List[str]:
        """获取支持的Embedding类型列表"""
        return list(cls.CLIENTS.keys())