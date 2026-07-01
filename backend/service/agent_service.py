"""数字员工业务逻辑层"""
import logging
import asyncio
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime

from dao.agent_dao import (
    get_agents, count_agents, get_agent_by_id, create_agent,
    update_agent, delete_agent, create_agent_run, update_agent_run,
    get_agent_runs, count_agent_runs, get_agent_run_by_id
)
from core.exceptions import NotFoundException, ForbiddenException
from core.dependencies import RequestContext
from core.agent_engines import AgentEngineFactory, AgentExecutionResult

logger = logging.getLogger(__name__)


def get_agents_service(db: Session, ctx: RequestContext, page: int = 1,
                       page_size: int = 20) -> Dict:
    """获取数字员工列表"""
    agents = get_agents(db, ctx.tenant_id, None, page, page_size)
    total = count_agents(db, ctx.tenant_id)
    
    agent_list = []
    for agent in agents:
        agent_list.append({
            "id": agent.id,
            "name": agent.name,
            "role_description": agent.role_description,
            "visibility": agent.visibility,
            "status": agent.status,
            "created_at": agent.created_at
        })
    
    return {
        "items": agent_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_agent_detail_service(db: Session, ctx: RequestContext, agent_id: int) -> Dict:
    """获取数字员工详情"""
    agent = get_agent_by_id(db, agent_id)
    if not agent:
        raise NotFoundException("数字员工不存在")
    
    if not ctx.is_super_admin and agent.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此数字员工")
    
    return {
        "id": agent.id,
        "name": agent.name,
        "avatar_file_id": agent.avatar_file_id,
        "role_description": agent.role_description,
        "system_prompt": agent.system_prompt,
        "model_id": agent.model_id,
        "skill_ids": agent.skill_ids,
        "knowledge_base_ids": agent.knowledge_base_ids,
        "workflow_ids": agent.workflow_ids,
        "trigger_config": agent.trigger_config,
        "push_config": agent.push_config,
        "visibility": agent.visibility,
        "status": agent.status,
        "created_at": agent.created_at
    }


def create_agent_service(db: Session, ctx: RequestContext, name: str, **kwargs) -> Dict:
    """创建数字员工"""
    agent = create_agent(db, ctx.tenant_id, ctx.user_id, name, **kwargs)
    
    logger.info(f"创建数字员工: agent_id={agent.id}, name={name}")
    
    return {
        "id": agent.id,
        "name": agent.name,
        "visibility": agent.visibility,
        "status": agent.status,
        "created_at": agent.created_at
    }


def update_agent_service(db: Session, ctx: RequestContext, agent_id: int, **kwargs) -> Dict:
    """更新数字员工"""
    agent = get_agent_by_id(db, agent_id)
    if not agent:
        raise NotFoundException("数字员工不存在")
    
    if not ctx.is_super_admin and agent.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此数字员工")
    
    if agent.owner_id != ctx.user_id:
        raise ForbiddenException("无权修改此数字员工")
    
    agent = update_agent(db, agent_id, **kwargs)
    
    return {
        "id": agent.id,
        "name": agent.name,
        "updated_at": agent.updated_at
    }


def delete_agent_service(db: Session, ctx: RequestContext, agent_id: int):
    """删除数字员工"""
    agent = get_agent_by_id(db, agent_id)
    if not agent:
        raise NotFoundException("数字员工不存在")
    
    if not ctx.is_super_admin and agent.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除此数字员工")
    
    if agent.owner_id != ctx.user_id:
        raise ForbiddenException("无权删除此数字员工")
    
    delete_agent(db, agent_id)
    logger.info(f"删除数字员工: agent_id={agent_id}")


def run_agent_service(db: Session, ctx: RequestContext, agent_id: int, input_data: dict = None) -> Dict:
    """执行数字员工"""
    agent = get_agent_by_id(db, agent_id)
    if not agent:
        raise NotFoundException("数字员工不存在")
    
    if not ctx.is_super_admin and agent.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权执行此数字员工")
    
    run = create_agent_run(db, ctx.tenant_id, agent_id, "manual", ctx.user_id, input_data)
    
    # 在后台线程中执行异步任务（避免 no running event loop 错误）
    import threading
    def run_async():
        asyncio.run(_execute_agent_async(db, run.id, agent, ctx, input_data or {}))
    thread = threading.Thread(target=run_async, daemon=True)
    thread.start()
    
    logger.info(f"执行数字员工: agent_id={agent_id}, run_id={run.id}")
    
    return {
        "run_id": run.id,
        "agent_id": run.agent_id,
        "status": run.status,
        "started_at": run.started_at
    }


async def _execute_agent_async(db: Session, run_id: int, agent, ctx: RequestContext, input_data: Dict):
    """异步执行数字员工"""
    try:
        agent_config = {
            "id": agent.id,
            "name": agent.name,
            "model_id": agent.model_id,
            "system_prompt": agent.system_prompt,
            "skill_ids": agent.skill_ids,
            "knowledge_base_ids": agent.knowledge_base_ids,
            "workflow_ids": agent.workflow_ids,
            "engine_type": getattr(agent, 'engine_type', 'native'),
            "dify_app_id": getattr(agent, 'dify_app_id', None),
            "response_mode": getattr(agent, 'response_mode', 'blocking'),
            "rules": getattr(agent, 'rules', []),
            "trigger_config": agent.trigger_config,
            "push_config": agent.push_config
        }
        
        engine = AgentEngineFactory.create_engine(agent_config, {
            "tenant_id": ctx.tenant_id,
            "user_id": ctx.user_id
        })
        
        if not engine:
            update_agent_run(db, run_id, status="failed", error_message="未找到合适的执行引擎")
            return
        
        prompt = input_data.get("prompt", "")
        conversation_id = input_data.get("conversation_id")
        
        result: AgentExecutionResult = await engine.execute(
            prompt, conversation_id, db=db, inputs=input_data.get("inputs", {})
        )
        
        if result.success:
            update_agent_run(db, run_id, status="completed", output_data={
                "response": result.response,
                "conversation_id": result.conversation_id,
                "message_id": result.message_id,
                "metadata": result.metadata,
                "token_usage": result.token_usage
            })
            logger.info(f"数字员工执行完成: agent_id={agent.id}, run_id={run_id}")
        else:
            update_agent_run(db, run_id, status="failed", error_message=result.error_message)
            logger.error(f"数字员工执行失败: agent_id={agent.id}, run_id={run_id}, error={result.error_message}")
    
    except Exception as e:
        update_agent_run(db, run_id, status="failed", error_message=str(e))
        logger.error(f"数字员工执行异常: agent_id={agent.id}, run_id={run_id}, error={str(e)}")


def get_agent_runs_service(db: Session, ctx: RequestContext, agent_id: int = None,
                           page: int = 1, page_size: int = 20) -> Dict:
    """获取执行记录列表"""
    runs = get_agent_runs(db, ctx.tenant_id, agent_id, page, page_size)
    total = count_agent_runs(db, ctx.tenant_id, agent_id)
    
    run_list = []
    for run in runs:
        run_list.append({
            "id": run.id,
            "agent_id": run.agent_id,
            "trigger_type": run.trigger_type,
            "status": run.status,
            "started_at": run.started_at,
            "finished_at": run.finished_at
        })
    
    return {
        "items": run_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_agent_run_detail_service(db: Session, ctx: RequestContext, run_id: int) -> Dict:
    """获取执行记录详情"""
    run = get_agent_run_by_id(db, run_id)
    if not run:
        raise NotFoundException("执行记录不存在")
    
    if not ctx.is_super_admin and run.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此执行记录")
    
    return {
        "id": run.id,
        "agent_id": run.agent_id,
        "trigger_type": run.trigger_type,
        "input_data": run.input_data,
        "output_data": run.output_data,
        "status": run.status,
        "started_at": run.started_at,
        "finished_at": run.finished_at,
        "error_message": run.error_message,
        "steps_log": run.steps_log
    }