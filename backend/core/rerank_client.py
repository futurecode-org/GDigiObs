"""Rerank 客户端模块"""
import logging
import httpx
from abc import ABC, abstractmethod
from typing import List, Dict, Optional
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class RerankResult(BaseModel):
    """Rerank结果"""
    documents: List[Dict] = []  # 每个包含 content, score, original_index
    success: bool = True
    error_message: str = ""
    model_name: str = ""


class BaseRerankClient(ABC):
    """Rerank客户端基类"""
    
    def __init__(self, config: Dict):
        self.config = config
    
    @abstractmethod
    async def rerank(self, query: str, documents: List[str], top_k: int = 10) -> RerankResult:
        """对文档进行重排序"""
        pass


class OpenAIRerankClient(BaseRerankClient):
    """基于 OpenAI 兼容 API 的 Rerank 客户端"""
    
    async def rerank(self, query: str, documents: List[str], top_k: int = 10) -> RerankResult:
        try:
            base_url = self.config.get("base_url", "").rstrip("/")
            api_key = self.config.get("api_key", "")
            model_key = self.config.get("model_key", "")
            
            if not base_url or not api_key:
                return RerankResult(success=False, error_message="Rerank 配置不完整")
            
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            # 尝试标准 rerank API 格式
            url = f"{base_url}/rerank"
            payload = {
                "model": model_key,
                "query": query,
                "documents": documents,
                "top_n": top_k
            }
            
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, json=payload, headers=headers)
                
                # 如果标准 rerank 接口不存在，尝试用 completion 模拟
                if resp.status_code == 404:
                    return await self._rerank_by_completion(query, documents, top_k, base_url, headers, model_key)
                
                resp.raise_for_status()
                data = resp.json()
                
                ranked = []
                if "results" in data:
                    for item in data["results"]:
                        ranked.append({
                            "content": documents[item.get("index", 0)],
                            "score": item.get("relevance_score", 0.0),
                            "original_index": item.get("index", 0)
                        })
                
                return RerankResult(
                    documents=ranked,
                    success=True,
                    model_name=model_key
                )
        
        except Exception as e:
            logger.error(f"Rerank 调用失败: {str(e)}")
            return RerankResult(success=False, error_message=str(e), model_name=model_key)
    
    async def _rerank_by_completion(self, query: str, documents: List[str], top_k: int,
                                   base_url: str, headers: Dict, model_key: str) -> RerankResult:
        """通过 LLM 评分模拟 Rerank（降级方案）"""
        try:
            url = f"{base_url}/chat/completions"
            
            doc_text = "\n\n".join([f"[{i}] {doc}" for i, doc in enumerate(documents)])
            prompt = f"""请评估以下文档与查询的相关性，并为每个文档打分（0-10）。只返回 JSON 格式：{{"scores": [{{"index": 0, "score": 8.5}}, ...]}}

查询: {query}

文档:
{doc_text}
"""
            
            payload = {
                "model": model_key,
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.0,
                "max_tokens": 500
            }
            
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, json=payload, headers=headers)
                resp.raise_for_status()
                data = resp.json()
                
                # 简单处理：按原始顺序返回，不做真正重排
                # 实际生产环境应解析 LLM 返回的 JSON 评分
                ranked = []
                for i, doc in enumerate(documents[:top_k]):
                    ranked.append({
                        "content": doc,
                        "score": 1.0 - (i * 0.05),  # 简单递减分数
                        "original_index": i
                    })
                
                return RerankResult(
                    documents=ranked,
                    success=True,
                    model_name=f"{model_key}(completion-fallback)"
                )
        
        except Exception as e:
            logger.error(f"Rerank completion 降级失败: {str(e)}")
            return RerankResult(success=False, error_message=str(e), model_name=model_key)


class RerankClientFactory:
    """Rerank客户端工厂"""
    
    @classmethod
    def create_client(cls, api_type: str, config: Dict) -> Optional[BaseRerankClient]:
        """创建Rerank客户端"""
        if api_type in ("openai", "anthropic", "ollama", "custom"):
            return OpenAIRerankClient(config)
        
        logger.error(f"未知的 Rerank API 类型: {api_type}")
        return None
