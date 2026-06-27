from model.user import User
from passlib.context import CryptContext  # 导入 Passlib 的密码上下文工具，用于密码哈希和校验
from datetime import timedelta, datetime, timezone  # 导入时间间隔、日期时间和 UTC 时区对象
from jose import jwt, JWTError  # 导入 jose 库的 JWT 工具，用于生成令牌
from core.config import settings  # 导入项目配置对象，读取 JWT 相关配置
from fastapi import HTTPException,Depends  # 导入 FastAPI 异常处理工具，用于抛出自定义异常
from database.session import Session, get_db  # 导入数据库会话和依赖注入函数

# 创建密码上下文，指定使用 bcrypt 算法，并自动处理已弃用算法
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")  # 初始化全局密码哈希上下文

# 密码 hash 处理：下面的函数用于校验明文密码和哈希密码是否匹配
def verify_password(plain_password: str, hashed_password: str) -> bool:  # 定义密码校验函数，返回校验结果
    return pwd_context.verify(plain_password, hashed_password)  # 使用密码上下文验证明文密码和哈希密码

# 密码 hash 处理：下面的函数用于把明文密码转换为哈希值
def get_password_hash(password: str) -> str:  # 定义密码哈希函数，返回哈希后的密码字符串
    return pwd_context.hash(password)  # 使用密码上下文生成密码哈希值


def encrypt_api_key(api_key: str) -> str:
    """加密API Key（简化实现）"""
    import base64
    return base64.b64encode(api_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    """解密API Key"""
    import base64
    return base64.b64decode(encrypted_key.encode()).decode()

# 创建 token：根据传入数据和过期时间生成 JWT 字符串
def create_access_token(username: str, expire_delta: timedelta | None = None) -> str:  # 定义创建 JWT 的函数
    
    if expire_delta:  # 如果调用方传入了自定义过期时间
        expire = datetime.now(timezone.utc) + expire_delta  # 使用当前 UTC 时间加上自定义过期时间
    else:  # 如果没有传入自定义过期时间
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)  # 使用配置中的默认过期分钟数
    to_encode = {"sub": username, "exp": expire, "type": "access"}
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)  # 使用密钥和算法编码生成 JWT 字符串


# 创建 token：根据传入数据和过期时间生成 JWT 字符串
def create_refresh_token(username: str, expire_delta: timedelta | None = None) -> str:  # 定义创建 JWT 的函数
    if expire_delta:  # 如果调用方传入了自定义过期时间
        expire = datetime.now(timezone.utc) + expire_delta  # 使用当前 UTC 时间加上自定义过期时间
    else:  # 如果没有传入自定义过期时间
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_REFRESH_TOKEN_EXPIRE_MINUTES)  # 使用配置中的默认过期分钟数
    to_encode = {"sub": username, "exp": expire, "type": "refresh"}
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM), expire  # 使用密钥和算法编码生成 JWT 字符串

def get_token_from_header(access_token: str | None = None) -> str:  # 定义从请求头获取 token 的解析操作   "bearer xxxxxxxxxx"
    """
        从请求头中获取token数据

    """
    if not access_token:  # 如果请求头中没有 token
        raise HTTPException(status_code=401, detail="未授权")  # 抛出未授权异常
    parts = access_token.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":  # 如果 token 格式错误
        raise HTTPException(status_code=401, detail="无效的 token 格式")  # 抛出无效 token 格式异常
    return parts[1]  # 返回 token 字符串

def get_current_user(token: str = Depends(get_token_from_header),db: Session = Depends(get_db)) -> User:  # 定义从 token 中获取当前用户信息的函数
    """
        全局的鉴权依赖，获取当前的用户信息
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        username = payload.get("sub")
        token_type = payload.get("type")
        expire = payload.get("exp")
        if username is None or token_type is None or expire is None or expire < datetime.now(timezone.utc).timestamp() or token_type != "access":
            raise HTTPException(status_code=401, detail="无效的 token 格式或者token")
    except JWTError:
            raise HTTPException(status_code=401, detail="无效的 token 格式")
    #  查询用户是否存在
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise HTTPException(status_code=404, detail="用户不存在")
    return user
