"""工作流业务逻辑层"""
import logging
import asyncio
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime

from dao.workflow_dao import (
    get_workflows, count_workflows, get_workflow_by_id, create_workflow,
    update_workflow, delete_workflow, enable_workflow, disable_workflow,
    create_workflow_run, update_workflow_run, get_workflow_runs,
    get_workflow_run_by_id, create_node_log, update_node_log, get_node_logs
)
from core.exceptions import NotFoundException, ForbiddenException
from core.dependencies import RequestContext
from core.workflow_executors import WorkflowExecutorFactory, WorkflowNodeResult

logger = logging.getLogger(__name__)


def get_workflows_service(db: Session, ctx: RequestContext, status: str = None,
                          page: int = 1, page_size: int = 20) -> Dict:
    """获取工作流列表"""
    workflows = get_workflows(db, ctx.tenant_id, status, page, page_size)
    total = count_workflows(db, ctx.tenant_id)
    
    workflow_list = []
    for workflow in workflows:
        workflow_list.append({
            "id": workflow.id,
            "name": workflow.name,
            "description": workflow.description,
            "trigger_type": workflow.trigger_type,
            "status": workflow.status,
            "created_at": workflow.created_at
        })
    
    return {
        "items": workflow_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_workflow_detail_service(db: Session, ctx: RequestContext, workflow_id: int) -> Dict:
    """获取工作流详情"""
    workflow = get_workflow_by_id(db, workflow_id)
    if not workflow:
        raise NotFoundException("工作流不存在")
    
    if not ctx.is_super_admin and workflow.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此工作流")
    
    return {
        "id": workflow.id,
        "name": workflow.name,
        "description": workflow.description,
        "nodes": workflow.nodes,
        "edges": workflow.edges,
        "trigger_type": workflow.trigger_type,
        "schedule_config": workflow.schedule_config,
        "status": workflow.status,
        "created_at": workflow.created_at
    }


def create_workflow_service(db: Session, ctx: RequestContext, name: str,
                            nodes: list, edges: list, **kwargs) -> Dict:
    """创建工作流"""
    workflow = create_workflow(db, ctx.tenant_id, ctx.user_id, name, nodes, edges, **kwargs)
    
    logger.info(f"创建工作流: workflow_id={workflow.id}, name={name}")
    
    return {
        "id": workflow.id,
        "name": workflow.name,
        "trigger_type": workflow.trigger_type,
        "status": workflow.status,
        "created_at": workflow.created_at
    }


def update_workflow_service(db: Session, ctx: RequestContext, workflow_id: int, **kwargs) -> Dict:
    """更新工作流"""
    workflow = get_workflow_by_id(db, workflow_id)
    if not workflow:
        raise NotFoundException("工作流不存在")
    
    if not ctx.is_super_admin and workflow.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此工作流")
    
    if workflow.owner_id != ctx.user_id:
        raise ForbiddenException("无权修改此工作流")
    
    workflow = update_workflow(db, workflow_id, **kwargs)
    
    return {
        "id": workflow.id,
        "name": workflow.name,
        "updated_at": workflow.updated_at
    }


def delete_workflow_service(db: Session, ctx: RequestContext, workflow_id: int):
    """删除工作流"""
    workflow = get_workflow_by_id(db, workflow_id)
    if not workflow:
        raise NotFoundException("工作流不存在")
    
    if not ctx.is_super_admin and workflow.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除此工作流")
    
    if workflow.owner_id != ctx.user_id:
        raise ForbiddenException("无权删除此工作流")
    
    delete_workflow(db, workflow_id)
    logger.info(f"删除工作流: workflow_id={workflow_id}")


def enable_workflow_service(db: Session, ctx: RequestContext, workflow_id: int):
    """启用工作流"""
    workflow = get_workflow_by_id(db, workflow_id)
    if not workflow:
        raise NotFoundException("工作流不存在")
    
    if not ctx.is_super_admin and workflow.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权操作此工作流")
    
    enable_workflow(db, workflow_id)
    logger.info(f"启用工作流: workflow_id={workflow_id}")


def disable_workflow_service(db: Session, ctx: RequestContext, workflow_id: int):
    """禁用工作流"""
    workflow = get_workflow_by_id(db, workflow_id)
    if not workflow:
        raise NotFoundException("工作流不存在")
    
    if not ctx.is_super_admin and workflow.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权操作此工作流")
    
    disable_workflow(db, workflow_id)
    logger.info(f"禁用工作流: workflow_id={workflow_id}")


def run_workflow_service(db: Session, ctx: RequestContext, workflow_id: int,
                         input_data: dict = None) -> Dict:
    """执行工作流"""
    workflow = get_workflow_by_id(db, workflow_id)
    if not workflow:
        raise NotFoundException("工作流不存在")
    
    if not ctx.is_super_admin and workflow.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权执行此工作流")
    
    if workflow.status != "enabled":
        raise ForbiddenException("工作流未启用")
    
    run = create_workflow_run(db, ctx.tenant_id, workflow_id, "manual", ctx.user_id, input_data)
    
    asyncio.create_task(_execute_workflow_async(db, run.id, workflow, ctx, input_data or {}))
    
    logger.info(f"执行工作流: workflow_id={workflow_id}, run_id={run.id}")
    
    return {
        "run_id": run.id,
        "workflow_id": run.workflow_id,
        "status": run.status,
        "started_at": run.started_at
    }


async def _execute_workflow_async(db: Session, run_id: int, workflow, ctx: RequestContext, input_data: Dict):
    """异步执行工作流"""
    try:
        nodes = workflow.nodes or []
        edges = workflow.edges or []
        
        node_map = {node.get("id"): node for node in nodes}
        
        node_logs = {}
        
        current_data = input_data
        current_node_ids = _find_start_nodes(nodes, edges)
        
        while current_node_ids:
            node_id = current_node_ids.pop(0)
            node_config = node_map.get(node_id)
            
            if not node_config:
                continue
            
            node_type = node_config.get("type")
            executor = WorkflowExecutorFactory.create_executor(node_config, {
                "tenant_id": ctx.tenant_id,
                "user_id": ctx.user_id,
                "run_id": run_id
            })
            
            if not executor:
                create_node_log(db, run_id, node_id, node_type, "failed",
                               error_message=f"未知节点类型: {node_type}")
                continue
            
            create_node_log(db, run_id, node_id, node_type, "running")
            
            try:
                result: WorkflowNodeResult = await executor.execute(current_data)
                
                if result.success:
                    create_node_log(db, run_id, node_id, node_type, "success",
                                   output_data=result.output_data,
                                   execution_time=result.execution_time)
                    
                    current_data.update(result.output_data)
                    
                    next_ids = result.next_nodes if result.next_nodes else _find_next_nodes(node_id, edges)
                    current_node_ids.extend(next_ids)
                    
                    if node_type == "end":
                        break
                else:
                    create_node_log(db, run_id, node_id, node_type, "failed",
                                   error_message=result.error_message)
                    update_workflow_run(db, run_id, status="failed", error_message=result.error_message)
                    return
            
            except Exception as e:
                create_node_log(db, run_id, node_id, node_type, "failed",
                               error_message=str(e))
                logger.error(f"节点执行异常: node_id={node_id}, error={str(e)}")
        
        update_workflow_run(db, run_id, status="completed", output_data=current_data)
        logger.info(f"工作流执行完成: run_id={run_id}")
    
    except Exception as e:
        update_workflow_run(db, run_id, status="failed", error_message=str(e))
        logger.error(f"工作流执行异常: run_id={run_id}, error={str(e)}")


def _find_start_nodes(nodes: List[Dict], edges: List[Dict]) -> List[str]:
    """找到工作流的起始节点"""
    end_node_ids = {edge.get("source") for edge in edges}
    start_nodes = []
    
    for node in nodes:
        node_id = node.get("id")
        node_type = node.get("type")
        
        if node_type == "trigger" or node_id not in end_node_ids:
            start_nodes.append(node_id)
    
    return start_nodes


def _find_next_nodes(node_id: str, edges: List[Dict]) -> List[str]:
    """找到节点的下一个节点"""
    next_ids = []
    for edge in edges:
        if edge.get("source") == node_id:
            next_ids.append(edge.get("target"))
    return next_ids


def get_workflow_runs_service(db: Session, ctx: RequestContext, workflow_id: int = None,
                              page: int = 1, page_size: int = 20) -> Dict:
    """获取执行记录列表"""
    runs = get_workflow_runs(db, ctx.tenant_id, workflow_id, page, page_size)
    
    run_list = []
    for run in runs:
        run_list.append({
            "id": run.id,
            "workflow_id": run.workflow_id,
            "trigger_type": run.trigger_type,
            "status": run.status,
            "started_at": run.started_at,
            "finished_at": run.finished_at
        })
    
    return {
        "items": run_list,
        "total": len(runs),
        "page": page,
        "page_size": page_size
    }


def get_workflow_run_detail_service(db: Session, ctx: RequestContext, run_id: int) -> Dict:
    """获取执行记录详情"""
    run = get_workflow_run_by_id(db, run_id)
    if not run:
        raise NotFoundException("执行记录不存在")
    
    if not ctx.is_super_admin and run.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此执行记录")
    
    node_logs = get_node_logs(db, run_id)
    
    logs_list = []
    for log in node_logs:
        logs_list.append({
            "id": log.id,
            "node_id": log.node_id,
            "node_type": log.node_type,
            "status": log.status,
            "started_at": log.started_at,
            "finished_at": log.finished_at,
            "error_message": log.error_message
        })
    
    return {
        "id": run.id,
        "workflow_id": run.workflow_id,
        "trigger_type": run.trigger_type,
        "input_data": run.input_data,
        "output_data": run.output_data,
        "status": run.status,
        "started_at": run.started_at,
        "finished_at": run.finished_at,
        "error_message": run.error_message,
        "node_logs": logs_list
    }