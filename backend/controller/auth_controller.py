from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.auth import UserRegister, UserLogin, TokenResponse, RefreshTokenRequest, CurrentUserResponse, LogoutRequest
from core.response import ApiResponse
from core.dependencies import get_current_user, get_request_context, RequestContext
from service.auth_service import register_user, login_user, refresh_token, logout_user, get_current_user_info

from model.user import User


auth_router = APIRouter(prefix="/auth", tags=["认证 Auth"])


@auth_router.post("/register", summary="用户注册")
def register(register_data: UserRegister, db: Session = Depends(get_db)):
    """
    用户注册接口
    
    - 支持用户名、邮箱、手机号注册
    - 未填写企业邀请码时自动创建个人租户
    - 注册成功后自动分配普通用户角色
    """
    user = register_user(db, register_data)
    return ApiResponse.success(data={"id": user.id, "username": user.username}, message="注册成功")


@auth_router.post("/login", summary="用户登录")
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    用户登录接口
    
    - 支持用户名、邮箱、手机号登录
    - 返回access_token和refresh_token
    - 登录失败会返回相应错误信息
    """
    token_response = login_user(db, login_data)
    return ApiResponse.success(data=token_response)


@auth_router.post("/refresh", summary="刷新Token")
def refresh(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    刷新Token接口
    
    - 使用refresh_token获取新的access_token
    - 同时返回新的refresh_token
    """
    token_response = refresh_token(db, request.refresh_token)
    return ApiResponse.success(data=token_response)


@auth_router.post("/logout", summary="退出登录")
def logout(request: LogoutRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    退出登录接口
    
    - 删除用户的刷新令牌
    - 用户需要重新登录才能继续使用
    """
    logout_user(db, current_user.id, request.refresh_token)
    return ApiResponse.success(message="退出登录成功")


@auth_router.get("/me", summary="获取当前用户信息")
def get_me(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    获取当前用户信息
    
    - 返回用户基本信息、租户信息、角色、权限、菜单
    - 前端根据返回信息渲染路由和权限控制
    """
    user_info = get_current_user_info(db, current_user)
    return ApiResponse.success(data=user_info)