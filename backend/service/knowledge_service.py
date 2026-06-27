"""知识库业务逻辑层"""
import logging
import asyncio
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from dao.knowledge_dao import (
    get_knowledge_bases, count_knowledge_bases, get_knowledge_base_by_id,
    create_knowledge_base, update_knowledge_base, delete_knowledge_base,
    get_knowledge_files, count_knowledge_files, get_knowledge_file_by_id,
    create_knowledge_file, update_knowledge_file_status, delete_knowledge_file,
    get_knowledge_chunks, count_knowledge_chunks, create_knowledge_chunk,
    batch_create_chunks
)
from dao.file_dao import get_file_by_id
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext
from core.knowledge_parser import FileParserFactory, ContentChunker
from core.embedding_client import EmbeddingClientFactory
from model.user import User

logger = logging.getLogger(__name__)


def get_kbs_service(db: Session, ctx: RequestContext, kb_type: str = None,
                    page: int = 1, page_size: int = 20) -> Dict:
    """获取知识库列表"""
    kbs = get_knowledge_bases(db, ctx.tenant_id, ctx.user_id, kb_type, page, page_size)
    total = count_knowledge_bases(db, ctx.tenant_id, ctx.user_id)
    
    kb_list = []
    for kb in kbs:
        file_count = count_knowledge_files(db, kb.id)
        chunk_count = count_knowledge_chunks(db, kb.id)
        
        kb_list.append({
            "id": kb.id,
            "name": kb.name,
            "description": kb.description,
            "type": kb.type,
            "status": kb.status,
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
    
    # 权限检查
    if not ctx.is_super_admin and kb.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此知识库")
    
    if kb.type == "personal" and kb.owner_id != ctx.user_id:
        raise ForbiddenException("无权访问此知识库")
    
    file_count = count_knowledge_files(db, kb.id)
    chunk_count = count_knowledge_chunks(db, kb.id)
    
    return {
        "id": kb.id,
        "name": kb.name,
        "description": kb.description,
        "type": kb.type,
        "embedding_model_id": kb.embedding_model_id,
        "status": kb.status,
        "file_count": file_count,
        "chunk_count": chunk_count,
        "created_at": kb.created_at
    }


def create_kb_service(db: Session, ctx: RequestContext, name: str,
                      kb_type: str = "personal", **kwargs) -> Dict:
    """创建知识库"""
    kb = create_knowledge_base(db, ctx.tenant_id, ctx.user_id, name, kb_type, **kwargs)
    
    logger.info(f"创建知识库: kb_id={kb.id}, name={name}")
    
    return {
        "id": kb.id,
        "name": kb.name,
        "type": kb.type,
        "status": kb.status,
        "created_at": kb.created_at
    }


def update_kb_service(db: Session, ctx: RequestContext, kb_id: int, **kwargs) -> Dict:
    """更新知识库"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    # 权限检查
    if not ctx.is_super_admin and kb.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此知识库")
    
    if kb.owner_id != ctx.user_id:
        raise ForbiddenException("无权修改此知识库")
    
    kb = update_knowledge_base(db, kb_id, **kwargs)
    
    return {
        "id": kb.id,
        "name": kb.name,
        "updated_at": kb.updated_at
    }


def delete_kb_service(db: Session, ctx: RequestContext, kb_id: int):
    """删除知识库"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    # 权限检查
    if not ctx.is_super_admin and kb.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除此知识库")
    
    if kb.owner_id != ctx.user_id:
        raise ForbiddenException("无权删除此知识库")
    
    delete_knowledge_base(db, kb_id)
    logger.info(f"删除知识库: kb_id={kb_id}")


def get_files_service(db: Session, ctx: RequestContext, kb_id: int,
                      page: int = 1, page_size: int = 50) -> Dict:
    """获取知识文件列表"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    # 权限检查
    if not ctx.is_super_admin and kb.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此知识库")
    
    files = get_knowledge_files(db, kb_id, page, page_size)
    total = count_knowledge_files(db, kb_id)
    
    file_list = []
    for kb_file in files:
        file_list.append({
            "id": kb_file.id,
            "kb_id": kb_file.kb_id,
            "file_id": kb_file.file_id,
            "parse_status": kb_file.parse_status,
            "chunk_count": kb_file.chunk_count,
            "created_at": kb_file.created_at
        })
    
    return {
        "items": file_list,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def add_file_service(db: Session, ctx: RequestContext, kb_id: int, file_id: int) -> Dict:
    """添加知识文件"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    # 权限检查
    if not ctx.is_super_admin and kb.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此知识库")
    
    if kb.owner_id != ctx.user_id:
        raise ForbiddenException("无权修改此知识库")
    
    kb_file = create_knowledge_file(db, ctx.tenant_id, kb_id, file_id)
    
    asyncio.create_task(_process_knowledge_file_async(db, kb_file.id, kb_id, file_id))
    
    logger.info(f"添加知识文件: kb_file_id={kb_file.id}")
    
    return {
        "id": kb_file.id,
        "kb_id": kb_file.kb_id,
        "file_id": kb_file.file_id,
        "parse_status": kb_file.parse_status
    }


async def _process_knowledge_file_async(db: Session, kb_file_id: int, kb_id: int, file_id: int):
    """异步处理知识文件：解析→分片→向量化"""
    try:
        update_knowledge_file_status(db, kb_file_id, "parsing")
        
        file = get_file_by_id(db, file_id)
        if not file:
            update_knowledge_file_status(db, kb_file_id, "failed", error_message="文件不存在")
            return
        
        file_path = file.file_path
        
        parser = FileParserFactory.create_parser(file_path)
        if not parser:
            update_knowledge_file_status(db, kb_file_id, "failed", error_message="不支持的文件类型")
            return
        
        parsed_content = parser.parse()
        
        if parsed_content.metadata.get("parse_error"):
            update_knowledge_file_status(db, kb_file_id, "failed", 
                                        error_message=parsed_content.metadata["parse_error"])
            return
        
        chunker = ContentChunker(chunk_size=500, chunk_overlap=50)
        chunks_with_metadata = chunker.chunk_with_metadata(parsed_content.text, {
            "file_id": file_id,
            "kb_id": kb_id
        })
        
        update_knowledge_file_status(db, kb_file_id, "embedding")
        
        embedding_client = EmbeddingClientFactory.create_client("local", {})
        
        if embedding_client:
            texts = [chunk["content"] for chunk in chunks_with_metadata]
            embedding_result = await embedding_client.embed(texts)
            
            if embedding_result.success:
                chunks_to_create = []
                for i, chunk_meta in enumerate(chunks_with_metadata):
                    chunks_to_create.append({
                        "kb_id": kb_id,
                        "file_id": kb_file_id,
                        "content": chunk_meta["content"],
                        "chunk_index": chunk_meta["metadata"]["chunk_index"],
                        "embedding": embedding_result.embeddings[i] if i < len(embedding_result.embeddings) else [],
                        "token_count": len(chunk_meta["content"]),
                        "metadata": chunk_meta["metadata"]
                    })
                
                if chunks_to_create:
                    batch_create_chunks(db, chunks_to_create)
                
                update_knowledge_file_status(db, kb_file_id, "completed", 
                                            chunk_count=len(chunks_to_create))
                logger.info(f"知识文件处理完成: kb_file_id={kb_file_id}, chunk_count={len(chunks_to_create)}")
            else:
                update_knowledge_file_status(db, kb_file_id, "failed", 
                                            error_message=embedding_result.error_message)
        else:
            chunks_to_create = []
            for chunk_meta in chunks_with_metadata:
                chunks_to_create.append({
                    "kb_id": kb_id,
                    "file_id": kb_file_id,
                    "content": chunk_meta["content"],
                    "chunk_index": chunk_meta["metadata"]["chunk_index"],
                    "embedding": [],
                    "token_count": len(chunk_meta["content"]),
                    "metadata": chunk_meta["metadata"]
                })
            
            if chunks_to_create:
                batch_create_chunks(db, chunks_to_create)
            
            update_knowledge_file_status(db, kb_file_id, "completed", 
                                        chunk_count=len(chunks_to_create))
            logger.info(f"知识文件处理完成(无向量化): kb_file_id={kb_file_id}, chunk_count={len(chunks_to_create)}")
    
    except Exception as e:
        update_knowledge_file_status(db, kb_file_id, "failed", error_message=str(e))
        logger.error(f"知识文件处理失败: kb_file_id={kb_file_id}, error={str(e)}")


def delete_file_service(db: Session, ctx: RequestContext, kb_id: int, file_id: int):
    """删除知识文件"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    # 权限检查
    if not ctx.is_super_admin and kb.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此知识库")
    
    if kb.owner_id != ctx.user_id:
        raise ForbiddenException("无权修改此知识库")
    
    delete_knowledge_file(db, file_id)
    logger.info(f"删除知识文件: file_id={file_id}")


def get_chunks_service(db: Session, ctx: RequestContext, kb_id: int,
                       file_id: int = None, page: int = 1, page_size: int = 100) -> List[Dict]:
    """获取知识分片列表"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        raise NotFoundException("知识库不存在")
    
    # 权限检查
    if not ctx.is_super_admin and kb.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此知识库")
    
    chunks = get_knowledge_chunks(db, kb_id, file_id, page, page_size)
    
    return [
        {
            "id": chunk.id,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "token_count": chunk.token_count
        }
        for chunk in chunks
    ]