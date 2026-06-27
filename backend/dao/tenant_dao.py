import logging
from typing import Optional, List
from sqlalchemy.orm import Session
from model.tenant import Tenant
from datetime import datetime

logger = logging.getLogger(__name__)


def get_tenant_by_id(db: Session, tenant_id: int) -> Optional[Tenant]:
    """根据ID查询租户"""
    return db.query(Tenant).filter(Tenant.id == tenant_id, Tenant.deleted_at.is_(None)).first()


def get_tenant_by_name(db: Session, name: str) -> Optional[Tenant]:
    """根据名称查询租户"""
    return db.query(Tenant).filter(Tenant.name == name, Tenant.deleted_at.is_(None)).first()


def get_all_tenants(db: Session, page: int = 1, page_size: int = 20) -> List[Tenant]:
    """查询所有租户列表"""
    query = db.query(Tenant).filter(Tenant.deleted_at.is_(None))
    return query.offset((page - 1) * page_size).limit(page_size).all()


def count_all_tenants(db: Session) -> int:
    """统计所有租户数量"""
    return db.query(Tenant).filter(Tenant.deleted_at.is_(None)).count()


def create_tenant(db: Session, tenant: Tenant) -> Tenant:
    """创建租户"""
    try:
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        return tenant
    except Exception as e:
        db.rollback()
        logger.error(f"创建租户失败: {e}")
        raise


def update_tenant(db: Session, tenant: Tenant, **kwargs) -> Tenant:
    """更新租户"""
    try:
        for key, value in kwargs.items():
            setattr(tenant, key, value)
        tenant.updated_at = datetime.now()
        db.commit()
        db.refresh(tenant)
        return tenant
    except Exception as e:
        db.rollback()
        logger.error(f"更新租户失败: {e}")
        raise


def update_tenant_status(db: Session, tenant_id: int, status: str) -> bool:
    """更新租户状态"""
    try:
        tenant = get_tenant_by_id(db, tenant_id)
        if tenant:
            tenant.status = status
            tenant.updated_at = datetime.now()
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"更新租户状态失败: {e}")
        raise


def soft_delete_tenant(db: Session, tenant_id: int) -> bool:
    """软删除租户"""
    try:
        tenant = get_tenant_by_id(db, tenant_id)
        if tenant:
            tenant.deleted_at = datetime.now()
            tenant.status = "disabled"
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"软删除租户失败: {e}")
        raise


def create_personal_tenant(db: Session, user_id: int, username: str) -> Tenant:
    """为用户创建个人租户"""
    tenant_name = f"{username}_personal"
    tenant = Tenant(
        name=tenant_name,
        type="personal",
        status="enabled",
        admin_user_id=user_id,
        config=Tenant.DEFAULT_CONFIG
    )
    return create_tenant(db, tenant)