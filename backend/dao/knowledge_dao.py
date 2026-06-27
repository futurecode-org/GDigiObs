"""知识库数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional, Dict
from datetime import datetime

from model.knowledge import KnowledgeBase, KnowledgeFile, KnowledgeChunk
from model.user import User


def get_knowledge_bases(db: Session, tenant_id: int, user_id: int = None,
                        kb_type: str = None, page: int = 1, page_size: int = 20) -> List[KnowledgeBase]:
    """获取知识库列表"""
    query = db.query(KnowledgeBase).filter(
        KnowledgeBase.tenant_id == tenant_id,
        KnowledgeBase.deleted_at == None
    )
    
    if user_id:
        query = query.filter(KnowledgeBase.owner_id == user_id)
    
    if kb_type:
        query = query.filter(KnowledgeBase.type == kb_type)
    
    return query.order_by(desc(KnowledgeBase.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_knowledge_bases(db: Session, tenant_id: int, user_id: int = None) -> int:
    """统计知识库数量"""
    query = db.query(KnowledgeBase).filter(
        KnowledgeBase.tenant_id == tenant_id,
        KnowledgeBase.deleted_at == None
    )
    
    if user_id:
        query = query.filter(KnowledgeBase.owner_id == user_id)
    
    return query.count()


def get_knowledge_base_by_id(db: Session, kb_id: int) -> Optional[KnowledgeBase]:
    """获取知识库详情"""
    return db.query(KnowledgeBase).filter(
        KnowledgeBase.id == kb_id,
        KnowledgeBase.deleted_at == None
    ).first()


def create_knowledge_base(db: Session, tenant_id: int, owner_id: int, name: str,
                          kb_type: str = "personal", **kwargs) -> KnowledgeBase:
    """创建知识库"""
    kb = KnowledgeBase(
        tenant_id=tenant_id,
        owner_id=owner_id,
        name=name,
        type=kb_type,
        **kwargs
    )
    db.add(kb)
    db.commit()
    return kb


def update_knowledge_base(db: Session, kb_id: int, **kwargs) -> KnowledgeBase:
    """更新知识库"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        return None
    
    for key, value in kwargs.items():
        if hasattr(kb, key):
            setattr(kb, key, value)
    
    db.commit()
    return kb


def delete_knowledge_base(db: Session, kb_id: int) -> bool:
    """删除知识库（软删除）"""
    kb = get_knowledge_base_by_id(db, kb_id)
    if not kb:
        return False
    
    kb.deleted_at = datetime.now()
    db.commit()
    return True


# 知识文件管理
def get_knowledge_files(db: Session, kb_id: int, page: int = 1, 
                        page_size: int = 50) -> List[KnowledgeFile]:
    """获取知识文件列表"""
    return db.query(KnowledgeFile).filter(
        KnowledgeFile.kb_id == kb_id
    ).order_by(desc(KnowledgeFile.created_at)).offset((page - 1) * page_size).limit(page_size).all()


def count_knowledge_files(db: Session, kb_id: int) -> int:
    """统计知识文件数量"""
    return db.query(KnowledgeFile).filter(KnowledgeFile.kb_id == kb_id).count()


def get_knowledge_file_by_id(db: Session, file_id: int) -> Optional[KnowledgeFile]:
    """获取知识文件详情"""
    return db.query(KnowledgeFile).filter(KnowledgeFile.id == file_id).first()


def create_knowledge_file(db: Session, tenant_id: int, kb_id: int, file_id: int) -> KnowledgeFile:
    """创建知识文件"""
    kb_file = KnowledgeFile(
        tenant_id=tenant_id,
        kb_id=kb_id,
        file_id=file_id
    )
    db.add(kb_file)
    db.commit()
    return kb_file


def update_knowledge_file_status(db: Session, file_id: int, status: str, 
                                 error_message: str = None) -> bool:
    """更新知识文件状态"""
    kb_file = get_knowledge_file_by_id(db, file_id)
    if not kb_file:
        return False
    
    kb_file.parse_status = status
    if error_message:
        kb_file.error_message = error_message
    
    db.commit()
    return True


def delete_knowledge_file(db: Session, file_id: int) -> bool:
    """删除知识文件"""
    kb_file = get_knowledge_file_by_id(db, file_id)
    if not kb_file:
        return False
    
    # 删除相关分片
    db.query(KnowledgeChunk).filter(KnowledgeChunk.file_id == file_id).delete()
    db.delete(kb_file)
    db.commit()
    return True


# 知识分片管理
def get_knowledge_chunks(db: Session, kb_id: int, file_id: int = None,
                         page: int = 1, page_size: int = 100) -> List[KnowledgeChunk]:
    """获取知识分片列表"""
    query = db.query(KnowledgeChunk).filter(KnowledgeChunk.kb_id == kb_id)
    
    if file_id:
        query = query.filter(KnowledgeChunk.file_id == file_id)
    
    return query.order_by(KnowledgeChunk.chunk_index).offset((page - 1) * page_size).limit(page_size).all()


def count_knowledge_chunks(db: Session, kb_id: int) -> int:
    """统计知识分片数量"""
    return db.query(KnowledgeChunk).filter(KnowledgeChunk.kb_id == kb_id).count()


def create_knowledge_chunk(db: Session, tenant_id: int, kb_id: int, file_id: int,
                           chunk_index: int, content: str, token_count: int = 0) -> KnowledgeChunk:
    """创建知识分片"""
    chunk = KnowledgeChunk(
        tenant_id=tenant_id,
        kb_id=kb_id,
        file_id=file_id,
        chunk_index=chunk_index,
        content=content,
        token_count=token_count
    )
    db.add(chunk)
    db.flush()
    return chunk


def batch_create_chunks(db: Session, chunks: List[KnowledgeChunk]):
    """批量创建知识分片"""
    db.add_all(chunks)
    db.commit()


def update_chunk_embedding(db: Session, chunk_id: int, embedding_vector: List[float]) -> bool:
    """更新分片向量"""
    chunk = db.query(KnowledgeChunk).filter(KnowledgeChunk.id == chunk_id).first()
    if not chunk:
        return False
    
    chunk.embedding_vector = embedding_vector
    db.commit()
    return True


def search_chunks_by_embedding(db: Session, kb_id: int, embedding: List[float],
                               top_k: int = 10) -> List[KnowledgeChunk]:
    """基于向量相似度搜索分片（简化实现，实际应使用向量数据库）"""
    # 这里使用简化实现，实际应该使用专门的向量数据库如Milvus、Pinecone等
    # 或者使用PostgreSQL的pgvector扩展
    chunks = db.query(KnowledgeChunk).filter(KnowledgeChunk.kb_id == kb_id).limit(100).all()
    
    # 简化：返回前top_k个分片
    return chunks[:top_k]