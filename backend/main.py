from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)

from database.session import Base, engine, get_db, Session
from controller.auth_controller import auth_router
from controller.user_controller import user_router
from controller.tenant_controller import tenant_router
from controller.rbac_controller import rbac_router
from controller.conversation_controller import conversation_router
from controller.group_controller import group_router, friend_router
from controller.collect_controller import collect_router
from controller.clean_controller import clean_router
from controller.analysis_controller import analysis_router
from controller.chroma_config_controller import chroma_config_router
from controller.knowledge_controller import knowledge_router
from controller.model_config_controller import model_router
from controller.skill_controller import skill_router
from controller.agent_controller import agent_router
from controller.workflow_controller import workflow_router
from controller.notification_controller import notification_router
from controller.file_controller import file_router
from controller.audit_controller import audit_router, ask_router
from controller.dify_controller import dify_router, assistant_router
from controller.ws_controller import ws_router
from controller.organization_controller import org_router
from controller.dashboard_controller import dashboard_router
from core.exceptions import (
    BusinessException,
    business_exception_handler,
    generic_exception_handler,
    http_exception_handler,
)
from core.response import ApiResponse
from core.config import settings
from service.auth_service import init_system


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时：初始化数据库（创建缺失表 + 添加缺失列）
    from database.migrate import init_database

    init_database()

    # 初始化系统角色和权限
    db = Session()
    try:
        init_system(db)
    finally:
        db.close()

    # 启动采集调度器
    from service.scheduler_service import start_scheduler, load_scheduled_tasks, load_chat_ai_detection_schedule

    await start_scheduler()
    await load_scheduled_tasks()
    await load_chat_ai_detection_schedule()

    yield

    # 关闭时：停止调度器
    from service.scheduler_service import shutdown_scheduler

    await shutdown_scheduler()


# 创建FastAPI应用
app = FastAPI(
    title="数智瞭望系统 API",
    description="数智瞭望系统后端服务 - 多租户、RBAC权限、即时通讯、智能问数、知识库、数字员工、工作流",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 配置 - 从环境变量读取
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.cors_allow_methods_list,
    allow_headers=settings.cors_allow_headers_list,
)

# 注册异常处理器
app.add_exception_handler(BusinessException, business_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# 注册路由
app.include_router(auth_router, prefix="/api/v1")
app.include_router(user_router, prefix="/api/v1")
app.include_router(tenant_router, prefix="/api/v1")
app.include_router(rbac_router, prefix="/api/v1")
app.include_router(conversation_router, prefix="/api/v1")
app.include_router(group_router, prefix="/api/v1")
app.include_router(friend_router, prefix="/api/v1")
app.include_router(collect_router, prefix="/api/v1")
app.include_router(clean_router, prefix="/api/v1")
app.include_router(analysis_router, prefix="/api/v1")
app.include_router(knowledge_router, prefix="/api/v1")
app.include_router(chroma_config_router, prefix="/api/v1")
app.include_router(model_router, prefix="/api/v1")
app.include_router(skill_router, prefix="/api/v1")
app.include_router(agent_router, prefix="/api/v1")
app.include_router(workflow_router, prefix="/api/v1")
app.include_router(notification_router, prefix="/api/v1")
app.include_router(file_router, prefix="/api/v1")
app.include_router(audit_router, prefix="/api/v1")
app.include_router(ask_router, prefix="/api/v1")
app.include_router(dify_router, prefix="/api/v1")
app.include_router(assistant_router, prefix="/api/v1")
app.include_router(org_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")
app.include_router(ws_router)


@app.get("/", tags=["Root"])
def read_root():
    """API根路径"""
    return ApiResponse.success(
        data={
            "name": "数智瞭望系统 API",
            "version": "1.0.0",
            "docs": "/docs",
            "redoc": "/redoc",
        }
    )


@app.get("/health", tags=["Health"])
def health_check():
    """健康检查"""
    return ApiResponse.success(data={"status": "healthy"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=settings.UVICORN_HOST, port=settings.UVICORN_PORT)
