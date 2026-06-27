from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from typing import Optional
from core.response import ApiResponse, ResponseCode


class BusinessException(Exception):
    """业务异常"""
    def __init__(self, code: int = ResponseCode.BUSINESS_ERROR, message: str = "业务错误", data: Optional[dict] = None):
        self.code = code
        self.message = message
        self.data = data
        super().__init__(self.message)


class NotFoundException(BusinessException):
    """资源不存在异常"""
    def __init__(self, message: str = "资源不存在"):
        super().__init__(code=ResponseCode.NOT_FOUND, message=message)


class UnauthorizedException(BusinessException):
    """未授权异常"""
    def __init__(self, message: str = "未授权，请先登录"):
        super().__init__(code=ResponseCode.UNAUTHORIZED, message=message)


class ForbiddenException(BusinessException):
    """无权限异常"""
    def __init__(self, message: str = "无权限访问"):
        super().__init__(code=ResponseCode.FORBIDDEN, message=message)


class BadRequestException(BusinessException):
    """请求参数错误异常"""
    def __init__(self, message: str = "请求参数错误"):
        super().__init__(code=ResponseCode.BAD_REQUEST, message=message)


class TenantDisabledException(BusinessException):
    """租户已停用异常"""
    def __init__(self, message: str = "当前租户已停用"):
        super().__init__(code=ResponseCode.FORBIDDEN, message=message)


class UserDisabledException(BusinessException):
    """用户已禁用异常"""
    def __init__(self, message: str = "当前账号已被禁用"):
        super().__init__(code=ResponseCode.FORBIDDEN, message=message)


class UserBannedException(BusinessException):
    """用户已封禁异常"""
    def __init__(self, message: str = "当前账号已被封禁"):
        super().__init__(code=ResponseCode.FORBIDDEN, message=message)


async def business_exception_handler(request: Request, exc: BusinessException) -> JSONResponse:
    """业务异常处理器"""
    return JSONResponse(
        status_code=200,
        content=ApiResponse.error(code=exc.code, message=exc.message, data=exc.data).model_dump()
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """HTTP异常处理器"""
    return JSONResponse(
        status_code=200,
        content=ApiResponse.error(code=exc.status_code, message=str(exc.detail)).model_dump()
    )