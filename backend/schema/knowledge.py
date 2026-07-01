"""知识库相关数据模型"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
from datetime import datetime


class KnowledgeBaseCreate(BaseModel):
    """创建知识库请求"""
    name: str = Field(..., max_length=100, description="知识库名称")
    description: Optional[str] = Field(None, description="描述")
    type: str = Field("personal", description="类型: personal/group/tenant/public")
    group_id: Optional[int] = Field(None, description="群ID(群知识库)")
    provider_type: str = Field("local", description="知识库类型: local/dify")
    chroma_config_id: Optional[int] = Field(None, description="Chroma配置ID(本地库)")
    dify_provider_id: Optional[int] = Field(None, description="Dify Provider ID(Dify库)")
    embedding_model_id: Optional[int] = Field(None, description="Embedding模型ID(本地库)")
    rerank_model_id: Optional[int] = Field(None, description="Rerank模型ID(本地库)")
    embedding_model: Optional[str] = Field(None, description="Dify Embedding模型名")
    embedding_model_provider: Optional[str] = Field(None, description="Dify Embedding模型提供商")
    rerank_model: Optional[str] = Field(None, description="Dify Rerank模型名")
    rerank_model_provider: Optional[str] = Field(None, description="Dify Rerank模型提供商")
    chunk_size: int = Field(500, description="分片大小")
    chunk_overlap: int = Field(50, description="分片重叠")


class KBDeleteRequest(BaseModel):
    """删除知识库请求"""
    delete_remote: bool = Field(False, description="是否同时删除云端数据（Dify Dataset）")


class KnowledgeBaseUpdate(BaseModel):
    """更新知识库请求"""
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    embedding_model_id: Optional[int] = None
    rerank_model_id: Optional[int] = None
    embedding_model: Optional[str] = None
    embedding_model_provider: Optional[str] = None
    rerank_model: Optional[str] = None
    rerank_model_provider: Optional[str] = None
    chunk_size: Optional[int] = None
    chunk_overlap: Optional[int] = None


class KnowledgeBaseResponse(BaseModel):
    """知识库响应"""
    id: int
    tenant_id: int
    owner_id: int
    name: str
    description: Optional[str] = None
    type: str
    provider_type: str
    group_id: Optional[int] = None
    chroma_config_id: Optional[int] = None
    dify_provider_id: Optional[int] = None
    dify_dataset_id: Optional[str] = None
    embedding_model_id: Optional[int] = None
    rerank_model_id: Optional[int] = None
    dify_embedding_model: Optional[str] = None
    dify_embedding_model_provider: Optional[str] = None
    dify_rerank_model: Optional[str] = None
    dify_rerank_model_provider: Optional[str] = None
    chunk_size: int
    chunk_overlap: int
    status: str
    is_public: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class KnowledgeBaseDetailResponse(BaseModel):
    """知识库详情响应"""
    id: int
    name: str
    description: Optional[str] = None
    type: str
    provider_type: str
    group_id: Optional[int] = None
    chroma_config: Optional[Dict] = None
    dify_provider: Optional[Dict] = None
    dify_dataset_id: Optional[str] = None
    embedding_model: Optional[Dict] = None
    rerank_model: Optional[Dict] = None
    dify_embedding_model: Optional[str] = None
    dify_embedding_model_provider: Optional[str] = None
    dify_rerank_model: Optional[str] = None
    dify_rerank_model_provider: Optional[str] = None
    chunk_size: int
    chunk_overlap: int
    status: str
    is_public: bool
    file_count: int
    chunk_count: int
    created_at: datetime


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
    original_filename: Optional[str] = None
    file_size: Optional[int] = None
    word_count: Optional[int] = None
    parse_status: str
    error_message: Optional[str] = None
    chunk_count: int
    dify_document_id: Optional[str] = None
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
    chroma_doc_id: Optional[str] = None
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


class RetrieveTestRequest(BaseModel):
    """检索测试请求"""
    query: str = Field(..., description="查询内容")
    top_k: int = Field(10, ge=1, le=50, description="返回数量")


class RetrieveTestResponse(BaseModel):
    """检索测试响应"""
    query: str
    results_count: int
    latency_ms: int
    results: List[Dict]


class QARequest(BaseModel):
    """知识问答请求"""
    query: str = Field(..., description="查询内容")
    top_k: int = Field(5, ge=1, le=20, description="引用数量")
    llm_model_id: Optional[int] = Field(None, description="指定的LLM模型ID")


class DifyAvailableModel(BaseModel):
    """Dify可用模型"""
    model: str
    label: Dict = {}
    model_type: str
    features: Optional[List[str]] = None
    fetch_from: str
    model_properties: Optional[Dict] = None
    status: str


class DifyModelProvider(BaseModel):
    """Dify模型Provider"""
    provider: str
    label: Dict = {}
    icon_small: Optional[Dict] = None
    icon_large: Optional[Dict] = None
    status: str
    models: List[DifyAvailableModel]


class DifySyncDataset(BaseModel):
    """Dify同步数据集"""
    id: str
    name: str
    description: Optional[str] = None
    embedding_model: Optional[str] = None
    embedding_model_provider: Optional[str] = None
    document_count: int = 0
    created_at: Optional[int] = None


class QAResponse(BaseModel):
    """知识问答响应"""
    query: str
    answer: str
    results_count: int
    latency_ms: int
    references: List[Dict]


class KBPermissionUpdate(BaseModel):
    """知识库权限更新请求"""
    is_public: bool = Field(..., description="是否公开")


class KBRetrievalLogResponse(BaseModel):
    """检索日志响应"""
    id: int
    query: str
    retrieval_type: str
    results_count: int
    latency_ms: Optional[int] = None
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class KBRetrievalLogListResponse(BaseModel):
    """检索日志列表响应"""
    items: List[KBRetrievalLogResponse]
    total: int
    page: int
    page_size: int
