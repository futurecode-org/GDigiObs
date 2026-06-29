"""工作流数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime

from model.workflow import Workflow, WorkflowRun, WorkflowNodeLog


def get_workflows(db: Session, tenant_id: int, status: str = None,
                  page: int = 1, page_size: int = 20) -> List[Workflow]:
    """获取工作流列表"""
    query = db.query(Workflow).filter(
        Workflow.tenant_id == tenant_id,
        Workflow.deleted_at == None
    )
    
    if status:
        query = query.filter(Workflow.status == status)
    
    return query.order_by(desc(Workflow.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_workflows(db: Session, tenant_id: int) -> int:
    """统计工作流数量"""
    return db.query(Workflow).filter(
        Workflow.tenant_id == tenant_id,
        Workflow.deleted_at == None
    ).count()


def get_workflow_by_id(db: Session, workflow_id: int) -> Optional[Workflow]:
    """获取工作流详情"""
    return db.query(Workflow).filter(
        Workflow.id == workflow_id,
        Workflow.deleted_at == None
    ).first()


def create_workflow(db: Session, tenant_id: int, owner_id: int, name: str,
                    nodes: list, edges: list, **kwargs) -> Workflow:
    """创建工作流"""
    workflow = Workflow(
        tenant_id=tenant_id,
        owner_id=owner_id,
        name=name,
        nodes=nodes,
        edges=edges,
        **kwargs
    )
    db.add(workflow)
    db.commit()
    return workflow


def update_workflow(db: Session, workflow_id: int, **kwargs) -> Workflow:
    """更新工作流"""
    workflow = get_workflow_by_id(db, workflow_id)
    if not workflow:
        return None
    
    for key, value in kwargs.items():
        if hasattr(workflow, key):
            setattr(workflow, key, value)
    
    db.commit()
    return workflow


def delete_workflow(db: Session, workflow_id: int) -> bool:
    """删除工作流（软删除）"""
    workflow = get_workflow_by_id(db, workflow_id)
    if not workflow:
        return False
    
    workflow.deleted_at = datetime.now()
    db.commit()
    return True


def enable_workflow(db: Session, workflow_id: int) -> bool:
    """启用工作流"""
    workflow = get_workflow_by_id(db, workflow_id)
    if not workflow:
        return False
    
    workflow.status = "enabled"
    db.commit()
    return True


def disable_workflow(db: Session, workflow_id: int) -> bool:
    """禁用工作流"""
    workflow = get_workflow_by_id(db, workflow_id)
    if not workflow:
        return False
    
    workflow.status = "disabled"
    db.commit()
    return True


def create_workflow_run(db: Session, tenant_id: int, workflow_id: int, trigger_type: str,
                        trigger_user_id: int = None, input_data: dict = None) -> WorkflowRun:
    """创建工作流执行记录"""
    run = WorkflowRun(
        tenant_id=tenant_id,
        workflow_id=workflow_id,
        trigger_type=trigger_type,
        trigger_user_id=trigger_user_id,
        input_data=input_data,
        status="running",
        started_at=datetime.now()
    )
    db.add(run)
    db.commit()
    return run


def update_workflow_run(db: Session, run_id: int, **kwargs) -> WorkflowRun:
    """更新执行记录"""
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        return None
    
    for key, value in kwargs.items():
        if hasattr(run, key):
            setattr(run, key, value)
    
    db.commit()
    return run


def get_workflow_runs(db: Session, tenant_id: int, workflow_id: int = None,
                      page: int = 1, page_size: int = 20) -> List[WorkflowRun]:
    """获取执行记录列表"""
    query = db.query(WorkflowRun).filter(WorkflowRun.tenant_id == tenant_id)
    
    if workflow_id:
        query = query.filter(WorkflowRun.workflow_id == workflow_id)
    
    return query.order_by(desc(WorkflowRun.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_workflow_runs(db: Session, tenant_id: int, workflow_id: int = None) -> int:
    """统计执行记录数量"""
    query = db.query(WorkflowRun).filter(WorkflowRun.tenant_id == tenant_id)

    if workflow_id:
        query = query.filter(WorkflowRun.workflow_id == workflow_id)

    return query.count()


def get_workflow_run_by_id(db: Session, run_id: int) -> Optional[WorkflowRun]:
    """获取执行记录详情"""
    return db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()


def create_node_log(db: Session, tenant_id: int, workflow_run_id: int,
                    node_id: str, node_type: str, **kwargs) -> WorkflowNodeLog:
    """创建节点执行日志"""
    log = WorkflowNodeLog(
        tenant_id=tenant_id,
        workflow_run_id=workflow_run_id,
        node_id=node_id,
        node_type=node_type,
        status="running",
        started_at=datetime.now(),
        **kwargs
    )
    db.add(log)
    db.flush()
    return log


def update_node_log(db: Session, log_id: int, **kwargs) -> WorkflowNodeLog:
    """更新节点日志"""
    log = db.query(WorkflowNodeLog).filter(WorkflowNodeLog.id == log_id).first()
    if not log:
        return None
    
    for key, value in kwargs.items():
        if hasattr(log, key):
            setattr(log, key, value)
    
    db.commit()
    return log


def get_node_logs(db: Session, workflow_run_id: int) -> List[WorkflowNodeLog]:
    """获取节点执行日志列表"""
    return db.query(WorkflowNodeLog).filter(
        WorkflowNodeLog.workflow_run_id == workflow_run_id
    ).order_by(WorkflowNodeLog.created_at).all()