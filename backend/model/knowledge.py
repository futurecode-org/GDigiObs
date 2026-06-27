from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, JSON
from database.session import Base
from model.base import BaseModelMixin


class KnowledgeBase(Base, BaseModelMixin):
    """知识库表"""
    __tablename__ = "knowledge_bases"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建人ID")
    name = Column(String(100), nullable=False, comment="知识库名称")
    description = Column(Text, nullable=True, comment="描述")
    type = Column(String(20), default="personal", comment="类型: personal/group/tenant/public")
    group_id = Column(Integer, ForeignKey("groups.id"), nullable=True, comment="群ID(群知识库)")
    embedding_model_id = Column(Integer, ForeignKey("model_configs.id"), nullable=True, comment="Embedding模型ID")
    status = Column(String(20), default="draft", comment="状态: draft/indexing/ready/failed")
    deleted_at = Column(DateTime, nullable=True, comment="删除时间")


class KnowledgeFile(Base, BaseModelMixin):
    """知识文件表"""
    __tablename__ = "knowledge_files"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    kb_id = Column(Integer, ForeignKey("knowledge_bases.id"), nullable=False, index=True, comment="知识库ID")
    file_id = Column(Integer, ForeignKey("file_assets.id"), nullable=False, comment="文件资源ID")
    parse_status = Column(String(20), default="uploaded", comment="解析状态: uploaded/parsing/chunking/embedding/ready/failed")
    error_message = Column(Text, nullable=True, comment="错误信息")
    chunk_count = Column(Integer, default=0, comment="分片数量")


class KnowledgeChunk(Base, BaseModelMixin):
    """知识分片表"""
    __tablename__ = "knowledge_chunks"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    kb_id = Column(Integer, ForeignKey("knowledge_bases.id"), nullable=False, index=True, comment="知识库ID")
    file_id = Column(Integer, ForeignKey("knowledge_files.id"), nullable=False, comment="知识文件ID")
    chunk_index = Column(Integer, nullable=False, comment="分片序号")
    content = Column(Text, nullable=False, comment="分片文本内容")
    token_count = Column(Integer, default=0, comment="Token数量")
    embedding_vector = Column(JSON, nullable=True, comment="向量(初期用JSON存储)")
    chunk_metadata = Column(JSON, nullable=True, comment="元信息")