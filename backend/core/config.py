from pathlib import Path

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_HOST: str = "47.109.147.74"
    DATA_PORT: int = 3306
    DATABASE_NAME: str = "cdut_liaowang"
    DATABASE_USER: str = "cdut_liaowang"
    DATABASE_PASSWORD: str = ""

    JWT_SECRET_KEY: str = "123456"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATA_PORT}/{self.DATABASE_NAME}?charset=utf8mb4"

    model_config = {"env_file": Path(__file__).parent.parent.parent / ".env", "env_file_encoding": "utf-8"}


settings = Settings()