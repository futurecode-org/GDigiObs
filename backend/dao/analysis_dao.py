"""数据分析数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict
from datetime import datetime

from model.analysis import AnalysisTask, AnalysisLog


def get_analysis_tasks(db: Session, tenant_id: int, analysis_type: str = None,
                       page: int = 1, page_size: int = 20) -> List[AnalysisTask]:
    """获取分析任务列表"""
    query = db.query(AnalysisTask).filter(AnalysisTask.tenant_id == tenant_id)
    
    if analysis_type:
        query = query.filter(AnalysisTask.analysis_type == analysis_type)
    
    return query.order_by(desc(AnalysisTask.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def get_analysis_task_by_id(db: Session, task_id: int) -> Optional[AnalysisTask]:
    """获取分析任务详情"""
    return db.query(AnalysisTask).filter(AnalysisTask.id == task_id).first()


def create_analysis_task(db: Session, tenant_id: int, name: str, analysis_type: str,
                         data_source: Dict, config: Dict = None, **kwargs) -> AnalysisTask:
    """创建分析任务"""
    task = AnalysisTask(
        tenant_id=tenant_id,
        name=name,
        analysis_type=analysis_type,
        data_source=data_source,
        config=config,
        **kwargs
    )
    db.add(task)
    db.commit()
    return task


def update_analysis_task(db: Session, task_id: int, **kwargs) -> AnalysisTask:
    """更新分析任务"""
    task = get_analysis_task_by_id(db, task_id)
    if not task:
        return None
    
    for key, value in kwargs.items():
        if hasattr(task, key):
            setattr(task, key, value)
    
    db.commit()
    return task


def delete_analysis_task(db: Session, task_id: int) -> bool:
    """删除分析任务"""
    task = get_analysis_task_by_id(db, task_id)
    if not task:
        return False
    
    db.delete(task)
    db.commit()
    return True


def get_analysis_logs(db: Session, tenant_id: int, task_id: int = None,
                      page: int = 1, page_size: int = 50) -> List[AnalysisLog]:
    """获取分析日志"""
    query = db.query(AnalysisLog).filter(AnalysisLog.tenant_id == tenant_id)
    
    if task_id:
        query = query.filter(AnalysisLog.task_id == task_id)
    
    return query.order_by(desc(AnalysisLog.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def create_analysis_log(db: Session, tenant_id: int, task_id: int,
                        total: int = 0, result: Dict = None,
                        status: str = "success") -> AnalysisLog:
    """创建分析日志"""
    log = AnalysisLog(
        tenant_id=tenant_id,
        task_id=task_id,
        executed_at=datetime.now(),
        total=total,
        result=result,
        status=status
    )
    db.add(log)
    db.commit()
    return log