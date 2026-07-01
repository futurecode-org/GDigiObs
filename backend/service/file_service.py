"""文件管理业务逻辑层"""
import os
import uuid
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime

from dao.file_dao import get_files, count_files, get_file_by_id, create_file, delete_file
from core.exceptions import NotFoundException, ForbiddenException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def get_files_service(db: Session, ctx: RequestContext, file_type: str = None,
                      usage_type: str = None, page: int = 1, page_size: int = 50) -> Dict:
    """获取文件列表"""
    files = get_files(db, ctx.tenant_id, None, file_type, usage_type, page, page_size)
    total = count_files(db, ctx.tenant_id)
    
    file_list = []
    for file_asset in files:
        file_list.append({
            "id": file_asset.id,
            "filename": file_asset.filename,
            "original_filename": file_asset.original_filename,
            "file_type": file_asset.file_type,
            "file_size": file_asset.file_size,
            "mime_type": file_asset.mime_type,
            "usage_type": file_asset.usage_type,
            "created_at": file_asset.created_at
        })
    
    return {
        "items": file_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_file_detail_service(db: Session, ctx: RequestContext, file_id: int) -> Dict:
    """获取文件详情"""
    file_asset = get_file_by_id(db, file_id)
    if not file_asset:
        raise NotFoundException("文件不存在")
    
    if not ctx.is_super_admin and file_asset.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此文件")
    
    return {
        "id": file_asset.id,
        "filename": file_asset.filename,
        "original_filename": file_asset.original_filename,
        "file_type": file_asset.file_type,
        "file_size": file_asset.file_size,
        "storage_path": file_asset.storage_path,
        "mime_type": file_asset.mime_type,
        "usage_type": file_asset.usage_type,
        "created_at": file_asset.created_at
    }


def upload_file_service(db: Session, ctx: RequestContext, file,
                        usage_type: str = "general") -> Dict:
    """上传文件"""
    filename = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}" if "." in file.filename else str(uuid.uuid4())
    original_filename = file.filename
    
    # 文件上传目录：backend/uploads/{tenant_id}
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads", str(ctx.tenant_id))
    os.makedirs(upload_dir, exist_ok=True)
    
    storage_path = os.path.join(upload_dir, filename)
    
    with open(storage_path, "wb") as f:
        f.write(file.file.read())
    
    file_type = file.filename.split('.')[-1].lower() if "." in file.filename else "unknown"
    file_size = os.path.getsize(storage_path)
    mime_type = getattr(file, "content_type", None)
    
    file_asset = create_file(
        db, ctx.tenant_id, ctx.user_id, filename, original_filename,
        file_type, file_size, storage_path, mime_type, usage_type
    )
    
    logger.info(f"上传文件: file_id={file_asset.id}, filename={original_filename}")
    
    return {
        "id": file_asset.id,
        "filename": file_asset.filename,
        "original_filename": file_asset.original_filename,
        "file_type": file_asset.file_type,
        "file_size": file_asset.file_size,
        "usage_type": file_asset.usage_type,
        "created_at": file_asset.created_at
    }


def delete_file_service(db: Session, ctx: RequestContext, file_id: int):
    """删除文件"""
    file_asset = get_file_by_id(db, file_id)
    if not file_asset:
        raise NotFoundException("文件不存在")
    
    if not ctx.is_super_admin and file_asset.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除此文件")
    
    if file_asset.uploader_id != ctx.user_id and not ctx.is_super_admin:
        raise ForbiddenException("无权删除此文件")
    
    delete_file(db, file_id)
    logger.info(f"删除文件: file_id={file_id}")