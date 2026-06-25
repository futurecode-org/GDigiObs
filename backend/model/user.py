from database.session import Base  # 从 database.session 导入 SQLAlchemy 的 Base 基类
from sqlalchemy import Column, Integer, String, Boolean, DateTime  # 导入 SQLAlchemy 列类型
from datetime import datetime  # 导入 datetime 用于时间戳字段
class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, index=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)



