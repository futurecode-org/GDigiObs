from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Uvicorn 配置
    UVICORN_HOST: str = "0.0.0.0"
    UVICORN_PORT: int = 8000
    
    # MySQL 配置
    DATABASE_HOST: str = "47.109.147.74"
    DATA_PORT: int = 3306
    DATABASE_NAME: str = "cdut_liaowang"
    DATABASE_USER: str = "cdut_liaowang"
    DATABASE_PASSWORD: str = ""

    # JWT 配置
    JWT_SECRET_KEY: str = "123456"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    # 初始化超级管理员信息
    INITIAL_SUPER_ADMIN_USERNAME: str = "admin"
    INITIAL_SUPER_ADMIN_PASSWORD: str = "admin123"
    INITIAL_SUPER_ADMIN_EMAIL: str = ""
    INITIAL_SUPER_ADMIN_PHONE: str = ""
    INITIAL_SUPER_ADMIN_NICKNAME: str = "超级管理员"

    # CORS 配置 - 默认不允许跨域，生产环境必须显式配置
    CORS_ALLOW_ORIGINS: str = ""  # 允许的源，多个域名用逗号分隔，例如: http://localhost:3000,http://example.com
    CORS_ALLOW_CREDENTIALS: bool = False  # 是否允许携带凭证
    CORS_ALLOW_METHODS: str = ""  # 允许的方法，多个方法用逗号分隔，例如: GET,POST,PUT,DELETE
    CORS_ALLOW_HEADERS: str = ""  # 允许的头部，多个头部用逗号分隔

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATA_PORT}/{self.DATABASE_NAME}?charset=utf8mb4"

    @property
    def cors_allow_origins_list(self) -> List[str]:
        """将CORS允许的源转换为列表"""
        if self.CORS_ALLOW_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ALLOW_ORIGINS.split(",") if origin.strip()]

    @property
    def cors_allow_methods_list(self) -> List[str]:
        """将CORS允许的方法转换为列表"""
        if self.CORS_ALLOW_METHODS == "*":
            return ["*"]
        return [method.strip() for method in self.CORS_ALLOW_METHODS.split(",") if method.strip()]

    @property
    def cors_allow_headers_list(self) -> List[str]:
        """将CORS允许的头部转换为列表"""
        if self.CORS_ALLOW_HEADERS == "*":
            return ["*"]
        return [header.strip() for header in self.CORS_ALLOW_HEADERS.split(",") if header.strip()]

    model_config = {"env_file": Path(__file__).parent.parent.parent / ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()