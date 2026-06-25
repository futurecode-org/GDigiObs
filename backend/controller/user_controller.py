from database.session import Session, get_db  # 导入数据库会话和依赖注入函数
from schema.user import TokenResponse, RefreshToken, UserLogin, UserRegister, UserResponse  # 导入 Pydantic 请求和响应模型
from fastapi import APIRouter, Depends  # 导入 FastAPI 路由和依赖注入工具
from service.user_service import register_user, login_user,logout_user ,get_user_info_by_username,refresh_access_token_by_refresh_token # 导入用户注册服务函数
from core.security import get_current_user  # 导入全局的鉴权依赖，获取当前的用户信息
from model.user import User  # 导入用户模型



user_router = APIRouter(prefix="/user",tags=["User 用户认证"])
@user_router.post("/register", response_model=UserResponse)
def register(user:UserRegister,db:Session = Depends(get_db)):
    """
    用户注册接口<br>
    包含用户名、密码、邮箱等字段
    """
    new_user = register_user(db,user)
    return new_user



@user_router.post("/login", response_model=TokenResponse)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    用户登录接口<br>
    包含用户名和密码字段
    """
    access_token,refresh_token = login_user(db,user)
    return TokenResponse(access_token=access_token,refresh_token=refresh_token)
   


@user_router.post("/logout")
def logout(refresh_token: RefreshToken, db: Session = Depends(get_db)):
    """
    用户退出登录接口<br>
    刷新 token 失效
    """
    # TODO: 实现 token 黑名单或删除 refresh token
    logout_user(db, refresh_token.token)
    return {"message": "退出登录成功"}


@user_router.get("/info/{username}", response_model=UserResponse)
def get_user_info(username: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    用户信息接口<br>
    根据用户名获取用户信息（需要认证）
    """
    return get_user_info_by_username(db, username)

@user_router.post("/refresh", response_model=TokenResponse)
def refresh_access_token(refresh_token: RefreshToken, db: Session = Depends(get_db)):
    """
    刷新令牌接口<br>
    使用 refresh token 刷新 access token 和 refresh token
    """
    access_token, new_refresh_token = refresh_access_token_by_refresh_token(db, refresh_token.token)
    return TokenResponse(access_token=access_token, refresh_token=new_refresh_token)
   
@user_router.get("/profile",response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    """
    获取当前用户信息接口
    """
    return current_user

