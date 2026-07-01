"""Chroma 配置数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime

from model.chroma_config import ChromaConfig


def get_chroma_configs(db: Session, tenant_id: int = None, page: int = 1, page_size: int = 20) -> List[ChromaConfig]:
    """获取 Chroma 配置列表"""
    query = db.query(ChromaConfig).filter(ChromaConfig.deleted_at == None)
    
    if tenant_id:
        query = query.filter(
            or_(
                ChromaConfig.visibility == "platform",
                and_(ChromaConfig.visibility == "tenant", ChromaConfig.tenant_id == tenant_id)
            )
        )
    
    return query.order_by(desc(ChromaConfig.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_chroma_configs(db: Session, tenant_id: int = None) -> int:
    """统计 Chroma 配置数量"""
    query = db.query(ChromaConfig).filter(ChromaConfig.deleted_at == None)
    
    if tenant_id:
        query = query.filter(
            or_(
                ChromaConfig.visibility == "platform",
                and_(ChromaConfig.visibility == "tenant", ChromaConfig.tenant_id == tenant_id)
            )
        )
    
    return query.count()


def get_chroma_config_by_id(db: Session, config_id: int) -> Optional[ChromaConfig]:
    """获取 Chroma 配置详情"""
    return db.query(ChromaConfig).filter(
        ChromaConfig.id == config_id,
        ChromaConfig.deleted_at == None
    ).first()


def create_chroma_config(db: Session, tenant_id: int = None, owner_id: int = None, **kwargs) -> ChromaConfig:
    """创建 Chroma 配置"""
    config = ChromaConfig(tenant_id=tenant_id, owner_id=owner_id, **kwargs)
    db.add(config)
    db.commit()
    return config


def update_chroma_config(db: Session, config_id: int, **kwargs) -> ChromaConfig:
    """更新 Chroma 配置"""
    config = get_chroma_config_by_id(db, config_id)
    if not config:
        return None
    
    for key, value in kwargs.items():
        if hasattr(config, key):
            setattr(config, key, value)
    
    db.commit()
    return config


def delete_chroma_config(db: Session, config_id: int) -> bool:
    """删除 Chroma 配置（软删除）"""
    config = get_chroma_config_by_id(db, config_id)
    if not config:
        return False
    
    config.deleted_at = datetime.now()
    db.commit()
    return True
