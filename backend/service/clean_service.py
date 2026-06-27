"""数据清洗业务逻辑层"""
import logging
import re
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime

from dao.collect_dao import (
    get_collected_items, get_collected_item_by_id, update_collected_item
)
from dao.clean_dao import (
    get_clean_rules, get_clean_rule_by_id, create_clean_rule, update_clean_rule,
    delete_clean_rule, get_clean_logs, create_clean_log
)
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def get_rules_service(db: Session, ctx: RequestContext, page: int = 1, 
                      page_size: int = 20) -> Dict:
    """获取清洗规则列表"""
    rules = get_clean_rules(db, ctx.tenant_id, page, page_size)
    total = len(rules)
    
    rule_list = []
    for rule in rules:
        rule_list.append({
            "id": rule.id,
            "name": rule.name,
            "rule_type": rule.rule_type,
            "config": rule.config,
            "status": rule.status,
            "created_at": rule.created_at
        })
    
    return {
        "items": rule_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_rule_detail_service(db: Session, ctx: RequestContext, rule_id: int) -> Dict:
    """获取清洗规则详情"""
    rule = get_clean_rule_by_id(db, rule_id)
    if not rule:
        raise NotFoundException("规则不存在")
    
    if not ctx.is_super_admin and rule.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此规则")
    
    return {
        "id": rule.id,
        "name": rule.name,
        "rule_type": rule.rule_type,
        "config": rule.config,
        "task_ids": rule.task_ids,
        "status": rule.status,
        "description": rule.description,
        "created_at": rule.created_at
    }


def create_rule_service(db: Session, ctx: RequestContext, name: str, rule_type: str,
                        config: Dict, **kwargs) -> Dict:
    """创建清洗规则"""
    rule = create_clean_rule(db, ctx.tenant_id, name, rule_type, config, **kwargs)
    
    logger.info(f"创建清洗规则: rule_id={rule.id}, name={name}")
    
    return {
        "id": rule.id,
        "name": rule.name,
        "rule_type": rule.rule_type,
        "status": rule.status,
        "created_at": rule.created_at
    }


def update_rule_service(db: Session, ctx: RequestContext, rule_id: int, **kwargs) -> Dict:
    """更新清洗规则"""
    rule = get_clean_rule_by_id(db, rule_id)
    if not rule:
        raise NotFoundException("规则不存在")
    
    if not ctx.is_super_admin and rule.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此规则")
    
    rule = update_clean_rule(db, rule_id, **kwargs)
    
    return {
        "id": rule.id,
        "name": rule.name,
        "updated_at": rule.updated_at
    }


def delete_rule_service(db: Session, ctx: RequestContext, rule_id: int):
    """删除清洗规则"""
    rule = get_clean_rule_by_id(db, rule_id)
    if not rule:
        raise NotFoundException("规则不存在")
    
    if not ctx.is_super_admin and rule.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除此规则")
    
    delete_clean_rule(db, rule_id)
    logger.info(f"删除清洗规则: rule_id={rule_id}")


def execute_clean_service(db: Session, ctx: RequestContext, rule_id: int, 
                          task_id: int = None) -> Dict:
    """执行清洗规则"""
    rule = get_clean_rule_by_id(db, rule_id)
    if not rule:
        raise NotFoundException("规则不存在")
    
    if rule.status != "enabled":
        raise BadRequestException("规则未启用")
    
    items = get_collected_items(db, ctx.tenant_id, task_id, status="raw")
    
    cleaned_count = 0
    error_count = 0
    
    for item in items:
        try:
            cleaned_content = apply_clean_rule(item.content, rule.rule_type, rule.config)
            
            update_collected_item(db, item.id, 
                                  content=cleaned_content,
                                  status="cleaned",
                                  tags=rule.config.get("tags", []))
            
            cleaned_count += 1
        except Exception as e:
            logger.error(f"清洗数据失败: item_id={item.id}, error={str(e)}")
            error_count += 1
    
    create_clean_log(db, ctx.tenant_id, rule_id, task_id, 
                     total=len(items), success=cleaned_count, failed=error_count)
    
    logger.info(f"执行清洗规则完成: rule_id={rule_id}, cleaned={cleaned_count}, failed={error_count}")
    
    return {
        "rule_id": rule_id,
        "total": len(items),
        "cleaned": cleaned_count,
        "failed": error_count
    }


def apply_clean_rule(content: str, rule_type: str, config: Dict) -> str:
    """应用清洗规则"""
    if rule_type == "deduplication":
        return content
    elif rule_type == "format_standardization":
        return standardize_format(content, config)
    elif rule_type == "sensitive_filter":
        return filter_sensitive(content, config)
    elif rule_type == "entity_recognition":
        return content
    elif rule_type == "sentiment_analysis":
        return content
    else:
        return content


def standardize_format(content: str, config: Dict) -> str:
    """格式标准化"""
    content = content.strip()
    if config.get("remove_html"):
        content = re.sub(r'<[^>]+>', '', content)
    if config.get("remove_special_chars"):
        content = re.sub(r'[^\w\s\u4e00-\u9fff]', '', content)
    return content


def filter_sensitive(content: str, config: Dict) -> str:
    """敏感词过滤"""
    sensitive_words = config.get("words", [])
    for word in sensitive_words:
        content = content.replace(word, "*" * len(word))
    return content


def get_logs_service(db: Session, ctx: RequestContext, rule_id: int = None,
                     page: int = 1, page_size: int = 50) -> List[Dict]:
    """获取清洗日志"""
    logs = get_clean_logs(db, ctx.tenant_id, rule_id, page, page_size)
    
    return [
        {
            "id": log.id,
            "rule_id": log.rule_id,
            "task_id": log.task_id,
            "executed_at": log.executed_at,
            "total": log.total,
            "success": log.success,
            "failed": log.failed,
            "status": log.status
        }
        for log in logs
    ]