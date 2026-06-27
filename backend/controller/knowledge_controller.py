"""知识库管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.knowledge import (
    KnowledgeBaseCreate, KnowledgeBaseUpdate, KnowledgeBaseResponse,
    KnowledgeFileCreate, KnowledgeFileResponse, KnowledgeChunkResponse,
    KnowledgeBaseListResponse, KnowledgeFileListResponse
)
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext, RequestContext
from service.knowledge_service import (
    get_kbs_service, get_kb_detail_service, create_kb_service,
    update_kb_service, delete_kb_service,
    get_files_service, add_file_service, delete_file_service,
    get_chunks_service
)

from model.user import User


knowledge_router = APIRouter(prefix="/knowledge", tags=["知识库管理 Knowledge"])


@knowledge_router.get("", summary="获取知识库列表")
def list_kbs(
    kb_type: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取知识库列表"""
    result = get_kbs_service(db, ctx, kb_type, page, page_size)
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
        embedding_model_id=data.embedding_model_id
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
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除知识库"""
    delete_kb_service(db, ctx, kb_id)
    return ApiResponse.success(message="知识库已删除")


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


@knowledge_router.post("/{kb_id}/files", summary="添加知识文件")
def add_file(
    kb_id: int,
    data: KnowledgeFileCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """添加知识文件"""
    result = add_file_service(db, ctx, kb_id, data.file_id)
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