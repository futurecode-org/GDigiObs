"""技能数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime

from model.skill import Skill


def get_skills(db: Session, tenant_id: int, skill_type: str = None,
               visibility: str = None, review_status: str = None,
               page: int = 1, page_size: int = 20) -> List[Skill]:
    """获取技能列表"""
    query = db.query(Skill).filter(
        Skill.tenant_id == tenant_id,
        Skill.deleted_at == None
    )
    
    if skill_type:
        query = query.filter(Skill.type == skill_type)
    
    if visibility:
        query = query.filter(Skill.visibility == visibility)
    
    if review_status:
        query = query.filter(Skill.review_status == review_status)
    
    return query.order_by(desc(Skill.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_skills(db: Session, tenant_id: int) -> int:
    """统计技能数量"""
    return db.query(Skill).filter(
        Skill.tenant_id == tenant_id,
        Skill.deleted_at == None
    ).count()


def get_skill_by_id(db: Session, skill_id: int) -> Optional[Skill]:
    """获取技能详情"""
    return db.query(Skill).filter(
        Skill.id == skill_id,
        Skill.deleted_at == None
    ).first()


def create_skill(db: Session, tenant_id: int, owner_id: int, name: str,
                 skill_type: str, **kwargs) -> Skill:
    """创建技能"""
    skill = Skill(
        tenant_id=tenant_id,
        owner_id=owner_id,
        name=name,
        type=skill_type,
        **kwargs
    )
    db.add(skill)
    db.commit()
    return skill


def update_skill(db: Session, skill_id: int, **kwargs) -> Skill:
    """更新技能"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        return None
    
    for key, value in kwargs.items():
        if hasattr(skill, key):
            setattr(skill, key, value)
    
    db.commit()
    return skill


def delete_skill(db: Session, skill_id: int) -> bool:
    """删除技能（软删除）"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        return False
    
    skill.deleted_at = datetime.now()
    db.commit()
    return True


def get_public_skills(db: Session) -> List[Skill]:
    """获取公开技能"""
    return db.query(Skill).filter(
        Skill.visibility == "public",
        Skill.review_status == "approved",
        Skill.status == "enabled",
        Skill.deleted_at == None
    ).order_by(desc(Skill.created_at)).all()


def approve_skill(db: Session, skill_id: int) -> bool:
    """审核通过技能"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        return False
    
    skill.review_status = "approved"
    db.commit()
    return True


def reject_skill(db: Session, skill_id: int) -> bool:
    """拒绝技能审核"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        return False
    
    skill.review_status = "rejected"
    db.commit()
    return True