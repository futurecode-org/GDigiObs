from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from database.session import Base
from model.base import BaseModelMixin


class FileAsset(Base, BaseModelMixin):
    """文件资源表"""
    __tablename__ = "file_assets"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    uploader_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="上传者ID")
    filename = Column(String(255), nullable=False, comment="文件名")
    original_filename = Column(String(255), nullable=False, comment="原始文件名")
    file_type = Column(String(50), nullable=False, comment="文件类型/扩展名")
    file_size = Column(Integer, nullable=False, comment="文件大小(字节)")
    storage_path = Column(String(500), nullable=False, comment="存储路径")
    mime_type = Column(String(100), nullable=True, comment="MIME类型")
    usage_type = Column(String(20), default="general", comment="用途: general/avatar/chat/kb/agent")
    status = Column(String(20), default="active", comment="状态: active/deleted")