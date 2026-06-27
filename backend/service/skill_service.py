"""技能业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from dao.skill_dao import (
    get_skills, count_skills, get_skill_by_id, create_skill,
    update_skill, delete_skill, approve_skill, reject_skill
)
from core.exceptions import NotFoundException, ForbiddenException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def get_skills_service(db: Session, ctx: RequestContext, skill_type: str = None,
                       page: int = 1, page_size: int = 20) -> Dict:
    """获取技能列表"""
    skills = get_skills(db, ctx.tenant_id, skill_type, None, None, page, page_size)
    total = count_skills(db, ctx.tenant_id)
    
    skill_list = []
    for skill in skills:
        skill_list.append({
            "id": skill.id,
            "name": skill.name,
            "type": skill.type,
            "description": skill.description,
            "visibility": skill.visibility,
            "review_status": skill.review_status,
            "status": skill.status,
            "created_at": skill.created_at
        })
    
    return {
        "items": skill_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_skill_detail_service(db: Session, ctx: RequestContext, skill_id: int) -> Dict:
    """获取技能详情"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    if not ctx.is_super_admin and skill.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此技能")
    
    return {
        "id": skill.id,
        "name": skill.name,
        "type": skill.type,
        "description": skill.description,
        "config": skill.config,
        "input_schema": skill.input_schema,
        "output_schema": skill.output_schema,
        "visibility": skill.visibility,
        "review_status": skill.review_status,
        "status": skill.status,
        "created_at": skill.created_at
    }


def create_skill_service(db: Session, ctx: RequestContext, name: str, skill_type: str,
                         **kwargs) -> Dict:
    """创建技能"""
    skill = create_skill(db, ctx.tenant_id, ctx.user_id, name, skill_type, **kwargs)
    
    logger.info(f"创建技能: skill_id={skill.id}, name={name}")
    
    return {
        "id": skill.id,
        "name": skill.name,
        "type": skill.type,
        "visibility": skill.visibility,
        "review_status": skill.review_status,
        "created_at": skill.created_at
    }


def update_skill_service(db: Session, ctx: RequestContext, skill_id: int, **kwargs) -> Dict:
    """更新技能"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    if not ctx.is_super_admin and skill.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此技能")
    
    if skill.owner_id != ctx.user_id:
        raise ForbiddenException("无权修改此技能")
    
    skill = update_skill(db, skill_id, **kwargs)
    
    return {
        "id": skill.id,
        "name": skill.name,
        "updated_at": skill.updated_at
    }


def delete_skill_service(db: Session, ctx: RequestContext, skill_id: int):
    """删除技能"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    if not ctx.is_super_admin and skill.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除此技能")
    
    if skill.owner_id != ctx.user_id:
        raise ForbiddenException("无权删除此技能")
    
    delete_skill(db, skill_id)
    logger.info(f"删除技能: skill_id={skill_id}")


def approve_skill_service(db: Session, ctx: RequestContext, skill_id: int):
    """审核通过技能"""
    if not ctx.is_super_admin:
        raise ForbiddenException("只有管理员可以审核技能")
    
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    approve_skill(db, skill_id)
    logger.info(f"审核通过技能: skill_id={skill_id}")


def reject_skill_service(db: Session, ctx: RequestContext, skill_id: int):
    """拒绝技能审核"""
    if not ctx.is_super_admin:
        raise ForbiddenException("只有管理员可以审核技能")
    
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    reject_skill(db, skill_id)
    logger.info(f"拒绝技能审核: skill_id={skill_id}")