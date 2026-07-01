"""Chroma 向量数据库客户端"""
import logging
import uuid
from typing import List, Dict, Optional

import chromadb
from chromadb.config import Settings as ChromaSettings

logger = logging.getLogger(__name__)


class ChromaClient:
    """Chroma 客户端封装，支持 HTTP 模式连接远程 Chroma 服务器"""
    
    def __init__(self, host: str, port: int = 8000, collection_prefix: str = "kb"):
        self.host = host
        self.port = port
        self.collection_prefix = collection_prefix
        self._client = None
    
    def _get_client(self):
        """获取或创建 Chroma 客户端"""
        if self._client is None:
            try:
                self._client = chromadb.HttpClient(
                    host=self.host,
                    port=self.port,
                    settings=ChromaSettings(allow_reset=True, anonymized_telemetry=False)
                )
                logger.info(f"Chroma HTTP 客户端连接成功: {self.host}:{self.port}")
            except Exception as e:
                logger.error(f"Chroma 连接失败: {self.host}:{self.port}, error={e}")
                raise
        return self._client
    
    def _collection_name(self, tenant_id: int, kb_id: int) -> str:
        """生成 collection 名称，包含租户前缀确保隔离"""
        return f"{self.collection_prefix}_t{tenant_id}_kb{kb_id}"
    
    def create_collection(self, tenant_id: int, kb_id: int) -> Optional[str]:
        """创建 Collection，返回 collection 名称"""
        try:
            client = self._get_client()
            name = self._collection_name(tenant_id, kb_id)
            client.get_or_create_collection(name=name)
            logger.info(f"Chroma collection 创建/获取成功: {name}")
            return name
        except Exception as e:
            logger.error(f"Chroma collection 创建失败: {e}")
            return None
    
    def delete_collection(self, tenant_id: int, kb_id: int) -> bool:
        """删除 Collection"""
        try:
            client = self._get_client()
            name = self._collection_name(tenant_id, kb_id)
            client.delete_collection(name=name)
            logger.info(f"Chroma collection 删除成功: {name}")
            return True
        except Exception as e:
            logger.error(f"Chroma collection 删除失败: {e}")
            return False
    
    def add_documents(self, tenant_id: int, kb_id: int, documents: List[str], 
                      embeddings: List[List[float]], metadatas: List[Dict], 
                      ids: Optional[List[str]] = None) -> bool:
        """批量添加文档到 Collection"""
        try:
            client = self._get_client()
            name = self._collection_name(tenant_id, kb_id)
            collection = client.get_or_create_collection(name=name)
            
            if ids is None:
                ids = [str(uuid.uuid4()) for _ in range(len(documents))]
            
            collection.add(
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas,
                ids=ids
            )
            logger.info(f"Chroma 添加文档成功: collection={name}, count={len(documents)}")
            return True
        except Exception as e:
            logger.error(f"Chroma 添加文档失败: {e}")
            return False
    
    def query(self, tenant_id: int, kb_id: int, query_embedding: List[float], 
              top_k: int = 10, where: Optional[Dict] = None) -> List[Dict]:
        """向量检索"""
        try:
            client = self._get_client()
            name = self._collection_name(tenant_id, kb_id)
            collection = client.get_collection(name=name)
            
            results = collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k,
                where=where
            )
            
            # 整理结果
            output = []
            if results["ids"] and len(results["ids"]) > 0:
                for i, doc_id in enumerate(results["ids"][0]):
                    output.append({
                        "id": doc_id,
                        "content": results["documents"][0][i] if results["documents"] else "",
                        "metadata": results["metadatas"][0][i] if results["metadatas"] else {},
                        "distance": results["distances"][0][i] if results["distances"] else 0.0,
                    })
            return output
        except Exception as e:
            logger.error(f"Chroma 查询失败: {e}")
            return []
    
    def delete_by_ids(self, tenant_id: int, kb_id: int, ids: List[str]) -> bool:
        """根据 ID 删除文档"""
        try:
            client = self._get_client()
            name = self._collection_name(tenant_id, kb_id)
            collection = client.get_collection(name=name)
            collection.delete(ids=ids)
            logger.info(f"Chroma 删除文档成功: collection={name}, count={len(ids)}")
            return True
        except Exception as e:
            logger.error(f"Chroma 删除文档失败: {e}")
            return False
    
    def count(self, tenant_id: int, kb_id: int) -> int:
        """获取 Collection 文档数量"""
        try:
            client = self._get_client()
            name = self._collection_name(tenant_id, kb_id)
            collection = client.get_collection(name=name)
            return collection.count()
        except Exception as e:
            logger.error(f"Chroma 获取数量失败: {e}")
            return 0
    
    def test_connection(self) -> bool:
        """测试 Chroma 连接"""
        try:
            client = self._get_client()
            client.heartbeat()
            return True
        except Exception as e:
            logger.error(f"Chroma 连接测试失败: {e}")
            return False
