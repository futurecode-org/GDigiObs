from model.refresh_token import RefreshTokenModel
from core.security import get_password_hash, verify_password, create_access_token, create_refresh_token  # 导入密码加密、校验和 JWT 创建函数
from dao.user_dao import get_user_by_username, get_user_by_email, save_user, delete_refresh_tokens, save_refresh_token, delete_refresh_token_by_token, get_user_by_id, get_refresh_token_by_token  # 导入用户数据访问函数
from database.session import Session  # 导入数据库会话
from schema.user import UserLogin, UserRegister, RefreshToken  # 导入 Pydantic 请求和响应模型
from model.user import User  # 导入用户 ORM 模型
from fastapi import HTTPException  # 导入 HTTP 异常类
from datetime import datetime  # 导入 datetime 用于设置创建时间

def register_user(db:Session,user:UserRegister):
    """
    用户注册服务
    包含用户名、密码、邮箱等字段
    """
    # 先判断用户是否已经注册
    existing_user = get_user_by_username(db,user.username)
    if existing_user:
        raise HTTPException(status_code=400,detail="用户名已存在")
    # 判断邮箱是否已经被注册
    existing_email = get_user_by_email(db,user.email)
    if existing_email:
        raise HTTPException(status_code=400,detail="邮箱已存在")
    # 创建用户
    # 先把密码进行加密操作
    hashed_pwd = get_password_hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_pwd,
        created_at=datetime.now()  # 显式设置创建时间
    )
    new_user = save_user(db,new_user)
    return new_user


def login_user(db:Session,user:UserLogin):
    """
    用户登录服务
    """
    # 先判断用户是否已经注册
    existing_user = get_user_by_username(db,user.username)
    if not existing_user:
        raise HTTPException(status_code=400,detail="用户名不存在")
    # 校验密码
    if not verify_password(user.password,existing_user.password):
        raise HTTPException(status_code=400,detail="密码错误")
    #账号和密码都通过了
    #先清除一下用户之前的刷新token
    delete_refresh_tokens(db,existing_user.id)
    # 先生成两个token
    access_token = create_access_token(existing_user.username)
    refresh_token,expire_time = create_refresh_token(existing_user.username)

    # 存入新的refreshtoken
    new_refresh_token = RefreshTokenModel(
        user_id=existing_user.id,
        token=refresh_token,
        expire_time=expire_time
    )
    save_refresh_token(db,new_refresh_token)

    return access_token,refresh_token

def logout_user(db:Session,refresh_token:str):
    """
    登出操作
    """
    return delete_refresh_token_by_token(db,refresh_token)



def get_user_info_by_username(db:Session,username:str):
    """
    获取用户信息
    """
    user = get_user_by_username(db,username)
    if not user:
        raise HTTPException(status_code=400,detail="用户名不存在")
    return user

def refresh_access_token_by_refresh_token(db: Session, refresh_token: str):
    """
    刷新 access token 和 refresh token
    """
    # 先判断刷新token是否存在
    refresh_token_model = get_refresh_token_by_token(db, refresh_token)
    if not refresh_token_model:
        raise HTTPException(status_code=400, detail="刷新 token不存在")
    # 判断刷新token是否已经过期
    if refresh_token_model.expire_time < datetime.now():
        raise HTTPException(status_code=400, detail="刷新 token 已过期")
    # 查询用户
    user = get_user_by_id(db, refresh_token_model.user_id)
    if not user:
        raise HTTPException(status_code=400, detail="用户不存在")

    # 删除旧的刷新令牌
    delete_refresh_token_by_token(db, refresh_token)

    # 生成新的访问令牌和刷新令牌
    new_access_token = create_access_token(user.username)
    new_refresh_token, expire_time = create_refresh_token(user.username)

    # 存入新的刷新令牌
    new_refresh_token_model = RefreshTokenModel(
        user_id=user.id,
        token=new_refresh_token,
        expire_time=expire_time
    )
    save_refresh_token(db, new_refresh_token_model)

    return new_access_token, new_refresh_token
