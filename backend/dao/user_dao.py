import logging
from typing import Optional, List
from sqlalchemy.orm import Session
from model.user import User, UserStatus
from model.refresh_token import RefreshTokenModel
from datetime import datetime

logger = logging.getLogger(__name__)


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """根据用户名查询用户"""
    return db.query(User).filter(User.username == username, User.deleted_at.is_(None)).first()


def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    """根据ID查询用户"""
    return db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """根据邮箱查询用户"""
    return db.query(User).filter(User.email == email, User.deleted_at.is_(None)).first()


def get_user_by_phone(db: Session, phone: str) -> Optional[User]:
    """根据手机号查询用户"""
    return db.query(User).filter(User.phone == phone, User.deleted_at.is_(None)).first()


def get_users_by_tenant(db: Session, tenant_id: int, page: int = 1, page_size: int = 20) -> List[User]:
    """查询租户下的用户列表"""
    query = db.query(User).filter(User.tenant_id == tenant_id, User.deleted_at.is_(None))
    return query.offset((page - 1) * page_size).limit(page_size).all()


def count_users_by_tenant(db: Session, tenant_id: int) -> int:
    """统计租户下的用户数量"""
    return db.query(User).filter(User.tenant_id == tenant_id, User.deleted_at.is_(None)).count()


def search_users_by_keyword(db: Session, tenant_id: Optional[int], keyword: str, exclude_user_id: Optional[int] = None, page: int = 1, page_size: int = 20) -> List[User]:
    """根据关键词搜索用户（用户名或昵称）"""
    query = db.query(User).filter(
        User.deleted_at.is_(None)
    )
    
    if tenant_id:
        query = query.filter(User.tenant_id == tenant_id)
    
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)
    
    if keyword:
        search_pattern = f"%{keyword}%"
        query = query.filter(
            (User.username.like(search_pattern)) | (User.nickname.like(search_pattern))
        )
    
    return query.offset((page - 1) * page_size).limit(page_size).all()


def count_search_users_by_keyword(db: Session, tenant_id: Optional[int], keyword: str, exclude_user_id: Optional[int] = None) -> int:
    """统计搜索结果数量"""
    query = db.query(User).filter(
        User.deleted_at.is_(None)
    )
    
    if tenant_id:
        query = query.filter(User.tenant_id == tenant_id)
    
    if exclude_user_id:
        query = query.filter(User.id != exclude_user_id)
    
    if keyword:
        search_pattern = f"%{keyword}%"
        query = query.filter(
            (User.username.like(search_pattern)) | (User.nickname.like(search_pattern))
        )
    
    return query.count()


def create_user(db: Session, user: User) -> User:
    """创建用户"""
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        logger.error(f"创建用户失败: {e}")
        raise


def update_user(db: Session, user: User, **kwargs) -> User:
    """更新用户"""
    try:
        for key, value in kwargs.items():
            setattr(user, key, value)
        user.updated_at = datetime.now()
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        db.rollback()
        logger.error(f"更新用户失败: {e}")
        raise


def update_user_status(db: Session, user_id: int, status: str) -> bool:
    """更新用户状态"""
    try:
        user = get_user_by_id(db, user_id)
        if user:
            user.status = status
            user.updated_at = datetime.now()
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"更新用户状态失败: {e}")
        raise


def soft_delete_user(db: Session, user_id: int) -> bool:
    """软删除用户"""
    try:
        user = get_user_by_id(db, user_id)
        if user:
            user.deleted_at = datetime.now()
            user.status = UserStatus.DELETED
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"软删除用户失败: {e}")
        raise


def update_last_login(db: Session, user_id: int) -> bool:
    """更新用户最后登录时间"""
    try:
        user = get_user_by_id(db, user_id)
        if user:
            user.last_login_at = datetime.now()
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"更新登录时间失败: {e}")
        return False


# Refresh Token DAO
def get_refresh_token_by_token(db: Session, token: str) -> Optional[RefreshTokenModel]:
    """根据token查询刷新令牌"""
    return db.query(RefreshTokenModel).filter(RefreshTokenModel.token == token).first()


def get_refresh_tokens_by_user(db: Session, user_id: int) -> List[RefreshTokenModel]:
    """查询用户的所有刷新令牌"""
    return db.query(RefreshTokenModel).filter(RefreshTokenModel.user_id == user_id).all()


def create_refresh_token(db: Session, refresh_token: RefreshTokenModel) -> RefreshTokenModel:
    """创建刷新令牌"""
    try:
        db.add(refresh_token)
        db.commit()
        db.refresh(refresh_token)
        return refresh_token
    except Exception as e:
        db.rollback()
        logger.error(f"创建刷新令牌失败: {e}")
        raise


def delete_refresh_tokens_by_user(db: Session, user_id: int) -> bool:
    """删除用户的所有刷新令牌"""
    try:
        db.query(RefreshTokenModel).filter(RefreshTokenModel.user_id == user_id).delete()
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"删除刷新令牌失败: {e}")
        raise


def delete_refresh_token(db: Session, token: str) -> bool:
    """删除单个刷新令牌"""
    try:
        db.query(RefreshTokenModel).filter(RefreshTokenModel.token == token).delete()
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"删除刷新令牌失败: {e}")
        raise


def revoke_refresh_token(db: Session, token: str) -> bool:
    """撤销刷新令牌"""
    try:
        rt = get_refresh_token_by_token(db, token)
        if rt:
            rt.revoked = True
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"撤销刷新令牌失败: {e}")
        raise