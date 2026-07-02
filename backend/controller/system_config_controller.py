"""系统配置控制器"""

from pathlib import Path
from typing import Dict

from fastapi import APIRouter
from sqlalchemy import create_engine, text

from core.config import PROJECT_ROOT, settings
from core.dependencies import require_admin
from core.response import ApiResponse
from schema.system_config import (
    DatabaseConfigResponse,
    DatabaseConfigSaveResponse,
    DatabaseConfigUpdate,
    DatabaseConnectionTestRequest,
    DatabaseConnectionTestResponse,
)


system_config_router = APIRouter(prefix="/system", tags=["系统配置"])


ENV_PATH = PROJECT_ROOT / ".env"


def _mask_database_url(url: str) -> str:
    if "://" not in url or "@" not in url:
        return url
    scheme, rest = url.split("://", 1)
    auth, host = rest.split("@", 1)
    if ":" not in auth:
        return url
    user = auth.split(":", 1)[0]
    return f"{scheme}://{user}:******@{host}"


def _build_database_url(data: DatabaseConfigUpdate) -> str:
    database_type = data.database_type.lower()
    if database_type == "sqlite":
        sqlite_path = data.sqlite_database_path or settings.SQLITE_DATABASE_PATH
        db_path = Path(sqlite_path)
        if not db_path.is_absolute():
            db_path = PROJECT_ROOT / db_path
        return f"sqlite:///{db_path}"

    host = data.database_host or settings.DATABASE_HOST
    port = data.database_port or settings.DATABASE_PORT
    name = data.database_name or settings.DATABASE_NAME
    user = data.database_user or settings.DATABASE_USER
    password = data.database_password if data.database_password is not None else settings.DATABASE_PASSWORD
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}?charset=utf8mb4"


def _read_env_lines() -> list[str]:
    if not ENV_PATH.exists():
        return []
    return ENV_PATH.read_text(encoding="utf-8").splitlines()


def _write_env_values(values: Dict[str, str]) -> None:
    lines = _read_env_lines()
    remaining = dict(values)
    new_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in line:
            new_lines.append(line)
            continue

        key = line.split("=", 1)[0].strip()
        if key in remaining:
            new_lines.append(f"{key}={remaining.pop(key)}")
        else:
            new_lines.append(line)

    if remaining and new_lines and new_lines[-1] != "":
        new_lines.append("")
    for key, value in remaining.items():
        new_lines.append(f"{key}={value}")

    ENV_PATH.write_text("\n".join(new_lines) + "\n", encoding="utf-8")


def _database_response() -> DatabaseConfigResponse:
    return DatabaseConfigResponse(
        database_type=settings.DATABASE_TYPE.lower(),
        database_host=settings.DATABASE_HOST,
        database_port=settings.DATABASE_PORT,
        database_name=settings.DATABASE_NAME,
        database_user=settings.DATABASE_USER,
        sqlite_database_path=settings.SQLITE_DATABASE_PATH,
        active_database_url=_mask_database_url(settings.DATABASE_URL),
    )


@system_config_router.get("/database-config", summary="获取数据库配置")
def get_database_config(ctx= require_admin()):
    return ApiResponse.success(data=_database_response())


@system_config_router.put("/database-config", summary="更新数据库配置")
def update_database_config(data: DatabaseConfigUpdate, ctx= require_admin()):
    env_values = {
        "DATABASE_TYPE": data.database_type,
        "DATABASE_HOST": data.database_host or settings.DATABASE_HOST,
        "DATABASE_PORT": str(data.database_port or settings.DATABASE_PORT),
        "DATABASE_NAME": data.database_name or settings.DATABASE_NAME,
        "DATABASE_USER": data.database_user or settings.DATABASE_USER,
        "SQLITE_DATABASE_PATH": data.sqlite_database_path or settings.SQLITE_DATABASE_PATH,
    }
    if data.database_password is not None and data.database_password != "":
        env_values["DATABASE_PASSWORD"] = data.database_password

    _write_env_values(env_values)
    return ApiResponse.success(
        data=DatabaseConfigSaveResponse(database_type=data.database_type),
        message="数据库配置已保存，重启后生效",
    )


@system_config_router.post("/database-config/test", summary="测试数据库连接")
def test_database_config(data: DatabaseConnectionTestRequest, ctx= require_admin()):
    url = _build_database_url(data)
    engine_options = {}
    if data.database_type == "sqlite":
        db_path = Path(url.replace("sqlite:///", ""))
        db_path.parent.mkdir(parents=True, exist_ok=True)
        engine_options["connect_args"] = {"check_same_thread": False}

    test_engine = None
    try:
        test_engine = create_engine(url, **engine_options)
        with test_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        result = DatabaseConnectionTestResponse(success=True, message="连接成功")
    except Exception as exc:
        result = DatabaseConnectionTestResponse(success=False, message=str(exc))
    finally:
        if test_engine is not None:
            test_engine.dispose()

    return ApiResponse.success(data=result)
