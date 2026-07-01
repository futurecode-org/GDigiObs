"""Dify 知识库 API 客户端"""
import logging
import json
from typing import Dict, Optional, List
from pathlib import Path

import httpx

from core.security import decrypt_api_key
from model.dify import DifyProvider

logger = logging.getLogger(__name__)


class DifyKnowledgeBaseClient:
    """Dify 知识库 API 客户端
    
    封装 Dify 的 Dataset / Document / Retrieve 相关 API
    """
    
    def __init__(self, provider: DifyProvider):
        self.provider = provider
        self.base_url = provider.base_url.rstrip("/")
        self.api_key = decrypt_api_key(provider.api_key_encrypted)
        self.headers = {
            "Authorization": f"Bearer {self.api_key}"
        }
    
    async def create_dataset(self, name: str, description: str = "", 
                             indexing_technique: str = "high_quality",
                             embedding_model: str = None,
                             embedding_model_provider: str = None) -> Optional[str]:
        """创建知识库（Dataset），返回 dataset_id"""
        try:
            url = f"{self.base_url}/datasets"
            payload = {
                "name": name,
                "description": description,
                "indexing_technique": indexing_technique,
                "permission": "only_me",
                "provider": "vendor"
            }
            if embedding_model:
                payload["embedding_model"] = embedding_model
            if embedding_model_provider:
                payload["embedding_model_provider"] = embedding_model_provider
            
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(url, json=payload, headers=self.headers)
                resp.raise_for_status()
                data = resp.json()
                dataset_id = data.get("id")
                logger.info(f"Dify Dataset 创建成功: {dataset_id}")
                return dataset_id
        
        except Exception as e:
            logger.error(f"Dify Dataset 创建失败: {e}")
            return None
    
    async def delete_dataset(self, dataset_id: str) -> bool:
        """删除知识库"""
        try:
            url = f"{self.base_url}/datasets/{dataset_id}"
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.delete(url, headers=self.headers)
                if resp.status_code == 204 or resp.status_code == 200:
                    logger.info(f"Dify Dataset 删除成功: {dataset_id}")
                    return True
                logger.warning(f"Dify Dataset 删除返回: {resp.status_code}")
                return False
        
        except Exception as e:
            logger.error(f"Dify Dataset 删除失败: {e}")
            return False
    
    async def upload_document_by_file(self, dataset_id: str, file_path: str, 
                                       process_rule: Dict = None,
                                       indexing_technique: str = "high_quality") -> Optional[Dict]:
        """通过文件上传文档"""
        try:
            url = f"{self.base_url}/datasets/{dataset_id}/document/create-by-file"
            
            data_payload = {
                "indexing_technique": indexing_technique,
                "doc_form": "text_model",
                "process_rule": {
                    "mode": "automatic",
                    "rules": {
                        "pre_processing_rules": [
                            {"id": "remove_extra_spaces", "enabled": True},
                            {"id": "remove_urls_emails", "enabled": True}
                        ],
                        "segmentation": {
                            "separator": "\n",
                            "max_tokens": 1000,
                            "chunk_overlap": 0
                        }
                    }
                }
            }
            if process_rule:
                data_payload["process_rule"] = process_rule
            
            async with httpx.AsyncClient(timeout=120) as client:
                with open(file_path, "rb") as f:
                    files = {"file": (Path(file_path).name, f, "application/octet-stream")}
                    form_data = {"data": json.dumps(data_payload)}
                    
                    resp = await client.post(
                        url, 
                        files=files, 
                        data=form_data,
                        headers={"Authorization": f"Bearer {self.api_key}"}
                    )
                    resp.raise_for_status()
                    result = resp.json()
                    logger.info(f"Dify 文档上传成功: dataset={dataset_id}, doc={result.get('document', {}).get('id')}")
                    return result
        
        except Exception as e:
            # 尝试获取详细的错误响应
            error_detail = str(e)
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_body = e.response.json()
                    error_detail = f"{error_detail} | Response: {json.dumps(error_body)}"
                except:
                    error_detail = f"{error_detail} | Response text: {e.response.text}"
            logger.error(f"Dify 文档上传失败: {error_detail}")
            return None
    
    async def upload_document_by_text(self, dataset_id: str, name: str, text: str,
                                        process_rule: Dict = None) -> Optional[Dict]:
        """通过文本上传文档"""
        try:
            url = f"{self.base_url}/datasets/{dataset_id}/document/create-by-text"
            
            payload = {
                "name": name,
                "text": text,
                "indexing_technique": "high_quality",
                "doc_form": "text_model"
            }
            if process_rule:
                payload["process_rule"] = process_rule
            
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, json=payload, headers=self.headers)
                resp.raise_for_status()
                result = resp.json()
                logger.info(f"Dify 文本上传成功: dataset={dataset_id}, doc={result.get('document', {}).get('id')}")
                return result
        
        except Exception as e:
            logger.error(f"Dify 文本上传失败: {e}")
            return None
    
    async def list_documents(self, dataset_id: str, page: int = 1, limit: int = 20) -> List[Dict]:
        """获取文档列表"""
        try:
            url = f"{self.base_url}/datasets/{dataset_id}/documents"
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url, params={"page": page, "limit": limit}, headers=self.headers)
                resp.raise_for_status()
                data = resp.json()
                return data.get("data", [])
        
        except Exception as e:
            logger.error(f"Dify 文档列表获取失败: {e}")
            return []
    
    async def delete_document(self, dataset_id: str, document_id: str) -> bool:
        """删除文档"""
        try:
            url = f"{self.base_url}/datasets/{dataset_id}/documents/{document_id}"
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.delete(url, headers=self.headers)
                if resp.status_code in (204, 200):
                    logger.info(f"Dify 文档删除成功: {document_id}")
                    return True
                return False
        
        except Exception as e:
            logger.error(f"Dify 文档删除失败: {e}")
            return False
    
    async def retrieve_chunks(self, dataset_id: str, query: str, 
                              retrieval_model: Dict = None,
                              top_k: int = 10) -> List[Dict]:
        """检索知识库分片"""
        try:
            url = f"{self.base_url}/datasets/{dataset_id}/retrieve"
            
            if retrieval_model is None:
                retrieval_model = {
                    "search_method": "semantic_search",
                    "reranking_enable": False,
                    "top_k": top_k,
                    "score_threshold_enabled": False
                }
            
            payload = {
                "query": query,
                "retrieval_model": retrieval_model
            }
            
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(url, json=payload, headers=self.headers)
                resp.raise_for_status()
                data = resp.json()
                records = data.get("records", [])
                
                # 简化返回格式
                results = []
                for record in records:
                    segment = record.get("segment", {})
                    results.append({
                        "id": segment.get("id"),
                        "content": segment.get("content", ""),
                        "score": record.get("score", 0.0),
                        "document_id": segment.get("document_id"),
                        "document_name": segment.get("document", {}).get("name", ""),
                        "word_count": segment.get("word_count", 0),
                        "tokens": segment.get("tokens", 0),
                    })
                return results
        
        except Exception as e:
            logger.error(f"Dify 检索失败: {e}")
            return []
    
    async def get_available_models(self, model_type: str = "text-embedding") -> List[Dict]:
        """获取Dify可用模型列表（embedding/rerank/llm）"""
        try:
            url = f"{self.base_url}/workspaces/current/models/model-types/{model_type}"
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url, headers=self.headers)
                resp.raise_for_status()
                data = resp.json()
                return data.get("data", [])
        except Exception as e:
            logger.error(f"Dify 获取可用模型失败: {e}")
            return []
    
    async def list_datasets(self, page: int = 1, limit: int = 20) -> Dict:
        """获取Dify知识库列表"""
        try:
            url = f"{self.base_url}/datasets"
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url, params={"page": page, "limit": limit}, headers=self.headers)
                resp.raise_for_status()
                return resp.json()
        except Exception as e:
            logger.error(f"Dify 获取知识库列表失败: {e}")
            return {}

    async def get_dataset(self, dataset_id: str) -> Optional[Dict]:
        """获取知识库详情"""
        try:
            url = f"{self.base_url}/datasets/{dataset_id}"
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url, headers=self.headers)
                resp.raise_for_status()
                return resp.json()
        
        except Exception as e:
            logger.error(f"Dify Dataset 获取失败: {e}")
            return None
