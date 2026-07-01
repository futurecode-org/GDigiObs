"""模型配置数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime

from model.model_config import ModelConfig


def get_model_configs(db: Session, tenant_id: int = None, model_type: str = None,
                      visibility: str = None, status: str = None, page: int = 1, page_size: int = 20) -> List[ModelConfig]:
    """获取模型配置列表"""
    query = db.query(ModelConfig).filter(
        ModelConfig.deleted_at == None
    )
    
    # 可见范围过滤
    if tenant_id:
        # 平台模型 + 租户模型 + 个人模型（属于当前用户）
        query = query.filter(
            or_(
                ModelConfig.visibility == "platform",
                and_(ModelConfig.visibility == "tenant", ModelConfig.tenant_id == tenant_id),
                # 个人模型需要进一步过滤
            )
        )
    
    if model_type:
        query = query.filter(ModelConfig.model_type == model_type)
    
    if visibility:
        query = query.filter(ModelConfig.visibility == visibility)
    
    if status:
        query = query.filter(ModelConfig.status == status)
    
    return query.order_by(desc(ModelConfig.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_model_configs(db: Session, tenant_id: int = None, status: str = None) -> int:
    """统计模型配置数量"""
    query = db.query(ModelConfig).filter(
        ModelConfig.deleted_at == None
    )
    
    if tenant_id:
        query = query.filter(
            or_(
                ModelConfig.visibility == "platform",
                and_(ModelConfig.visibility == "tenant", ModelConfig.tenant_id == tenant_id)
            )
        )
    
    if status:
        query = query.filter(ModelConfig.status == status)
    
    return query.count()


def get_model_config_by_id(db: Session, model_id: int) -> Optional[ModelConfig]:
    """获取模型配置详情"""
    return db.query(ModelConfig).filter(
        ModelConfig.id == model_id,
        ModelConfig.deleted_at == None
    ).first()


def create_model_config(db: Session, tenant_id: int, owner_id: int, name: str,
                        model_key: str, model_type: str, api_type: str, base_url: str,
                        visibility: str = "tenant", **kwargs) -> ModelConfig:
    """创建模型配置"""
    model = ModelConfig(
        tenant_id=tenant_id,
        owner_id=owner_id,
        name=name,
        model_key=model_key,
        model_type=model_type,
        api_type=api_type,
        base_url=base_url,
        visibility=visibility,
        **kwargs
    )
    db.add(model)
    db.commit()
    return model


def update_model_config(db: Session, model_id: int, **kwargs) -> ModelConfig:
    """更新模型配置"""
    model = get_model_config_by_id(db, model_id)
    if not model:
        return None
    
    for key, value in kwargs.items():
        if hasattr(model, key):
            setattr(model, key, value)
    
    db.commit()
    return model


def delete_model_config(db: Session, model_id: int) -> bool:
    """删除模型配置（软删除）"""
    model = get_model_config_by_id(db, model_id)
    if not model:
        return False
    
    model.deleted_at = datetime.now()
    db.commit()
    return True


def get_platform_models(db: Session, model_type: str = None, status: str = None) -> List[ModelConfig]:
    """获取平台预置模型"""
    query = db.query(ModelConfig).filter(
        ModelConfig.visibility == "platform",
        ModelConfig.deleted_at == None
    )
    
    if model_type:
        query = query.filter(ModelConfig.model_type == model_type)
    
    if status:
        query = query.filter(ModelConfig.status == status)
    
    return query.all()


def get_embedding_models(db: Session, tenant_id: int, status: str = None) -> List[ModelConfig]:
    """获取可用的Embedding模型"""
    return get_model_configs(db, tenant_id, model_type="embedding", status=status)