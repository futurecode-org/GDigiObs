"""知识库管理控制器"""
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from database.session import get_db
from schema.knowledge import (
    KnowledgeBaseCreate, KnowledgeBaseUpdate, KnowledgeBaseResponse,
    KnowledgeFileCreate, KnowledgeFileResponse, KnowledgeChunkResponse,
    KnowledgeBaseListResponse, KnowledgeFileListResponse,
    RetrieveTestRequest, QARequest, KBPermissionUpdate,
    KBRetrievalLogListResponse
)
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext
from service.knowledge_service import (
    get_kbs_service, get_kb_detail_service, create_kb_service,
    update_kb_service, delete_kb_service,
    get_files_service, add_file_service, delete_file_service,
    get_chunks_service, retrieve_test_service, qa_service,
    get_kb_logs_service, update_kb_permissions_service
)
from service.file_service import upload_file_service

from model.user import User


knowledge_router = APIRouter(prefix="/knowledge", tags=["知识库管理 Knowledge"])


@knowledge_router.get("", summary="获取知识库列表")
def list_kbs(
    kb_type: str = None,
    provider_type: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取知识库列表"""
    result = get_kbs_service(db, ctx, kb_type, provider_type, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@knowledge_router.get("/{kb_id}", summary="获取知识库详情")
def get_kb(
    kb_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取知识库详情"""
    result = get_kb_detail_service(db, ctx, kb_id)
    return ApiResponse.success(data=result)


@knowledge_router.post("", summary="创建知识库")
def create_kb(
    data: KnowledgeBaseCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """创建知识库"""
    result = create_kb_service(
        db, ctx, data.name, data.type,
        description=data.description,
        group_id=data.group_id,
        provider_type=data.provider_type,
        chroma_config_id=data.chroma_config_id,
        dify_provider_id=data.dify_provider_id,
        embedding_model_id=data.embedding_model_id,
        rerank_model_id=data.rerank_model_id,
        chunk_size=data.chunk_size,
        chunk_overlap=data.chunk_overlap
    )
    return ApiResponse.success(data=result)


@knowledge_router.put("/{kb_id}", summary="更新知识库")
def update_kb(
    kb_id: int,
    data: KnowledgeBaseUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新知识库信息"""
    result = update_kb_service(db, ctx, kb_id, **data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@knowledge_router.delete("/{kb_id}", summary="删除知识库")
def delete_kb(
    kb_id: int,
    delete_remote: bool = False,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除知识库
    
    对于 Dify 知识库：
    - delete_remote=false（默认）：仅删除本地记录，保留 Dify 云端数据
    - delete_remote=true：同时删除 Dify 云端 Dataset
    """
    delete_kb_service(db, ctx, kb_id, delete_remote=delete_remote)
    return ApiResponse.success(message="知识库已删除")


@knowledge_router.put("/{kb_id}/permissions", summary="更新知识库权限")
def update_kb_permissions(
    kb_id: int,
    data: KBPermissionUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新知识库权限配置"""
    result = update_kb_permissions_service(db, ctx, kb_id, is_public=data.is_public)
    return ApiResponse.success(data=result)


# 知识文件管理
@knowledge_router.get("/{kb_id}/files", summary="获取知识文件列表")
def list_files(
    kb_id: int,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取知识文件列表"""
    result = get_files_service(db, ctx, kb_id, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@knowledge_router.post("/{kb_id}/files", summary="添加知识文件（关联已有文件）")
def add_file(
    kb_id: int,
    data: KnowledgeFileCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """添加知识文件"""
    result = add_file_service(db, ctx, kb_id, data.file_id)
    return ApiResponse.success(data=result)


@knowledge_router.post("/{kb_id}/upload", summary="直接上传文件到知识库")
def upload_file_to_kb(
    kb_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """直接上传文件到知识库"""
    # 1. 先上传文件到文件系统
    file_result = upload_file_service(db, ctx, file, usage_type="kb")
    file_id = file_result.get("id")
    
    # 2. 关联到知识库
    result = add_file_service(db, ctx, kb_id, file_id)
    return ApiResponse.success(data=result)


@knowledge_router.delete("/{kb_id}/files/{file_id}", summary="删除知识文件")
def delete_file(
    kb_id: int,
    file_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除知识文件"""
    delete_file_service(db, ctx, kb_id, file_id)
    return ApiResponse.success(message="文件已删除")


@knowledge_router.get("/{kb_id}/chunks", summary="获取知识分片列表")
def list_chunks(
    kb_id: int,
    file_id: int = None,
    page: int = 1,
    page_size: int = 100,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取知识分片列表"""
    result = get_chunks_service(db, ctx, kb_id, file_id, page, page_size)
    return ApiResponse.success(data=result)


# 检索与问答
@knowledge_router.post("/{kb_id}/retrieve-test", summary="检索测试")
async def retrieve_test(
    kb_id: int,
    data: RetrieveTestRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """知识库检索测试"""
    result = await retrieve_test_service(db, ctx, kb_id, data.query, data.top_k)
    return ApiResponse.success(data=result)


@knowledge_router.post("/{kb_id}/qa", summary="知识问答")
async def qa(
    kb_id: int,
    data: QARequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """知识问答"""
    result = await qa_service(db, ctx, kb_id, data.query, data.top_k, llm_model_id=data.llm_model_id)
    return ApiResponse.success(data=result)


@knowledge_router.get("/dify/{provider_id}/models", summary="获取Dify可用模型列表")
async def get_dify_models(
    provider_id: int,
    model_type: str = "text-embedding",
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取Dify Provider的可用模型（embedding/rerank/llm）"""
    from dao.dify_dao import get_dify_provider_by_id
    from core.dify_kb_client import DifyKnowledgeBaseClient
    
    provider = get_dify_provider_by_id(db, provider_id)
    if not provider:
        raise NotFoundException("Dify Provider不存在")
    
    client = DifyKnowledgeBaseClient(provider)
    models = await client.get_available_models(model_type)
    return ApiResponse.success(data=models)


@knowledge_router.get("/dify/{provider_id}/datasets", summary="获取Dify已有知识库列表")
async def get_dify_datasets(
    provider_id: int,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取Dify Provider下的已有知识库列表，用于同步"""
    from dao.dify_dao import get_dify_provider_by_id
    from core.dify_kb_client import DifyKnowledgeBaseClient
    from core.exceptions import NotFoundException
    
    provider = get_dify_provider_by_id(db, provider_id)
    if not provider:
        raise NotFoundException("Dify Provider不存在")
    
    client = DifyKnowledgeBaseClient(provider)
    result = await client.list_datasets(page=page, limit=limit)
    return ApiResponse.success(data=result)


@knowledge_router.post("/dify/{provider_id}/sync", summary="同步Dify已有知识库")
async def sync_dify_datasets(
    provider_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """同步Dify Provider下的已有知识库到本地"""
    from dao.dify_dao import get_dify_provider_by_id
    from core.dify_kb_client import DifyKnowledgeBaseClient
    from dao.knowledge_dao import create_knowledge_base, get_knowledge_bases
    from core.exceptions import NotFoundException
    import asyncio
    
    provider = get_dify_provider_by_id(db, provider_id)
    if not provider:
        raise NotFoundException("Dify Provider不存在")
    
    client = DifyKnowledgeBaseClient(provider)
    result = await client.list_datasets(page=1, limit=100)
    datasets = result.get("data", [])
    
    # 获取本地已有的Dify知识库dataset_id集合
    existing_kbs = get_knowledge_bases(
        db, ctx.tenant_id, ctx.user_id,
        provider_type="dify", page=1, page_size=1000,
        is_admin=ctx.is_super_admin or ctx.is_tenant_admin
    )
    existing_dataset_ids = {kb.dify_dataset_id for kb in existing_kbs if kb.dify_dataset_id}
    
    synced_count = 0
    for ds in datasets:
        dataset_id = ds.get("id")
        if dataset_id and dataset_id not in existing_dataset_ids:
            create_knowledge_base(
                db, ctx.tenant_id, ctx.user_id,
                name=ds.get("name", f"Dify知识库-{dataset_id[:8]}"),
                kb_type="tenant",
                provider_type="dify",
                dify_provider_id=provider_id,
                dify_dataset_id=dataset_id,
                description=ds.get("description", ""),
                status="ready"
            )
            synced_count += 1
    
    return ApiResponse.success(data={"synced_count": synced_count, "total_datasets": len(datasets)})


@knowledge_router.get("/{kb_id}/logs", summary="获取知识库调用记录")
def get_kb_logs(
    kb_id: int,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取知识库调用记录"""
    result = get_kb_logs_service(db, ctx, kb_id, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)
