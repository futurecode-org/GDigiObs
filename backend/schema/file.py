"""文件管理相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class FileAssetResponse(BaseModel):
    """文件资源响应"""
    id: int
    tenant_id: int
    uploader_id: int
    filename: str
    original_filename: str
    file_type: str
    file_size: int
    storage_path: str
    mime_type: Optional[str] = None
    usage_type: str
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class FileAssetListResponse(BaseModel):
    """文件资源列表响应"""
    items: List[FileAssetResponse]
    total: int
    page: int
    page_size: int