"""用户管理数据访问层补充"""
import logging
from typing import Optional, List
from sqlalchemy.orm import Session
from model.user import User, UserStatus

logger = logging.getLogger(__name__)


def get_all_users(db: Session, page: int = 1, page_size: int = 20) -> List[User]:
    """查询所有用户（排除已删除）"""
    query = db.query(User).filter(User.deleted_at.is_(None))
    return query.offset((page - 1) * page_size).limit(page_size).all()


def count_all_users(db: Session) -> int:
    """统计所有用户数量（排除已删除）"""
    return db.query(User).filter(User.deleted_at.is_(None)).count()
