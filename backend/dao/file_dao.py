"""文件资源数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc
from typing import List, Optional
from datetime import datetime

from model.file import FileAsset


def get_files(db: Session, tenant_id: int, uploader_id: int = None,
              file_type: str = None, usage_type: str = None,
              page: int = 1, page_size: int = 50) -> List[FileAsset]:
    """获取文件列表"""
    query = db.query(FileAsset).filter(
        FileAsset.tenant_id == tenant_id,
        FileAsset.status == "active"
    )
    
    if uploader_id:
        query = query.filter(FileAsset.uploader_id == uploader_id)
    
    if file_type:
        query = query.filter(FileAsset.file_type == file_type)
    
    if usage_type:
        query = query.filter(FileAsset.usage_type == usage_type)
    
    return query.order_by(desc(FileAsset.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_files(db: Session, tenant_id: int) -> int:
    """统计文件数量"""
    return db.query(FileAsset).filter(
        FileAsset.tenant_id == tenant_id,
        FileAsset.status == "active"
    ).count()


def get_file_by_id(db: Session, file_id: int) -> Optional[FileAsset]:
    """获取文件详情"""
    return db.query(FileAsset).filter(
        FileAsset.id == file_id,
        FileAsset.status == "active"
    ).first()


def create_file(db: Session, tenant_id: int, uploader_id: int, filename: str,
                original_filename: str, file_type: str, file_size: int,
                storage_path: str, mime_type: str = None, usage_type: str = "general") -> FileAsset:
    """创建文件记录"""
    file_asset = FileAsset(
        tenant_id=tenant_id,
        uploader_id=uploader_id,
        filename=filename,
        original_filename=original_filename,
        file_type=file_type,
        file_size=file_size,
        storage_path=storage_path,
        mime_type=mime_type,
        usage_type=usage_type
    )
    db.add(file_asset)
    db.commit()
    return file_asset


def delete_file(db: Session, file_id: int) -> bool:
    """删除文件（软删除）"""
    file_asset = get_file_by_id(db, file_id)
    if not file_asset:
        return False
    
    file_asset.status = "deleted"
    db.commit()
    return True