from database.session import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from datetime import datetime
class RefreshTokenModel(Base):
    __tablename__ = "refresh_token"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer,  ForeignKey("user.id"),index=True)  # 逻辑上认为有一个外键即可
    token = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    expire_time = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, onupdate=datetime.now)