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
    provider_type = Column(String(20), default="local", comment="知识库类型: local/dify")
    chroma_config_id = Column(Integer, ForeignKey("chroma_configs.id"), nullable=True, comment="Chroma配置ID")
    dify_provider_id = Column(Integer, ForeignKey("dify_providers.id"), nullable=True, comment="Dify Provider ID")
    dify_dataset_id = Column(String(100), nullable=True, comment="Dify 知识库ID")
    embedding_model_id = Column(Integer, ForeignKey("model_configs.id"), nullable=True, comment="Embedding模型ID(本地库)")
    rerank_model_id = Column(Integer, ForeignKey("model_configs.id"), nullable=True, comment="Rerank模型ID(本地库)")
    dify_embedding_model = Column(String(100), nullable=True, comment="Dify Embedding模型名")
    dify_embedding_model_provider = Column(String(50), nullable=True, comment="Dify Embedding模型提供商")
    dify_rerank_model = Column(String(100), nullable=True, comment="Dify Rerank模型名")
    dify_rerank_model_provider = Column(String(50), nullable=True, comment="Dify Rerank模型提供商")
    chunk_size = Column(Integer, default=500, comment="分片大小")
    chunk_overlap = Column(Integer, default=50, comment="分片重叠")
    status = Column(String(20), default="draft", comment="状态: draft/indexing/ready/failed")
    is_public = Column(Boolean, default=False, comment="是否公开")
    deleted_at = Column(DateTime, nullable=True, comment="删除时间")


class KnowledgeFile(Base, BaseModelMixin):
    """知识文件表"""
    __tablename__ = "knowledge_files"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    kb_id = Column(Integer, ForeignKey("knowledge_bases.id"), nullable=False, index=True, comment="知识库ID")
    file_id = Column(Integer, ForeignKey("file_assets.id"), nullable=False, comment="文件资源ID")
    original_filename = Column(String(255), nullable=True, comment="原始文件名")
    file_size = Column(Integer, nullable=True, comment="文件大小(字节)")
    word_count = Column(Integer, nullable=True, comment="字数")
    parse_status = Column(String(20), default="uploaded", comment="解析状态: uploaded/parsing/chunking/embedding/ready/failed")
    error_message = Column(Text, nullable=True, comment="错误信息")
    chunk_count = Column(Integer, default=0, comment="分片数量")
    dify_document_id = Column(String(100), nullable=True, comment="Dify 文档ID")


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
    chroma_doc_id = Column(String(100), nullable=True, comment="Chroma 文档ID")