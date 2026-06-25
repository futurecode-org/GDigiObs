from database.session import Base, engine  # 导入 SQLAlchemy 基类和数据库引擎
from fastapi import FastAPI  # 导入 FastAPI 框架
from controller.user_controller import user_router  # 导入用户路由模块

# 自动创建数据库表
Base.metadata.create_all(bind=engine)

# 创建服务器对象
app = FastAPI(title="User Management API", version="1.0.0")
app.include_router(user_router)  # 添加路由


@app.get("/")
def read_root():
    return {"msg": "Hello from backend API"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)