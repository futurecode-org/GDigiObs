from typing import Literal, Optional

from pydantic import BaseModel, Field


DatabaseType = Literal["mysql", "sqlite"]


class DatabaseConfigResponse(BaseModel):
    database_type: DatabaseType
    database_host: str
    database_port: int
    database_name: str
    database_user: str
    sqlite_database_path: str
    active_database_url: str


class DatabaseConfigUpdate(BaseModel):
    database_type: DatabaseType = Field(..., description="数据库类型: mysql/sqlite")
    database_host: Optional[str] = Field(None, max_length=255)
    database_port: Optional[int] = Field(None, ge=1, le=65535)
    database_name: Optional[str] = Field(None, max_length=255)
    database_user: Optional[str] = Field(None, max_length=255)
    database_password: Optional[str] = Field(None, max_length=1024)
    sqlite_database_path: Optional[str] = Field(None, max_length=1024)


class DatabaseConfigSaveResponse(BaseModel):
    restart_required: bool = True
    database_type: DatabaseType


class DatabaseConnectionTestRequest(DatabaseConfigUpdate):
    pass


class DatabaseConnectionTestResponse(BaseModel):
    success: bool
    message: str
