from pydantic import BaseModel, Field  # 导入 Pydantic 数据模型和字段验证工具
from datetime import datetime  # 导入 datetime 用于时间类型字段


class UserRegister(BaseModel):
    """
    用户注册请求模型
    包含用户名、密码、邮箱等字段
    """
    username: str = Field(..., description="用户名", min_length=4, max_length=20)
    password: str = Field(..., description="密码", min_length=8, max_length=20)
    email: str = Field(..., description="邮箱", min_length=4, max_length=50)


class UserLogin(BaseModel):
    """
    用户登录请求模型
    包含用户名、密码等字段
    """
    username: str = Field(..., description="用户名", min_length=4, max_length=20)
    password: str = Field(..., description="密码", min_length=8, max_length=20)

class UserResponse(BaseModel):
    """
    用户响应模型
    包含用户 ID、用户名、邮箱等字段
    """
    id: int = Field(..., description="用户 ID")
    username: str = Field(..., description="用户名")
    email: str = Field(..., description="邮箱")
    is_active: bool = Field(..., description="是否激活")
    created_at: datetime = Field(..., description="创建时间")
    updated_at: datetime | None = Field(None, description="更新时间")


class TokenResponse(BaseModel):
    """
    令牌响应模型
    包含访问令牌、刷新令牌等字段
    """
    access_token: str = Field(..., description="访问令牌")
    refresh_token: str = Field(..., description="刷新令牌")
    token_type: str = "bearer"

class RefreshToken(BaseModel):
    """
    刷新令牌模型
    包含刷新令牌等字段
    """
    token: str = Field(..., description="刷新令牌")
