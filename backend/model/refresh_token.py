from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from database.session import Base
from model.base import BaseModelMixin


class RefreshTokenModel(Base, BaseModelMixin):
    """刷新令牌表"""
    __tablename__ = "refresh_tokens"
    
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False, comment="用户ID")
    token = Column(String(255), nullable=False, unique=True, index=True, comment="刷新令牌")
    expire_time = Column(DateTime, nullable=False, comment="过期时间")
    revoked = Column(Boolean, default=False, comment="是否已撤销")