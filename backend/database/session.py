from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from core.config import settings  # 导入项目配置，获取数据库连接 URL
from sqlalchemy.ext.declarative import declarative_base



engine = create_engine(
    settings.DATABASE_URL,
    pool_size=1,
    max_overflow=2,
    pool_recycle=3600,
    pool_pre_ping=True,
    )

Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 依赖注入数据库的会话
def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()