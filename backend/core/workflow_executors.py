"""工作流节点执行器模块"""
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime

logger = logging.getLogger(__name__)


class WorkflowNodeResult:
    """工作流节点执行结果"""
    def __init__(self):
        self.success: bool = True
        self.error_message: str = ""
        self.output_data: Dict = {}
        self.node_id: str = ""
        self.execution_time: float = 0
        self.next_nodes: List[str] = []


class BaseWorkflowNodeExecutor(ABC):
    """工作流节点执行器基类"""
    
    NODE_TYPE = ""
    
    def __init__(self, node_config: Dict, ctx: Dict):
        self.node_config = node_config
        self.ctx = ctx
        self.result = WorkflowNodeResult()
        self.result.node_id = node_config.get("id", "")
    
    @abstractmethod
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        """执行节点"""
        pass
    
    def _start_execution(self):
        """记录执行开始时间"""
        self._start_time = datetime.now()
    
    def _end_execution(self):
        """记录执行结束时间"""
        elapsed = (datetime.now() - self._start_time).total_seconds()
        self.result.execution_time = elapsed
    
    def _success(self, output_data: Dict = None, next_nodes: List[str] = None):
        """标记执行成功"""
        self.result.success = True
        if output_data:
            self.result.output_data = output_data
        if next_nodes:
            self.result.next_nodes = next_nodes
        self._end_execution()
        return self.result
    
    def _fail(self, error_message: str):
        """标记执行失败"""
        self.result.success = False
        self.result.error_message = error_message
        self._end_execution()
        return self.result


class TriggerNodeExecutor(BaseWorkflowNodeExecutor):
    """触发器节点执行器"""
    
    NODE_TYPE = "trigger"
    
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        self._start_execution()
        
        try:
            trigger_type = self.node_config.get("trigger_type", "manual")
            trigger_config = self.node_config.get("config", {})
            
            output_data = {
                "trigger_type": trigger_type,
                "trigger_time": datetime.now().isoformat(),
                "trigger_config": trigger_config,
                "input_data": input_data
            }
            
            logger.info(f"触发器节点执行: node_id={self.result.node_id}, trigger_type={trigger_type}")
            return self._success(output_data)
        
        except Exception as e:
            return self._fail(f"触发器节点执行失败: {str(e)}")


class CollectNodeExecutor(BaseWorkflowNodeExecutor):
    """采集节点执行器"""
    
    NODE_TYPE = "collect"
    
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        self._start_execution()
        
        try:
            platform = self.node_config.get("platform")
            config = self.node_config.get("config", {})
            
            output_data = {
                "platform": platform,
                "config": config,
                "collected_count": 0,
                "items": []
            }
            
            logger.info(f"采集节点执行: node_id={self.result.node_id}, platform={platform}")
            return self._success(output_data)
        
        except Exception as e:
            return self._fail(f"采集节点执行失败: {str(e)}")


class CleanNodeExecutor(BaseWorkflowNodeExecutor):
    """清洗节点执行器"""
    
    NODE_TYPE = "clean"
    
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        self._start_execution()
        
        try:
            rules = self.node_config.get("rules", [])
            clean_type = self.node_config.get("clean_type", "deduplication")
            
            cleaned_count = 0
            cleaned_items = []
            
            if input_data.get("items"):
                for item in input_data["items"]:
                    cleaned_item = item
                    cleaned_count += 1
                    cleaned_items.append(cleaned_item)
            
            output_data = {
                "clean_type": clean_type,
                "rules": rules,
                "cleaned_count": cleaned_count,
                "items": cleaned_items
            }
            
            logger.info(f"清洗节点执行: node_id={self.result.node_id}, cleaned_count={cleaned_count}")
            return self._success(output_data)
        
        except Exception as e:
            return self._fail(f"清洗节点执行失败: {str(e)}")


class AnalysisNodeExecutor(BaseWorkflowNodeExecutor):
    """分析节点执行器"""
    
    NODE_TYPE = "analysis"
    
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        self._start_execution()
        
        try:
            analysis_type = self.node_config.get("analysis_type", "trend")
            config = self.node_config.get("config", {})
            
            output_data = {
                "analysis_type": analysis_type,
                "config": config,
                "result": {},
                "summary": ""
            }
            
            logger.info(f"分析节点执行: node_id={self.result.node_id}, analysis_type={analysis_type}")
            return self._success(output_data)
        
        except Exception as e:
            return self._fail(f"分析节点执行失败: {str(e)}")


class ModelNodeExecutor(BaseWorkflowNodeExecutor):
    """模型调用节点执行器"""
    
    NODE_TYPE = "model"
    
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        self._start_execution()
        
        try:
            model_id = self.node_config.get("model_id")
            model_type = self.node_config.get("model_type", "llm")
            config = self.node_config.get("config", {})
            
            output_data = {
                "model_id": model_id,
                "model_type": model_type,
                "response": "",
                "token_usage": {}
            }
            
            logger.info(f"模型调用节点执行: node_id={self.result.node_id}, model_id={model_id}")
            return self._success(output_data)
        
        except Exception as e:
            return self._fail(f"模型调用节点执行失败: {str(e)}")


class SkillNodeExecutor(BaseWorkflowNodeExecutor):
    """技能调用节点执行器"""
    
    NODE_TYPE = "skill"
    
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        self._start_execution()
        
        try:
            skill_id = self.node_config.get("skill_id")
            skill_name = self.node_config.get("skill_name", "")
            
            output_data = {
                "skill_id": skill_id,
                "skill_name": skill_name,
                "result": {}
            }
            
            logger.info(f"技能调用节点执行: node_id={self.result.node_id}, skill_name={skill_name}")
            return self._success(output_data)
        
        except Exception as e:
            return self._fail(f"技能调用节点执行失败: {str(e)}")


class KbSearchNodeExecutor(BaseWorkflowNodeExecutor):
    """知识库搜索节点执行器"""
    
    NODE_TYPE = "kb_search"
    
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        self._start_execution()
        
        try:
            kb_ids = self.node_config.get("kb_ids", [])
            top_k = self.node_config.get("top_k", 5)
            
            output_data = {
                "kb_ids": kb_ids,
                "top_k": top_k,
                "results": [],
                "total_count": 0
            }
            
            logger.info(f"知识库搜索节点执行: node_id={self.result.node_id}, kb_count={len(kb_ids)}")
            return self._success(output_data)
        
        except Exception as e:
            return self._fail(f"知识库搜索节点执行失败: {str(e)}")


class ConditionNodeExecutor(BaseWorkflowNodeExecutor):
    """条件判断节点执行器"""
    
    NODE_TYPE = "condition"
    
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        self._start_execution()
        
        try:
            conditions = self.node_config.get("conditions", [])
            true_node = self.node_config.get("true_node")
            false_node = self.node_config.get("false_node")
            
            result = True
            for condition in conditions:
                field = condition.get("field")
                operator = condition.get("operator")
                value = condition.get("value")
                
                if field in input_data:
                    field_value = input_data[field]
                    if operator == "eq" and field_value != value:
                        result = False
                    elif operator == "gt" and field_value <= value:
                        result = False
                    elif operator == "lt" and field_value >= value:
                        result = False
                    elif operator == "contains" and value not in str(field_value):
                        result = False
            
            next_nodes = [true_node] if result else [false_node]
            
            output_data = {
                "condition_result": result,
                "conditions": conditions,
                "matched_condition": result
            }
            
            logger.info(f"条件判断节点执行: node_id={self.result.node_id}, result={result}")
            return self._success(output_data, next_nodes)
        
        except Exception as e:
            return self._fail(f"条件判断节点执行失败: {str(e)}")


class ManualReviewNodeExecutor(BaseWorkflowNodeExecutor):
    """人工审核节点执行器"""
    
    NODE_TYPE = "manual_review"
    
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        self._start_execution()
        
        try:
            reviewers = self.node_config.get("reviewers", [])
            approval_required = self.node_config.get("approval_required", 1)
            
            output_data = {
                "reviewers": reviewers,
                "approval_required": approval_required,
                "status": "pending",
                "input_data": input_data
            }
            
            logger.info(f"人工审核节点执行: node_id={self.result.node_id}, reviewers={len(reviewers)}")
            return self._success(output_data)
        
        except Exception as e:
            return self._fail(f"人工审核节点执行失败: {str(e)}")


class NotifyNodeExecutor(BaseWorkflowNodeExecutor):
    """通知节点执行器"""
    
    NODE_TYPE = "notify"
    
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        self._start_execution()
        
        try:
            notify_type = self.node_config.get("notify_type", "system")
            recipients = self.node_config.get("recipients", [])
            template = self.node_config.get("template", "")
            
            output_data = {
                "notify_type": notify_type,
                "recipients": recipients,
                "template": template,
                "sent_count": len(recipients)
            }
            
            logger.info(f"通知节点执行: node_id={self.result.node_id}, notify_type={notify_type}, sent_count={len(recipients)}")
            return self._success(output_data)
        
        except Exception as e:
            return self._fail(f"通知节点执行失败: {str(e)}")


class EndNodeExecutor(BaseWorkflowNodeExecutor):
    """结束节点执行器"""
    
    NODE_TYPE = "end"
    
    async def execute(self, input_data: Dict) -> WorkflowNodeResult:
        self._start_execution()
        
        try:
            end_status = self.node_config.get("end_status", "success")
            
            output_data = {
                "end_status": end_status,
                "final_data": input_data
            }
            
            logger.info(f"结束节点执行: node_id={self.result.node_id}, end_status={end_status}")
            return self._success(output_data)
        
        except Exception as e:
            return self._fail(f"结束节点执行失败: {str(e)}")


class WorkflowExecutorFactory:
    """工作流执行器工厂"""
    
    EXECUTORS = {
        "trigger": TriggerNodeExecutor,
        "collect": CollectNodeExecutor,
        "clean": CleanNodeExecutor,
        "analysis": AnalysisNodeExecutor,
        "model": ModelNodeExecutor,
        "skill": SkillNodeExecutor,
        "kb_search": KbSearchNodeExecutor,
        "condition": ConditionNodeExecutor,
        "manual_review": ManualReviewNodeExecutor,
        "notify": NotifyNodeExecutor,
        "end": EndNodeExecutor
    }
    
    @classmethod
    def create_executor(cls, node_config: Dict, ctx: Dict) -> Optional[BaseWorkflowNodeExecutor]:
        """创建节点执行器"""
        node_type = node_config.get("type")
        
        if node_type not in cls.EXECUTORS:
            logger.error(f"未知的节点类型: {node_type}")
            return None
        
        executor_class = cls.EXECUTORS[node_type]
        return executor_class(node_config, ctx)
    
    @classmethod
    def get_supported_node_types(cls) -> List[str]:
        """获取支持的节点类型列表"""
        return list(cls.EXECUTORS.keys())