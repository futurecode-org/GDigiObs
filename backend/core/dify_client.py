"""Dify API 客户端"""
import asyncio
import logging
import json
from typing import Dict, Optional, Any, AsyncGenerator
from datetime import datetime

import httpx

from core.security import decrypt_api_key
from model.dify import DifyProvider, DifyApp

logger = logging.getLogger(__name__)


class DifyInvokeResult:
    """Dify 调用结果"""
    def __init__(self):
        self.answer: str = ""
        self.conversation_id: Optional[str] = None
        self.task_id: Optional[str] = None
        self.message_id: Optional[str] = None
        self.metadata: Optional[Dict] = None
        self.token_usage: Optional[Dict] = None
        self.error_message: Optional[str] = None
        self.success: bool = True


class DifyClient:
    """Dify API 客户端"""
    
    def __init__(self, provider: DifyProvider):
        self.provider = provider
        self.base_url = provider.base_url.rstrip("/")
        self.api_key = decrypt_api_key(provider.api_key_encrypted)
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
    
    @staticmethod
    def build_user_identifier(tenant_id: int, user_id: int) -> str:
        """构建 Dify 用户标识符"""
        return f"tenant_{tenant_id}_user_{user_id}"
    
    async def invoke(self, app: DifyApp, inputs: Dict, query: Optional[str] = None,
                     user: str = "system", conversation_id: Optional[str] = None,
                     files: Optional[list] = None, response_mode: str = "blocking") -> DifyInvokeResult:
        """统一调用 Dify API"""
        result = DifyInvokeResult()
        
        try:
            url = f"{self.base_url}{app.api_endpoint}"
            payload = self._build_payload(app, inputs, query, user, conversation_id, files, response_mode)
            
            async with httpx.AsyncClient(timeout=60) as client:
                logger.info(f"调用 Dify API: {url}, app_type: {app.app_type}, response_mode: {response_mode}")
                
                if response_mode == "streaming":
                    async with client.stream("POST", url, json=payload, headers=self.headers) as resp:
                        async for chunk in resp.aiter_text():
                            if chunk.startswith("data:"):
                                try:
                                    data = json.loads(chunk[5:])
                                    await self._process_stream_chunk(data, result)
                                except json.JSONDecodeError:
                                    pass
                else:
                    resp = await client.post(url, json=payload, headers=self.headers)
                    resp.raise_for_status()
                    data = resp.json()
                    self._process_blocking_response(data, result)
            
        except httpx.HTTPStatusError as e:
            logger.error(f"Dify API 错误: {e.response.status_code}, {e.response.text}")
            result.success = False
            result.error_message = str(e)
        except Exception as e:
            logger.error(f"Dify 调用异常: {str(e)}")
            result.success = False
            result.error_message = str(e)
        
        return result
    
    def _build_payload(self, app: DifyApp, inputs: Dict, query: Optional[str],
                       user: str, conversation_id: Optional[str],
                       files: Optional[list], response_mode: str) -> Dict:
        """构建请求体"""
        payload = {
            "inputs": inputs,
            "response_mode": response_mode,
            "user": user
        }
        
        if query:
            payload["query"] = query
        
        if conversation_id:
            payload["conversation_id"] = conversation_id
        
        if files:
            payload["files"] = files
        
        if app.default_inputs:
            payload["inputs"] = {**app.default_inputs, **inputs}
        
        return payload
    
    def _process_blocking_response(self, data: Dict, result: DifyInvokeResult):
        """处理 Blocking 响应"""
        if "answer" in data:
            result.answer = data["answer"]
        elif "outputs" in data:
            result.answer = str(data["outputs"])
        
        result.conversation_id = data.get("conversation_id")
        result.task_id = data.get("task_id")
        result.message_id = data.get("message_id")
        result.metadata = data.get("metadata")
        result.token_usage = data.get("usage") or data.get("token_usage")
    
    async def _process_stream_chunk(self, data: Dict, result: DifyInvokeResult):
        """处理 Streaming 响应块"""
        if data.get("event") == "message_end":
            result.conversation_id = data.get("conversation_id")
            result.task_id = data.get("task_id")
            result.message_id = data.get("message_id")
            result.metadata = data.get("metadata")
            result.token_usage = data.get("usage") or data.get("token_usage")
        elif data.get("event") == "error":
            result.success = False
            result.error_message = data.get("message", "")
        elif data.get("event") == "content" and data.get("answer"):
            result.answer += data["answer"]
    
    async def stream_invoke(self, app: DifyApp, inputs: Dict, query: Optional[str] = None,
                            user: str = "system", conversation_id: Optional[str] = None,
                            files: Optional[list] = None) -> AsyncGenerator[Dict, None]:
        """流式调用 Dify API，返回事件流"""
        url = f"{self.base_url}{app.api_endpoint}"
        payload = self._build_payload(app, inputs, query, user, conversation_id, files, "streaming")
        
        async with httpx.AsyncClient(timeout=60) as client:
            async with client.stream("POST", url, json=payload, headers=self.headers) as resp:
                resp.raise_for_status()
                
                async for chunk in resp.aiter_text():
                    if chunk.startswith("data:"):
                        try:
                            data = json.loads(chunk[5:])
                            yield data
                        except json.JSONDecodeError:
                            pass
    
    async def test_connection(self) -> bool:
        """测试 Dify Provider 连接"""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                # 使用 Dify 的健康检查或简单 API 测试
                resp = await client.get(f"{self.base_url}/health", headers=self.headers)
                return resp.status_code == 200
        except Exception as e:
            logger.error(f"Dify 连接测试失败: {str(e)}")
            return False