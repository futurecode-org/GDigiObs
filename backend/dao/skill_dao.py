"""技能数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime

from model.skill import Skill


def _base_query(db: Session):
    """基础查询：未删除"""
    return db.query(Skill).filter(Skill.deleted_at == None)


def get_skills(db: Session, tenant_id: Optional[int] = None, skill_type: str = None,
               visibility: str = None, review_status: str = None,
               keyword: str = None, page: int = 1, page_size: int = 20,
               include_public: bool = False) -> List[Skill]:
    """获取技能列表
    
    Args:
        tenant_id: 当前租户ID，为 None 时不按租户过滤（平台管理员）
        skill_type: 技能类型过滤
        visibility: 可见范围过滤
        review_status: 审核状态过滤
        keyword: 名称/描述关键字
        page: 页码
        page_size: 每页大小
        include_public: 是否同时包含公开技能（用于技能市场）
    """
    query = _base_query(db)
    
    if include_public:
        filters = [and_(Skill.visibility == "public", Skill.review_status == "approved", Skill.status == "enabled")]
        if tenant_id is not None:
            filters.append(Skill.tenant_id == tenant_id)
        query = query.filter(or_(*filters))
    elif tenant_id is not None:
        query = query.filter(Skill.tenant_id == tenant_id)
    
    if skill_type:
        query = query.filter(Skill.type == skill_type)
    
    if visibility:
        query = query.filter(Skill.visibility == visibility)
    
    if review_status:
        query = query.filter(Skill.review_status == review_status)
    
    if keyword:
        query = query.filter(
            or_(
                Skill.name.ilike(f"%{keyword}%"),
                Skill.description.ilike(f"%{keyword}%")
            )
        )
    
    return query.order_by(desc(Skill.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_skills(db: Session, tenant_id: Optional[int] = None, skill_type: str = None,
                 visibility: str = None, review_status: str = None,
                 keyword: str = None, include_public: bool = False) -> int:
    """统计技能数量"""
    query = _base_query(db)
    
    if include_public:
        filters = [and_(Skill.visibility == "public", Skill.review_status == "approved", Skill.status == "enabled")]
        if tenant_id is not None:
            filters.append(Skill.tenant_id == tenant_id)
        query = query.filter(or_(*filters))
    elif tenant_id is not None:
        query = query.filter(Skill.tenant_id == tenant_id)
    
    if skill_type:
        query = query.filter(Skill.type == skill_type)
    
    if visibility:
        query = query.filter(Skill.visibility == visibility)
    
    if review_status:
        query = query.filter(Skill.review_status == review_status)
    
    if keyword:
        query = query.filter(
            or_(
                Skill.name.ilike(f"%{keyword}%"),
                Skill.description.ilike(f"%{keyword}%")
            )
        )
    
    return query.count()


def get_skill_by_id(db: Session, skill_id: int) -> Optional[Skill]:
    """获取技能详情"""
    return _base_query(db).filter(Skill.id == skill_id).first()


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
    db.refresh(skill)
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
    db.refresh(skill)
    return skill


def update_skill_status(db: Session, skill_id: int, status: str) -> bool:
    """更新技能状态"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        return False
    
    skill.status = status
    db.commit()
    return True


def delete_skill(db: Session, skill_id: int) -> bool:
    """删除技能（软删除）"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        return False
    
    skill.deleted_at = datetime.now()
    db.commit()
    return True


def get_public_skills(db: Session, page: int = 1, page_size: int = 20,
                      keyword: str = None) -> List[Skill]:
    """获取公开技能（分页）"""
    query = _base_query(db).filter(
        Skill.visibility == "public",
        Skill.review_status == "approved",
        Skill.status == "enabled"
    )
    
    if keyword:
        query = query.filter(
            or_(
                Skill.name.ilike(f"%{keyword}%"),
                Skill.description.ilike(f"%{keyword}%")
            )
        )
    
    return query.order_by(desc(Skill.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_public_skills(db: Session, keyword: str = None) -> int:
    """统计公开技能数量"""
    query = _base_query(db).filter(
        Skill.visibility == "public",
        Skill.review_status == "approved",
        Skill.status == "enabled"
    )
    
    if keyword:
        query = query.filter(
            or_(
                Skill.name.ilike(f"%{keyword}%"),
                Skill.description.ilike(f"%{keyword}%")
            )
        )
    
    return query.count()


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
