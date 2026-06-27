"""数据分析业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime

from dao.collect_dao import (
    get_collected_items, get_collected_item_by_id, update_collected_item
)
from dao.analysis_dao import (
    get_analysis_tasks, get_analysis_task_by_id, create_analysis_task,
    update_analysis_task, delete_analysis_task, get_analysis_logs,
    create_analysis_log
)
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def get_tasks_service(db: Session, ctx: RequestContext, analysis_type: str = None,
                      page: int = 1, page_size: int = 20) -> Dict:
    """获取分析任务列表"""
    tasks = get_analysis_tasks(db, ctx.tenant_id, analysis_type, page, page_size)
    total = len(tasks)
    
    task_list = []
    for task in tasks:
        task_list.append({
            "id": task.id,
            "name": task.name,
            "analysis_type": task.analysis_type,
            "status": task.status,
            "created_at": task.created_at
        })
    
    return {
        "items": task_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_task_detail_service(db: Session, ctx: RequestContext, task_id: int) -> Dict:
    """获取分析任务详情"""
    task = get_analysis_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")
    
    if not ctx.is_super_admin and task.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此任务")
    
    return {
        "id": task.id,
        "name": task.name,
        "analysis_type": task.analysis_type,
        "data_source": task.data_source,
        "config": task.config,
        "status": task.status,
        "description": task.description,
        "created_at": task.created_at
    }


def create_task_service(db: Session, ctx: RequestContext, name: str, analysis_type: str,
                        data_source: Dict, config: Dict = None, **kwargs) -> Dict:
    """创建分析任务"""
    task = create_analysis_task(db, ctx.tenant_id, name, analysis_type, 
                                data_source, config, **kwargs)
    
    logger.info(f"创建分析任务: task_id={task.id}, name={name}")
    
    return {
        "id": task.id,
        "name": task.name,
        "analysis_type": task.analysis_type,
        "status": task.status,
        "created_at": task.created_at
    }


def update_task_service(db: Session, ctx: RequestContext, task_id: int, **kwargs) -> Dict:
    """更新分析任务"""
    task = get_analysis_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")
    
    if not ctx.is_super_admin and task.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此任务")
    
    task = update_analysis_task(db, task_id, **kwargs)
    
    return {
        "id": task.id,
        "name": task.name,
        "updated_at": task.updated_at
    }


def delete_task_service(db: Session, ctx: RequestContext, task_id: int):
    """删除分析任务"""
    task = get_analysis_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")
    
    if not ctx.is_super_admin and task.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除此任务")
    
    delete_analysis_task(db, task_id)
    logger.info(f"删除分析任务: task_id={task_id}")


def execute_analysis_service(db: Session, ctx: RequestContext, task_id: int) -> Dict:
    """执行分析任务"""
    task = get_analysis_task_by_id(db, task_id)
    if not task:
        raise NotFoundException("任务不存在")
    
    if task.status != "enabled":
        raise BadRequestException("任务未启用")
    
    items = get_collected_items(db, ctx.tenant_id, 
                                task.data_source.get("task_id"), 
                                status="cleaned")
    
    result = perform_analysis(items, task.analysis_type, task.config)
    
    create_analysis_log(db, ctx.tenant_id, task_id, 
                        total=len(items), 
                        result=result,
                        status="success")
    
    logger.info(f"执行分析任务完成: task_id={task_id}, result={result}")
    
    return {
        "task_id": task_id,
        "analysis_type": task.analysis_type,
        "total_items": len(items),
        "result": result
    }


def perform_analysis(items, analysis_type: str, config: Dict) -> Dict:
    """执行分析"""
    if analysis_type == "trend":
        return analyze_trend(items, config)
    elif analysis_type == "sentiment":
        return analyze_sentiment(items, config)
    elif analysis_type == "topic":
        return analyze_topic(items, config)
    elif analysis_type == "keyword":
        return analyze_keyword(items, config)
    elif analysis_type == "risk":
        return analyze_risk(items, config)
    else:
        return {"analysis_type": analysis_type, "count": len(items)}


def analyze_trend(items, config: Dict) -> Dict:
    """趋势分析"""
    dates = [item.publish_at.date() for item in items if item.publish_at]
    date_counts = {}
    for d in dates:
        date_counts[str(d)] = date_counts.get(str(d), 0) + 1
    
    return {
        "trend": date_counts,
        "total": len(items)
    }


def analyze_sentiment(items, config: Dict) -> Dict:
    """情感分析"""
    sentiment_counts = {"positive": 0, "neutral": 0, "negative": 0}
    for item in items:
        if item.sentiment:
            sentiment_counts[item.sentiment] += 1
    
    return {
        "sentiment_distribution": sentiment_counts,
        "total": len(items)
    }


def analyze_topic(items, config: Dict) -> Dict:
    """主题聚类"""
    return {"topics": [], "total": len(items)}


def analyze_keyword(items, config: Dict) -> Dict:
    """关键词分析"""
    return {"keywords": [], "total": len(items)}


def analyze_risk(items, config: Dict) -> Dict:
    """风险预警"""
    risk_items = [item for item in items if item.sentiment == "negative"]
    return {
        "risk_count": len(risk_items),
        "total": len(items),
        "risk_ratio": len(risk_items) / len(items) if items else 0
    }


def get_logs_service(db: Session, ctx: RequestContext, task_id: int = None,
                     page: int = 1, page_size: int = 50) -> List[Dict]:
    """获取分析日志"""
    logs = get_analysis_logs(db, ctx.tenant_id, task_id, page, page_size)
    
    return [
        {
            "id": log.id,
            "task_id": log.task_id,
            "executed_at": log.executed_at,
            "total": log.total,
            "result": log.result,
            "status": log.status
        }
        for log in logs
    ]