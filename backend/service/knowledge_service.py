"""知识库业务逻辑层"""
import logging
import asyncio
import time
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from dao.knowledge_dao import (
    get_knowledge_bases, count_knowledge_bases, get_knowledge_base_by_id,
    create_knowledge_base, update_knowledge_base, delete_knowledge_base,
    get_knowledge_files, count_knowledge_files, get_knowledge_file_by_id,
    create_knowledge_file, update_knowledge_file_status, delete_knowledge_file,
    get_knowledge_chunks, count_knowledge_chunks, create_knowledge_chunk,
    batch_create_chunks, create_retrieval_log, get_retrieval_logs, count_retrieval_logs
)
from dao.file_dao import get_file_by_id
from dao.group_dao import is_group_member
from dao.model_config_dao import get_model_config_by_id
from dao.dify_dao import get_dify_provider_by_id
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext
from core.knowledge_parser import FileParserFactory, ContentChunker
from core.embedding_client import EmbeddingClientFactory
from core.chroma_client import ChromaClient
from core.dify_kb_client import DifyKnowledgeBaseClient
from core.llm_client import LLMClientFactory
from core.knowledge_retrieval import KnowledgeRetrievalEngine
from core.security import decrypt_api_key
from model.chroma_config import ChromaConfig
from model.model_config import ModelConfig
from model.dify import DifyProvider
from dao.model_config_dao import get_model_config_by_id

logger = logging.getLogger(__name__)


def _check_kb_permission(db: Session, ctx: RequestContext, kb: 'KnowledgeBase', require_write: bool = False):
    """检查知识库权限"""
    if ctx.is_super_admin:
        return
    
    if kb.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此知识库")
    
    if kb.type == "personal":
        if kb.owner_id != ctx.user_id:
            raise ForbiddenException("无权访问此知识库")
    
    elif kb.type == "group":
        if kb.group_id and not is_group_member(db, kb.group_id, ctx.user_id):
            raise ForbiddenException("无权访问此群知识库")
    
    elif kb.type == "tenant":
        # 租户内共享，默认可读
        pass
    
    elif kb.type == "public":
        # 公开库，默认可读
        pass
    
    if require_write:
        # 写入权限：仅创建者、管理员或授权用户
        if kb.owner_id != ctx.user_id and not ctx.is_tenant_admin:
            raise ForbiddenException("无权修改此知识库")


def get_kbs_service(db: Session, ctx: RequestContext, kb_type: str = None,
                    provider_type: str = None, page: int = 1, page_size: int = 20) -> Dict:
    """获取知识库列表"""
    # 管理端：超级管理员、租户管理员、或拥有 knowledge:read 权限的用户可查看所有知识库
    is_admin = ctx.is_super_admin or ctx.is_tenant_admin or "knowledge:read" in ctx.permissions
    kbs = get_knowledge_bases(db, ctx.tenant_id, ctx.user_id, kb_type, provider_type, page, page_size, is_admin)
    total = count_knowledge_bases(db, ctx.tenant_id, ctx.user_id, is_admin)
    
    kb_list = []
    for kb in kbs:
        file_count = count_knowledge_files(db, kb.id)
        chunk_count = count_knowledge_chunks(db, kb.id)
        
        kb_list.append({
            "id": kb.id,
            "name": kb.name,
            "description": kb.description,
            "type": kb.type,
            "provider_type": kb.provider_type,
            "status": kb.status,
            "is_public": kb.is_public,
            "file_count": file_count,
            "chunk_count": chunk_count,
            "created_at": kb.created_at
        })
    
    return {
        "items": kb_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_kb_detail_service(db: Session, ctx: RequestContext, kb_id: int) -> Dict:
    """获取知识库详情"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    _check_kb_permission(db, ctx, kb)
    
    file_count = count_knowledge_files(db, kb.id)
    chunk_count = count_knowledge_chunks(db, kb.id)
    
    # 获取关联配置信息
    chroma_config = None
    if kb.chroma_config_id:
        cc = db.query(ChromaConfig).filter(ChromaConfig.id == kb.chroma_config_id).first()
        if cc:
            chroma_config = {"id": cc.id, "name": cc.name, "host": cc.host}
    
    embedding_model = None
    if kb.embedding_model_id:
        em = db.query(ModelConfig).filter(ModelConfig.id == kb.embedding_model_id).first()
        if em:
            embedding_model = {"id": em.id, "name": em.name}
    
    rerank_model = None
    if kb.rerank_model_id:
        rm = db.query(ModelConfig).filter(ModelConfig.id == kb.rerank_model_id).first()
        if rm:
            rerank_model = {"id": rm.id, "name": rm.name}
    
    dify_provider = None
    if kb.dify_provider_id:
        dp = db.query(DifyProvider).filter(DifyProvider.id == kb.dify_provider_id).first()
        if dp:
            dify_provider = {"id": dp.id, "name": dp.name}
    
    return {
        "id": kb.id,
        "name": kb.name,
        "description": kb.description,
        "type": kb.type,
        "provider_type": kb.provider_type,
        "group_id": kb.group_id,
        "chroma_config_id": kb.chroma_config_id,
        "chroma_config": chroma_config,
        "dify_provider_id": kb.dify_provider_id,
        "dify_provider": dify_provider,
        "dify_dataset_id": kb.dify_dataset_id,
        "embedding_model_id": kb.embedding_model_id,
        "embedding_model": embedding_model,
        "rerank_model_id": kb.rerank_model_id,
        "rerank_model": rerank_model,
        "dify_embedding_model": kb.dify_embedding_model,
        "dify_embedding_model_provider": kb.dify_embedding_model_provider,
        "dify_rerank_model": kb.dify_rerank_model,
        "dify_rerank_model_provider": kb.dify_rerank_model_provider,
        "chunk_size": kb.chunk_size,
        "chunk_overlap": kb.chunk_overlap,
        "status": kb.status,
        "is_public": kb.is_public,
        "file_count": file_count,
        "chunk_count": chunk_count,
        "created_at": kb.created_at
    }


def create_kb_service(db: Session, ctx: RequestContext, name: str,
                      kb_type: str = "personal", **kwargs) -> Dict:
    """创建知识库"""
    provider_type = kwargs.get("provider_type", "local")
    
    # 校验参数
    if provider_type == "local":
        chroma_config_id = kwargs.get("chroma_config_id")
        if not chroma_config_id:
            raise BadRequestException("本地知识库需要指定 Chroma 配置")
        embedding_model_id = kwargs.get("embedding_model_id")
        if not embedding_model_id:
            raise BadRequestException("本地知识库需要指定 Embedding 模型")
    
    elif provider_type == "dify":
        dify_provider_id = kwargs.get("dify_provider_id")
        if not dify_provider_id:
            raise BadRequestException("Dify 知识库需要指定 Dify Provider")
    
    # 创建知识库
    kb = create_knowledge_base(db, ctx.tenant_id, ctx.user_id, name, kb_type, **kwargs)
    
    # 初始化外部存储
    if provider_type == "local":
        _init_local_kb(db, kb)
    elif provider_type == "dify":
        _init_dify_kb_sync(db, kb.id)
    
    logger.info(f"创建知识库: kb_id={kb.id}, name={name}, provider_type={provider_type}")
    
    return {
        "id": kb.id,
        "name": kb.name,
        "type": kb.type,
        "provider_type": kb.provider_type,
        "status": kb.status,
        "created_at": kb.created_at
    }


def _init_dify_kb_sync(db: Session, kb_id: int):
    """同步初始化 Dify 知识库（在后台线程中执行异步操作）"""
    import threading
    def run_async():
        asyncio.run(_init_dify_kb_async(db, kb_id))
    thread = threading.Thread(target=run_async, daemon=True)
    thread.start()


def _init_local_kb(db: Session, kb):
    """初始化本地知识库的 Chroma Collection"""
    try:
        chroma_config = db.query(ChromaConfig).filter(
            ChromaConfig.id == kb.chroma_config_id
        ).first()
        
        if chroma_config:
            chroma = ChromaClient(
                host=chroma_config.host,
                port=chroma_config.port,
                collection_prefix=chroma_config.collection_prefix
            )
            chroma.create_collection(kb.tenant_id, kb.id)
            update_knowledge_base(db, kb.id, status="ready")
        else:
            update_knowledge_base(db, kb.id, status="failed")
    except Exception as e:
        logger.error(f"本地知识库初始化失败: {e}")
        update_knowledge_base(db, kb.id, status="failed")


async def _init_dify_kb_async(db: Session, kb_id: int):
    """异步初始化 Dify 知识库"""
    from database.session import Session as DBSession
    
    # 使用新 session 避免异步上下文问题
    new_db = DBSession()
    try:
        kb = get_knowledge_base_by_id(new_db, kb_id)
        if not kb:
            return
        
        provider = get_dify_provider_by_id(new_db, kb.dify_provider_id)
        if not provider:
            update_knowledge_base(new_db, kb_id, status="failed")
            return
        
        dify_kb = DifyKnowledgeBaseClient(provider)
        dataset_id = await dify_kb.create_dataset(
            name=kb.name,
            description=kb.description or "",
            embedding_model=kb.dify_embedding_model,
            embedding_model_provider=kb.dify_embedding_model_provider
        )
        
        if dataset_id:
            update_knowledge_base(new_db, kb_id, dify_dataset_id=dataset_id, status="ready")
            logger.info(f"Dify 知识库初始化成功: kb_id={kb_id}, dataset_id={dataset_id}")
        else:
            update_knowledge_base(new_db, kb_id, status="failed")
    except Exception as e:
        logger.error(f"Dify 知识库初始化失败: {e}")
        update_knowledge_base(new_db, kb_id, status="failed")
    finally:
        new_db.close()


def update_kb_service(db: Session, ctx: RequestContext, kb_id: int, **kwargs) -> Dict:
    """更新知识库"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    _check_kb_permission(db, ctx, kb, require_write=True)
    
    # 禁止修改 provider_type
    if "provider_type" in kwargs:
        del kwargs["provider_type"]
    
    kb = update_knowledge_base(db, kb_id, **kwargs)
    
    return {
        "id": kb.id,
        "name": kb.name,
        "updated_at": kb.updated_at
    }


def delete_kb_service(db: Session, ctx: RequestContext, kb_id: int, delete_remote: bool = False):
    """删除知识库
    
    Args:
        delete_remote: 对于 Dify 知识库，是否同时删除云端 Dataset
    """
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    _check_kb_permission(db, ctx, kb, require_write=True)
    
    # 清理外部数据
    if kb.provider_type == "local":
        _delete_local_kb(db, kb)
    elif kb.provider_type == "dify" and kb.dify_dataset_id and delete_remote:
        # 仅当显式指定 delete_remote=true 时才删除云端数据
        _delete_dify_kb_sync(kb)
    
    delete_knowledge_base(db, kb_id)
    logger.info(f"删除知识库: kb_id={kb_id}, delete_remote={delete_remote}")


def _delete_dify_kb_sync(kb):
    """同步触发删除 Dify 知识库（在后台线程中执行异步操作）"""
    import threading
    def run_async():
        asyncio.run(_delete_dify_kb_async(kb))
    thread = threading.Thread(target=run_async, daemon=True)
    thread.start()


def _delete_local_kb(db: Session, kb):
    """删除本地知识库的 Chroma Collection"""
    try:
        chroma_config = db.query(ChromaConfig).filter(
            ChromaConfig.id == kb.chroma_config_id
        ).first()
        
        if chroma_config:
            chroma = ChromaClient(
                host=chroma_config.host,
                port=chroma_config.port,
                collection_prefix=chroma_config.collection_prefix
            )
            chroma.delete_collection(kb.tenant_id, kb.id)
    except Exception as e:
        logger.error(f"本地知识库清理失败: {e}")


async def _delete_dify_kb_async(kb):
    """异步删除 Dify 知识库"""
    from database.session import Session as DBSession
    new_db = DBSession()
    try:
        provider = get_dify_provider_by_id(new_db, kb.dify_provider_id)
        if provider and kb.dify_dataset_id:
            dify_kb = DifyKnowledgeBaseClient(provider)
            await dify_kb.delete_dataset(kb.dify_dataset_id)
    except Exception as e:
        logger.error(f"Dify 知识库清理失败: {e}")
    finally:
        new_db.close()


def get_files_service(db: Session, ctx: RequestContext, kb_id: int,
                      page: int = 1, page_size: int = 50) -> Dict:
    """获取知识文件列表"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    _check_kb_permission(db, ctx, kb)
    
    files = get_knowledge_files(db, kb_id, page, page_size)
    total = count_knowledge_files(db, kb_id)
    
    file_list = []
    for kb_file in files:
        file_list.append({
            "id": kb_file.id,
            "kb_id": kb_file.kb_id,
            "file_id": kb_file.file_id,
            "original_filename": kb_file.original_filename,
            "file_size": kb_file.file_size,
            "word_count": kb_file.word_count,
            "parse_status": kb_file.parse_status,
            "chunk_count": kb_file.chunk_count,
            "dify_document_id": kb_file.dify_document_id,
            "created_at": kb_file.created_at
        })
    
    return {
        "items": file_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def add_file_service(db: Session, ctx: RequestContext, kb_id: int, file_id: int) -> Dict:
    """添加知识文件（关联已有文件）"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    _check_kb_permission(db, ctx, kb, require_write=True)
    
    file = get_file_by_id(db, file_id)
    if not file:
        raise NotFoundException("文件不存在")
    
    kb_file = create_knowledge_file(
        db, ctx.tenant_id, kb_id, file_id,
        original_filename=file.original_filename,
        file_size=file.file_size,
        word_count=0
    )
    
    # 异步处理文件
    _process_knowledge_file_sync(db, kb_file.id, kb_id, file_id, kb.provider_type)
    
    logger.info(f"添加知识文件: kb_file_id={kb_file.id}")
    
    return {
        "id": kb_file.id,
        "kb_id": kb_file.kb_id,
        "file_id": kb_file.file_id,
        "parse_status": kb_file.parse_status
    }


def _process_knowledge_file_sync(db: Session, kb_file_id: int, kb_id: int, file_id: int, provider_type: str):
    """同步触发处理知识文件（在后台线程中执行异步操作）"""
    import threading
    def run_async():
        asyncio.run(_process_knowledge_file_async(db, kb_file_id, kb_id, file_id, provider_type))
    thread = threading.Thread(target=run_async, daemon=True)
    thread.start()


async def _process_knowledge_file_async(db: Session, kb_file_id: int, kb_id: int, file_id: int, provider_type: str):
    """异步处理知识文件"""
    from database.session import Session as DBSession
    
    new_db = DBSession()
    try:
        kb = get_knowledge_base_by_id(new_db, kb_id)
        if not kb:
            update_knowledge_file_status(new_db, kb_file_id, "failed", error_message="知识库不存在")
            return
        
        file = get_file_by_id(new_db, file_id)
        if not file:
            update_knowledge_file_status(new_db, kb_file_id, "failed", error_message="文件不存在")
            return
        
        if provider_type == "dify":
            await _process_dify_file(new_db, kb, kb_file_id, file)
        else:
            await _process_local_file(new_db, kb, kb_file_id, file)
    
    except Exception as e:
        logger.error(f"知识文件处理失败: kb_file_id={kb_file_id}, error={e}")
        update_knowledge_file_status(new_db, kb_file_id, "failed", error_message=str(e))
    finally:
        new_db.close()


async def _process_local_file(db: Session, kb, kb_file_id: int, file):
    """处理本地知识库文件"""
    update_knowledge_file_status(db, kb_file_id, "parsing")
    
    parser = FileParserFactory.create_parser(file.storage_path)
    if not parser:
        update_knowledge_file_status(db, kb_file_id, "failed", error_message="不支持的文件类型")
        return
    
    parsed_content = parser.parse()
    
    if parsed_content.metadata.get("parse_error"):
        update_knowledge_file_status(db, kb_file_id, "failed", 
                                    error_message=parsed_content.metadata["parse_error"])
        return
    
    # 分片
    chunker = ContentChunker(chunk_size=kb.chunk_size or 500, chunk_overlap=kb.chunk_overlap or 50)
    chunks_with_metadata = chunker.chunk_with_metadata(parsed_content.text, {
        "file_id": file.id,
        "kb_id": kb.id,
        "original_filename": file.original_filename
    })
    
    # 获取 Embedding 模型
    embedding_model = db.query(ModelConfig).filter(
        ModelConfig.id == kb.embedding_model_id,
        ModelConfig.deleted_at == None
    ).first()
    
    if not embedding_model:
        update_knowledge_file_status(db, kb_file_id, "failed", error_message="Embedding 模型不存在")
        return
    
    update_knowledge_file_status(db, kb_file_id, "embedding")
    
    embedding_client = EmbeddingClientFactory.create_from_model_config(embedding_model)
    if not embedding_client:
        update_knowledge_file_status(db, kb_file_id, "failed", error_message="Embedding 客户端创建失败")
        return
    
    texts = [chunk["content"] for chunk in chunks_with_metadata]
    embedding_result = await embedding_client.embed(texts)
    
    if not embedding_result.success:
        update_knowledge_file_status(db, kb_file_id, "failed", error_message=embedding_result.error_message)
        return
    
    # 保存到 Chroma
    chroma_config = db.query(ChromaConfig).filter(
        ChromaConfig.id == kb.chroma_config_id
    ).first()
    
    if chroma_config:
        chroma = ChromaClient(
            host=chroma_config.host,
            port=chroma_config.port,
            collection_prefix=chroma_config.collection_prefix
        )
        
        documents = []
        embeddings = []
        metadatas = []
        ids = []
        
        for i, chunk_meta in enumerate(chunks_with_metadata):
            doc_id = f"kb{kb.id}_f{kb_file_id}_c{i}"
            ids.append(doc_id)
            documents.append(chunk_meta["content"])
            embeddings.append(embedding_result.embeddings[i] if i < len(embedding_result.embeddings) else [])
            metadatas.append({
                "kb_id": kb.id,
                "file_id": kb_file_id,
                "chunk_index": chunk_meta["metadata"]["chunk_index"],
                "original_filename": file.original_filename
            })
        
        chroma.add_documents(kb.tenant_id, kb.id, documents, embeddings, metadatas, ids)
    
    # 保存到 MySQL
    chunks_to_create = []
    for i, chunk_meta in enumerate(chunks_with_metadata):
        chunk = create_knowledge_chunk(
            db, kb.tenant_id, kb.id, kb_file_id,
            chunk_index=chunk_meta["metadata"]["chunk_index"],
            content=chunk_meta["content"],
            token_count=len(chunk_meta["content"]),
            chroma_doc_id=f"kb{kb.id}_f{kb_file_id}_c{i}"
        )
        chunks_to_create.append(chunk)
    
    if chunks_to_create:
        batch_create_chunks(db, chunks_to_create)
    
    update_knowledge_file_status(db, kb_file_id, "ready", chunk_count=len(chunks_to_create))
    logger.info(f"本地知识文件处理完成: kb_file_id={kb_file_id}, chunk_count={len(chunks_to_create)}")


async def _process_dify_file(db: Session, kb, kb_file_id: int, file):
    """处理 Dify 知识库文件"""
    update_knowledge_file_status(db, kb_file_id, "parsing")
    
    if not kb.dify_dataset_id:
        update_knowledge_file_status(db, kb_file_id, "failed", error_message="Dify Dataset 未初始化")
        return
    
    provider = get_dify_provider_by_id(db, kb.dify_provider_id)
    if not provider:
        update_knowledge_file_status(db, kb_file_id, "failed", error_message="Dify Provider 不存在")
        return
    
    dify_kb = DifyKnowledgeBaseClient(provider)
    
    result = await dify_kb.upload_document_by_file(
        dataset_id=kb.dify_dataset_id,
        file_path=file.storage_path
    )
    
    if result and result.get("document"):
        doc_id = result["document"].get("id")
        update_knowledge_file_status(
            db, kb_file_id, "ready",
            dify_document_id=doc_id,
            chunk_count=result["document"].get("segment_count", 0)
        )
        logger.info(f"Dify 文件上传成功: kb_file_id={kb_file_id}, doc_id={doc_id}")
    else:
        update_knowledge_file_status(db, kb_file_id, "failed", error_message="Dify 上传失败")


def delete_file_service(db: Session, ctx: RequestContext, kb_id: int, file_id: int):
    """删除知识文件"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    _check_kb_permission(db, ctx, kb, require_write=True)
    
    kb_file = get_knowledge_file_by_id(db, file_id)
    if not kb_file:
        raise NotFoundException("文件不存在")
    
    # 如果是 Dify 知识库，还需要删除 Dify 中的文档
    if kb.provider_type == "dify" and kb.dify_dataset_id and kb_file.dify_document_id:
        _delete_dify_document_sync(kb, kb_file.dify_document_id)
    
    # 删除 Chroma 中的文档（本地库）
    if kb.provider_type == "local":
        _delete_chroma_documents(db, kb, file_id)
    
    delete_knowledge_file(db, file_id)
    logger.info(f"删除知识文件: file_id={file_id}")


def _delete_dify_document_sync(kb, dify_document_id: str):
    """同步触发删除 Dify 文档（在后台线程中执行异步操作）"""
    import threading
    def run_async():
        asyncio.run(_delete_dify_document_async(kb, dify_document_id))
    thread = threading.Thread(target=run_async, daemon=True)
    thread.start()


def _delete_chroma_documents(db: Session, kb, file_id: int):
    """删除 Chroma 中的文档"""
    try:
        chroma_config = db.query(ChromaConfig).filter(
            ChromaConfig.id == kb.chroma_config_id
        ).first()
        
        if chroma_config:
            chroma = ChromaClient(
                host=chroma_config.host,
                port=chroma_config.port,
                collection_prefix=chroma_config.collection_prefix
            )
            
            # 获取该文件的所有 chunk 的 chroma_doc_id
            chunks = db.query(KnowledgeChunk).filter(
                KnowledgeChunk.file_id == file_id
            ).all()
            
            ids = [c.chroma_doc_id for c in chunks if c.chroma_doc_id]
            if ids:
                chroma.delete_by_ids(kb.tenant_id, kb.id, ids)
    except Exception as e:
        logger.error(f"Chroma 文档删除失败: {e}")


async def _delete_dify_document_async(kb, document_id: str):
    """异步删除 Dify 文档"""
    from database.session import Session as DBSession
    new_db = DBSession()
    try:
        provider = get_dify_provider_by_id(new_db, kb.dify_provider_id)
        if provider and kb.dify_dataset_id:
            dify_kb = DifyKnowledgeBaseClient(provider)
            await dify_kb.delete_document(kb.dify_dataset_id, document_id)
    except Exception as e:
        logger.error(f"Dify 文档删除失败: {e}")
    finally:
        new_db.close()


def get_chunks_service(db: Session, ctx: RequestContext, kb_id: int,
                       file_id: int = None, page: int = 1, page_size: int = 100) -> List[Dict]:
    """获取知识分片列表"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    _check_kb_permission(db, ctx, kb)
    
    chunks = get_knowledge_chunks(db, kb_id, file_id, page, page_size)
    
    return [
        {
            "id": chunk.id,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "token_count": chunk.token_count,
            "chroma_doc_id": chunk.chroma_doc_id
        }
        for chunk in chunks
    ]


async def retrieve_test_service(db: Session, ctx: RequestContext, kb_id: int,
                                query: str, top_k: int = 10) -> Dict:
    """检索测试"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    _check_kb_permission(db, ctx, kb)
    
    start_time = time.time()
    
    engine = KnowledgeRetrievalEngine(db)
    results = await engine.retrieve(kb, query, top_k=top_k)
    
    latency_ms = int((time.time() - start_time) * 1000)
    
    # 记录检索日志
    create_retrieval_log(
        db, ctx.tenant_id, kb_id, ctx.user_id, query,
        kb.provider_type, len(results),
        top_results={"results": [{"content": r["content"][:200], "score": r["score"]} for r in results[:3]]},
        latency_ms=latency_ms
    )
    
    return {
        "query": query,
        "results_count": len(results),
        "latency_ms": latency_ms,
        "results": results
    }


async def qa_service(db: Session, ctx: RequestContext, kb_id: int,
                     query: str, top_k: int = 5, llm_model_id: int = None) -> Dict:
    """知识问答"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    _check_kb_permission(db, ctx, kb)
    
    start_time = time.time()
    
    # 1. 检索
    engine = KnowledgeRetrievalEngine(db)
    results = await engine.retrieve(kb, query, top_k=top_k)
    
    # 2. 组装上下文
    context = "\n\n".join([f"[相关文档 {i+1}]\n{r['content']}" for i, r in enumerate(results)])
    
    # 3. 调用 LLM 生成答案
    answer = ""
    llm_model = None
    
    # 优先使用用户指定的LLM模型
    if llm_model_id:
        llm_model = get_model_config_by_id(db, llm_model_id)
    
    # 如果用户没有指定或指定的不是LLM，尝试使用知识库关联的embedding_model（如果是LLM）
    if not llm_model or llm_model.model_type != "llm":
        if kb.embedding_model_id:
            llm_model = get_model_config_by_id(db, kb.embedding_model_id)
    
    # 如果embedding模型不是LLM，查找一个可用的LLM
    if not llm_model or llm_model.model_type != "llm":
        from dao.model_config_dao import get_model_configs
        llm_models = get_model_configs(
            db, tenant_id=ctx.tenant_id, model_type="llm", status="enabled", page_size=1
        )
        if llm_models:
            llm_model = llm_models[0]
    
    if llm_model:
        try:
            llm_client = LLMClientFactory.create_from_model_config(llm_model)
            if llm_client:
                system_prompt = """你是一个基于知识库的问答助手。请根据提供的知识库内容，回答用户的问题。
如果知识库内容不足以回答问题，请明确说明。请保持回答简洁、准确。"""
                
                user_prompt = f"""基于以下知识库内容，请回答用户的问题：

知识库内容：
{context[:4000]}

用户问题：{query}
"""
                
                messages = [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ]
                
                llm_answer = await llm_client.chat(
                    messages=messages,
                    temperature=0.3,
                    max_tokens=min(2048, llm_model.max_tokens or 2048)
                )
                
                if llm_answer:
                    answer = llm_answer
                else:
                    answer = f"根据知识库检索结果，找到 {len(results)} 条相关内容（LLM 生成失败，以下为检索结果摘要）：\n\n{context[:1500]}"
            else:
                answer = f"根据知识库检索结果，找到 {len(results)} 条相关内容（LLM 客户端创建失败）：\n\n{context[:1500]}"
        except Exception as e:
            logger.error(f"LLM 生成答案失败: {str(e)}")
            answer = f"根据知识库检索结果，找到 {len(results)} 条相关内容（LLM 调用异常：{str(e)}）：\n\n{context[:1500]}"
    else:
        # 没有可用 LLM，返回检索结果摘要
        answer = f"根据知识库检索结果，找到 {len(results)} 条相关内容（未配置 LLM 模型，以下为检索结果）：\n\n{context[:2000]}"
    
    latency_ms = int((time.time() - start_time) * 1000)
    
    # 记录检索日志
    create_retrieval_log(
        db, ctx.tenant_id, kb_id, ctx.user_id, query,
        kb.provider_type, len(results),
        top_results={"results": [{"content": r["content"][:200], "score": r["score"]} for r in results[:3]]},
        latency_ms=latency_ms
    )
    
    return {
        "query": query,
        "answer": answer,
        "results_count": len(results),
        "latency_ms": latency_ms,
        "references": results
    }


def get_kb_logs_service(db: Session, ctx: RequestContext, kb_id: int,
                        page: int = 1, page_size: int = 50) -> Dict:
    """获取知识库调用记录"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    _check_kb_permission(db, ctx, kb)
    
    logs = get_retrieval_logs(db, kb_id, page, page_size)
    total = count_retrieval_logs(db, kb_id)
    
    log_list = []
    for log in logs:
        log_list.append({
            "id": log.id,
            "query": log.query,
            "retrieval_type": log.retrieval_type,
            "results_count": log.results_count,
            "latency_ms": log.latency_ms,
            "status": log.status,
            "created_at": log.created_at
        })
    
    return {
        "items": log_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def update_kb_permissions_service(db: Session, ctx: RequestContext, kb_id: int,
                                  is_public: bool = None) -> Dict:
    """更新知识库权限配置"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    # 公开权限需要管理员
    if is_public is not None and is_public and not (ctx.is_super_admin or ctx.is_tenant_admin):
        raise ForbiddenException("需要管理员权限才能设置公开")
    
    _check_kb_permission(db, ctx, kb, require_write=True)
    
    update_data = {}
    if is_public is not None:
        update_data["is_public"] = is_public
    
    kb = update_knowledge_base(db, kb_id, **update_data)
    
    return {
        "id": kb.id,
        "is_public": kb.is_public,
        "updated_at": kb.updated_at
    }
