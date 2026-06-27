from sqlalchemy import Column, Integer, DateTime
from datetime import datetime


class TimestampMixin:
    """时间戳混入类，包含创建和更新时间"""
    __abstract__ = True
    created_at = Column(DateTime, default=datetime.now, nullable=False)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now, nullable=False)


class BaseModelMixin(TimestampMixin):
    """基础模型混入类，包含id和时间戳"""
    __abstract__ = True
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)