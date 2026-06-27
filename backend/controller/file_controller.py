"""文件管理控制器"""
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from database.session import get_db
from schema.file import FileAssetResponse, FileAssetListResponse
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context
from service.file_service import (
    get_files_service, get_file_detail_service, upload_file_service, delete_file_service
)

from model.user import User


file_router = APIRouter(prefix="/files", tags=["文件管理 File"])


@file_router.get("", summary="获取文件列表")
def list_files(
    file_type: str = None,
    usage_type: str = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取文件列表"""
    ctx = get_request_context(current_user)
    result = get_files_service(db, ctx, file_type, usage_type, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@file_router.get("/{file_id}", summary="获取文件详情")
def get_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取文件详情"""
    ctx = get_request_context(current_user)
    result = get_file_detail_service(db, ctx, file_id)
    return ApiResponse.success(data=result)


@file_router.post("/upload", summary="上传文件")
def upload_file(
    file: UploadFile = File(...),
    usage_type: str = "general",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """上传文件"""
    ctx = get_request_context(current_user)
    result = upload_file_service(db, ctx, file, usage_type)
    return ApiResponse.success(data=result)


@file_router.delete("/{file_id}", summary="删除文件")
def delete_file(
    file_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除文件"""
    ctx = get_request_context(current_user)
    delete_file_service(db, ctx, file_id)
    return ApiResponse.success(message="文件已删除")