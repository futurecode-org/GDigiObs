from typing import Any, Optional, Generic, TypeVar, List
from pydantic import BaseModel, Field
from datetime import datetime

T = TypeVar("T")


class ResponseCode:
    """响应码定义"""
    SUCCESS = 0
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    INTERNAL_ERROR = 500
    BUSINESS_ERROR = 600


class ApiResponse(BaseModel, Generic[T]):
    """统一API响应格式"""
    code: int = Field(default=ResponseCode.SUCCESS, description="响应码，0为成功")
    message: str = Field(default="success", description="响应消息")
    data: Optional[T] = Field(default=None, description="响应数据")
    request_id: Optional[str] = Field(default=None, description="请求ID")
    
    @classmethod
    def success(cls, data: T = None, message: str = "success") -> "ApiResponse[T]":
        """成功响应"""
        return cls(code=ResponseCode.SUCCESS, message=message, data=data)
    
    @classmethod
    def error(cls, code: int = ResponseCode.BAD_REQUEST, message: str = "", data: T = None) -> "ApiResponse[T]":
        """错误响应"""
        return cls(code=code, message=message, data=data)


class PaginatedData(BaseModel, Generic[T]):
    """分页数据结构"""
    items: List[T] = Field(default_factory=list, description="数据列表")
    total: int = Field(default=0, description="总数")
    page: int = Field(default=1, description="当前页")
    page_size: int = Field(default=20, description="每页大小")
    total_pages: int = Field(default=0, description="总页数")

    def __init__(self, **data: Any):
        super().__init__(**data)
        if self.page_size > 0 and self.total_pages == 0:
            self.total_pages = (self.total + self.page_size - 1) // self.page_size


class PaginatedResponse(ApiResponse[PaginatedData[T]]):
    """分页响应"""
    pass
