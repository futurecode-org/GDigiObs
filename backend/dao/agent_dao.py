"""数字员工数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime

from model.agent import DigitalAgent, AgentRun


def get_agents(db: Session, tenant_id: int, visibility: str = None,
               page: int = 1, page_size: int = 20) -> List[DigitalAgent]:
    """获取数字员工列表"""
    query = db.query(DigitalAgent).filter(
        DigitalAgent.tenant_id == tenant_id,
        DigitalAgent.deleted_at == None
    )
    
    if visibility:
        query = query.filter(DigitalAgent.visibility == visibility)
    
    return query.order_by(desc(DigitalAgent.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_agents(db: Session, tenant_id: int) -> int:
    """统计数字员工数量"""
    return db.query(DigitalAgent).filter(
        DigitalAgent.tenant_id == tenant_id,
        DigitalAgent.deleted_at == None
    ).count()


def get_agent_by_id(db: Session, agent_id: int) -> Optional[DigitalAgent]:
    """获取数字员工详情"""
    return db.query(DigitalAgent).filter(
        DigitalAgent.id == agent_id,
        DigitalAgent.deleted_at == None
    ).first()


def create_agent(db: Session, tenant_id: int, owner_id: int, name: str, **kwargs) -> DigitalAgent:
    """创建数字员工"""
    agent = DigitalAgent(
        tenant_id=tenant_id,
        owner_id=owner_id,
        name=name,
        **kwargs
    )
    db.add(agent)
    db.commit()
    return agent


def update_agent(db: Session, agent_id: int, **kwargs) -> DigitalAgent:
    """更新数字员工"""
    agent = get_agent_by_id(db, agent_id)
    if not agent:
        return None
    
    for key, value in kwargs.items():
        if hasattr(agent, key):
            setattr(agent, key, value)
    
    db.commit()
    return agent


def delete_agent(db: Session, agent_id: int) -> bool:
    """删除数字员工（软删除）"""
    agent = get_agent_by_id(db, agent_id)
    if not agent:
        return False
    
    agent.deleted_at = datetime.now()
    db.commit()
    return True


def create_agent_run(db: Session, tenant_id: int, agent_id: int, trigger_type: str,
                     trigger_user_id: int = None, input_data: dict = None) -> AgentRun:
    """创建数字员工执行记录"""
    run = AgentRun(
        tenant_id=tenant_id,
        agent_id=agent_id,
        trigger_type=trigger_type,
        trigger_user_id=trigger_user_id,
        input_data=input_data,
        status="running",
        started_at=datetime.now()
    )
    db.add(run)
    db.commit()
    return run


def update_agent_run(db: Session, run_id: int, **kwargs) -> AgentRun:
    """更新执行记录"""
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        return None
    
    for key, value in kwargs.items():
        if hasattr(run, key):
            setattr(run, key, value)
    
    db.commit()
    return run


def get_agent_runs(db: Session, tenant_id: int, agent_id: int = None,
                   page: int = 1, page_size: int = 20) -> List[AgentRun]:
    """获取执行记录列表"""
    query = db.query(AgentRun).filter(AgentRun.tenant_id == tenant_id)
    
    if agent_id:
        query = query.filter(AgentRun.agent_id == agent_id)
    
    return query.order_by(desc(AgentRun.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_agent_runs(db: Session, tenant_id: int, agent_id: int = None) -> int:
    """统计执行记录数量"""
    query = db.query(AgentRun).filter(AgentRun.tenant_id == tenant_id)
    
    if agent_id:
        query = query.filter(AgentRun.agent_id == agent_id)
    
    return query.count()


def get_agent_run_by_id(db: Session, run_id: int) -> Optional[AgentRun]:
    """获取执行记录详情"""
    return db.query(AgentRun).filter(AgentRun.id == run_id).first()