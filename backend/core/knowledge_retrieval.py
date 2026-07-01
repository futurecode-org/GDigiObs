"""知识库统一检索引擎"""
import logging
import time
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from core.chroma_client import ChromaClient
from core.embedding_client import EmbeddingClientFactory
from core.rerank_client import RerankClientFactory
from core.dify_kb_client import DifyKnowledgeBaseClient
from core.security import decrypt_api_key
from dao.knowledge_dao import get_knowledge_base_by_id
from model.knowledge import KnowledgeBase
from model.model_config import ModelConfig
from model.dify import DifyProvider
from model.chroma_config import ChromaConfig

logger = logging.getLogger(__name__)


class KnowledgeRetrievalEngine:
    """知识库统一检索引擎
    
    根据知识库类型（local/dify）路由到对应的检索后端
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    async def retrieve(self, kb: KnowledgeBase, query: str, top_k: int = 10,
                       score_threshold: float = None, use_rerank: bool = True) -> List[Dict]:
        """统一检索入口"""
        if kb.provider_type == "dify":
            return await self._retrieve_dify(kb, query, top_k, score_threshold)
        else:
            return await self._retrieve_local(kb, query, top_k, score_threshold, use_rerank)
    
    async def _retrieve_local(self, kb: KnowledgeBase, query: str, top_k: int = 10,
                              score_threshold: float = None, use_rerank: bool = True) -> List[Dict]:
        """本地 Chroma 检索"""
        # 1. 获取 Embedding 模型配置
        embedding_model = self.db.query(ModelConfig).filter(
            ModelConfig.id == kb.embedding_model_id,
            ModelConfig.deleted_at == None
        ).first()
        
        if not embedding_model:
            logger.error(f"Embedding 模型不存在: {kb.embedding_model_id}")
            return []
        
        # 2. 获取 Chroma 配置
        chroma_config = self.db.query(ChromaConfig).filter(
            ChromaConfig.id == kb.chroma_config_id,
            ChromaConfig.deleted_at == None
        ).first()
        
        if not chroma_config:
            logger.error(f"Chroma 配置不存在: {kb.chroma_config_id}")
            return []
        
        # 3. 生成查询向量
        embedding_client = EmbeddingClientFactory.create_from_model_config(embedding_model)
        if not embedding_client:
            logger.error("Embedding 客户端创建失败")
            return []
        
        embed_result = await embedding_client.embed([query])
        if not embed_result.success or not embed_result.embeddings:
            logger.error(f"Embedding 生成失败: {embed_result.error_message}")
            return []
        
        query_embedding = embed_result.embeddings[0]
        
        # 4. Chroma 检索
        chroma = ChromaClient(
            host=chroma_config.host,
            port=chroma_config.port,
            collection_prefix=chroma_config.collection_prefix
        )
        
        raw_results = chroma.query(
            tenant_id=kb.tenant_id,
            kb_id=kb.id,
            query_embedding=query_embedding,
            top_k=top_k * 2 if use_rerank and kb.rerank_model_id else top_k
        )
        
        if not raw_results:
            return []
        
        # 5. Rerank（如果配置了）
        if use_rerank and kb.rerank_model_id:
            rerank_model = self.db.query(ModelConfig).filter(
                ModelConfig.id == kb.rerank_model_id,
                ModelConfig.deleted_at == None
            ).first()
            
            if rerank_model:
                rerank_client = RerankClientFactory.create_client(
                    rerank_model.api_type,
                    {
                        "base_url": rerank_model.base_url,
                        "api_key": decrypt_api_key(rerank_model.api_key_encrypted) if rerank_model.api_key_encrypted else "",
                        "model_key": rerank_model.model_key
                    }
                )
                
                if rerank_client:
                    documents = [r["content"] for r in raw_results]
                    rerank_result = await rerank_client.rerank(query, documents, top_k=top_k)
                    
                    if rerank_result.success:
                        # 按 rerank 结果重排
                        ranked = []
                        for doc in rerank_result.documents:
                            orig_idx = doc.get("original_index", 0)
                            if orig_idx < len(raw_results):
                                item = raw_results[orig_idx].copy()
                                item["rerank_score"] = doc.get("score", 0.0)
                                ranked.append(item)
                        raw_results = ranked
        
        # 6. 过滤和格式化
        results = []
        for item in raw_results[:top_k]:
            if score_threshold is not None and item.get("distance", 1.0) > score_threshold:
                continue
            results.append({
                "id": item.get("id"),
                "content": item.get("content", ""),
                "score": item.get("rerank_score", 1.0 - item.get("distance", 0.0)),
                "metadata": item.get("metadata", {}),
                "source": "local"
            })
        
        return results
    
    async def _retrieve_dify(self, kb: KnowledgeBase, query: str, top_k: int = 10,
                             score_threshold: float = None) -> List[Dict]:
        """Dify 知识库检索"""
        # 获取 Dify Provider
        provider = self.db.query(DifyProvider).filter(
            DifyProvider.id == kb.dify_provider_id,
            DifyProvider.status != "deleted"
        ).first()
        
        if not provider:
            logger.error(f"Dify Provider 不存在: {kb.dify_provider_id}")
            return []
        
        if not kb.dify_dataset_id:
            logger.error(f"Dify Dataset ID 未设置: {kb.id}")
            return []
        
        # 调用 Dify 检索
        dify_kb = DifyKnowledgeBaseClient(provider)
        
        retrieval_model = {
            "search_method": "semantic_search",
            "reranking_enable": False,
            "top_k": top_k,
            "score_threshold_enabled": score_threshold is not None,
            "score_threshold": score_threshold or 0.0
        }
        
        records = await dify_kb.retrieve_chunks(kb.dify_dataset_id, query, retrieval_model, top_k)
        
        results = []
        for record in records:
            results.append({
                "id": record.get("id"),
                "content": record.get("content", ""),
                "score": record.get("score", 0.0),
                "metadata": {
                    "document_id": record.get("document_id"),
                    "document_name": record.get("document_name"),
                    "word_count": record.get("word_count"),
                    "tokens": record.get("tokens")
                },
                "source": "dify"
            })
        
        return results
