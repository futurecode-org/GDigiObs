"""知识库相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class KnowledgeBaseCreate(BaseModel):
    """创建知识库请求"""
    name: str = Field(..., max_length=100, description="知识库名称")
    description: Optional[str] = Field(None, description="描述")
    type: str = Field("personal", description="类型: personal/group/tenant/public")
    group_id: Optional[int] = Field(None, description="群ID(群知识库)")
    embedding_model_id: Optional[int] = Field(None, description="Embedding模型ID")


class KnowledgeBaseUpdate(BaseModel):
    """更新知识库请求"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    embedding_model_id: Optional[int] = None


class KnowledgeBaseResponse(BaseModel):
    """知识库响应"""
    id: int
    tenant_id: int
    owner_id: int
    name: str
    description: Optional[str] = None
    type: str
    group_id: Optional[int] = None
    embedding_model_id: Optional[int] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class KnowledgeFileCreate(BaseModel):
    """创建知识文件请求"""
    kb_id: int = Field(..., description="知识库ID")
    file_id: int = Field(..., description="文件资源ID")


class KnowledgeFileResponse(BaseModel):
    """知识文件响应"""
    id: int
    tenant_id: int
    kb_id: int
    file_id: int
    parse_status: str
    error_message: Optional[str] = None
    chunk_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class KnowledgeChunkResponse(BaseModel):
    """知识分片响应"""
    id: int
    kb_id: int
    file_id: int
    chunk_index: int
    content: str
    token_count: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class KnowledgeBaseListResponse(BaseModel):
    """知识库列表响应"""
    items: List[KnowledgeBaseResponse]
    total: int
    page: int
    page_size: int


class KnowledgeFileListResponse(BaseModel):
    """知识文件列表响应"""
    items: List[KnowledgeFileResponse]
    total: int
    page: int
    page_size: int