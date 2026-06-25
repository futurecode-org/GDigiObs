import logging
from model.refresh_token import RefreshTokenModel
from database.session import Session  # 导入数据库会话
from model.user import User  # 导入用户模型

logger = logging.getLogger(__name__)

def get_user_by_username(db: Session, username: str):
    """
    根据用户名查询用户
    """
    return db.query(User).filter(User.username == username).first()

def get_user_by_id(db: Session, id: int):
    """
    根据用户名查询用户
    """
    return db.query(User).filter(User.id == id).first()


def get_user_by_email(db: Session, email: str):
    """
    根据邮箱查询用户
    """
    return db.query(User).filter(User.email == email).first()


def save_user(db: Session, user: User):
    """
    保存用户
    """
    try:
        db.add(user)
        db.commit()
        return user
    except Exception as e:
        db.rollback()
        logger.error(f"保存用户失败: {e}")
        return None

def delete_refresh_tokens(db: Session, user_id: int):
    """
    删除用户的所有刷新令牌
    """
    try:
        db.query(RefreshTokenModel).filter(RefreshTokenModel.user_id == user_id).delete()
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"删除用户刷新令牌失败: {e}")
        return False
    
def save_refresh_token(db: Session, refresh_token: RefreshTokenModel):
    """
    保存刷新令牌
    """
    try:
        db.add(refresh_token)
        db.commit()
        return refresh_token
    except Exception as e:
        db.rollback()
        logger.error(f"保存刷新令牌失败: {e}")
        return None

def delete_refresh_token_by_token(db: Session, token: str):
    """
    删除刷新令牌
    """
    try:
        db.query(RefreshTokenModel).filter(RefreshTokenModel.token == token).delete()
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"删除刷新令牌失败: {e}")
        return False

def get_refresh_token_by_token(db: Session, token: str):
    """
    根据刷新令牌查询刷新令牌
    """
    return db.query(RefreshTokenModel).filter(RefreshTokenModel.token == token).first()