"""数字员工执行引擎模块"""
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


class AgentExecutionResult:
    """数字员工执行结果"""
    def __init__(self):
        self.success: bool = True
        self.error_message: str = ""
        self.response: str = ""
        self.conversation_id: Optional[str] = None
        self.message_id: Optional[str] = None
        self.metadata: Dict = {}
        self.token_usage: Dict = {}


class BaseAgentEngine(ABC):
    """数字员工执行引擎基类"""
    
    ENGINE_TYPE = ""
    
    def __init__(self, agent_config: Dict, ctx: Dict):
        self.agent_config = agent_config
        self.ctx = ctx
        self.result = AgentExecutionResult()
    
    @abstractmethod
    async def execute(self, prompt: str, conversation_id: str = None, **kwargs) -> AgentExecutionResult:
        """执行数字员工"""
        pass
    
    def _success(self, response: str, **kwargs):
        """标记执行成功"""
        self.result.success = True
        self.result.response = response
        
        if kwargs.get("conversation_id"):
            self.result.conversation_id = kwargs["conversation_id"]
        if kwargs.get("message_id"):
            self.result.message_id = kwargs["message_id"]
        if kwargs.get("metadata"):
            self.result.metadata = kwargs["metadata"]
        if kwargs.get("token_usage"):
            self.result.token_usage = kwargs["token_usage"]
        
        return self.result
    
    def _fail(self, error_message: str):
        """标记执行失败"""
        self.result.success = False
        self.result.error_message = error_message
        return self.result


class NativeAgentEngine(BaseAgentEngine):
    """原生执行引擎"""
    
    ENGINE_TYPE = "native"
    
    async def execute(self, prompt: str, conversation_id: str = None, **kwargs) -> AgentExecutionResult:
        try:
            model_id = self.agent_config.get("model_id")
            system_prompt = self.agent_config.get("system_prompt", "")
            
            response = ""
            
            logger.info(f"原生引擎执行: agent_id={self.agent_config.get('id')}, model_id={model_id}")
            return self._success(response)
        
        except Exception as e:
            return self._fail(f"原生引擎执行失败: {str(e)}")


class DifyAgentEngine(BaseAgentEngine):
    """Dify执行引擎"""
    
    ENGINE_TYPE = "dify"
    
    async def execute(self, prompt: str, conversation_id: str = None, **kwargs) -> AgentExecutionResult:
        try:
            dify_app_id = self.agent_config.get("dify_app_id")
            response_mode = self.agent_config.get("response_mode", "blocking")
            
            from core.dify_client import DifyClient
            from dao.dify_dao import get_dify_app_by_id
            
            db = kwargs.get("db")
            if not db:
                return self._fail("数据库连接未提供")
            
            dify_app = get_dify_app_by_id(db, dify_app_id)
            if not dify_app:
                return self._fail(f"Dify应用不存在: {dify_app_id}")
            
            provider = dify_app.provider
            client = DifyClient(provider)
            
            user_identifier = DifyClient.build_user_identifier(
                self.ctx.get("tenant_id"),
                self.ctx.get("user_id")
            )
            
            inputs = kwargs.get("inputs", {})
            inputs["query"] = prompt
            
            invoke_result = await client.invoke(
                dify_app, inputs,
                conversation_id=conversation_id,
                user=user_identifier,
                response_mode=response_mode
            )
            
            if invoke_result.success:
                logger.info(f"Dify引擎执行成功: agent_id={self.agent_config.get('id')}, app_id={dify_app_id}")
                return self._success(
                    invoke_result.answer,
                    conversation_id=invoke_result.conversation_id,
                    message_id=invoke_result.message_id,
                    metadata=invoke_result.metadata or {},
                    token_usage=invoke_result.token_usage or {}
                )
            else:
                return self._fail(invoke_result.error_message)
        
        except Exception as e:
            return self._fail(f"Dify引擎执行失败: {str(e)}")


class HybridAgentEngine(BaseAgentEngine):
    """混合执行引擎"""
    
    ENGINE_TYPE = "hybrid"
    
    async def execute(self, prompt: str, conversation_id: str = None, **kwargs) -> AgentExecutionResult:
        try:
            rules = self.agent_config.get("rules", [])
            
            for rule in rules:
                condition_type = rule.get("condition_type")
                engine_type = rule.get("engine_type")
                keywords = rule.get("keywords", [])
                
                if condition_type == "contains_any":
                    if any(keyword in prompt for keyword in keywords):
                        engine = AgentEngineFactory.create_engine(
                            {"engine_type": engine_type, **self.agent_config},
                            self.ctx
                        )
                        if engine:
                            return await engine.execute(prompt, conversation_id, **kwargs)
            
            default_engine = AgentEngineFactory.create_engine(
                {"engine_type": "native", **self.agent_config},
                self.ctx
            )
            
            if default_engine:
                logger.info(f"混合引擎执行(默认): agent_id={self.agent_config.get('id')}")
                return await default_engine.execute(prompt, conversation_id, **kwargs)
            
            return self._fail("未找到合适的执行引擎")
        
        except Exception as e:
            return self._fail(f"混合引擎执行失败: {str(e)}")


class AgentEngineFactory:
    """数字员工执行引擎工厂"""
    
    ENGINES = {
        "native": NativeAgentEngine,
        "dify": DifyAgentEngine,
        "hybrid": HybridAgentEngine
    }
    
    @classmethod
    def create_engine(cls, agent_config: Dict, ctx: Dict) -> Optional[BaseAgentEngine]:
        """创建执行引擎"""
        engine_type = agent_config.get("engine_type", "native")
        
        if engine_type not in cls.ENGINES:
            logger.error(f"未知的引擎类型: {engine_type}")
            return None
        
        engine_class = cls.ENGINES[engine_type]
        return engine_class(agent_config, ctx)
    
    @classmethod
    def get_supported_engine_types(cls) -> list:
        """获取支持的引擎类型列表"""
        return list(cls.ENGINES.keys())