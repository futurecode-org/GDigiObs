"""Chroma 配置业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Optional

from dao.chroma_config_dao import (
    get_chroma_configs, count_chroma_configs, get_chroma_config_by_id,
    create_chroma_config, update_chroma_config, delete_chroma_config
)
from core.chroma_client import ChromaClient
from core.exceptions import NotFoundException, ForbiddenException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def get_chroma_configs_service(db: Session, ctx: RequestContext, page: int = 1, page_size: int = 20) -> Dict:
    """获取 Chroma 配置列表"""
    configs = get_chroma_configs(db, ctx.tenant_id, page, page_size)
    total = count_chroma_configs(db, ctx.tenant_id)
    
    items = []
    for c in configs:
        items.append({
            "id": c.id,
            "name": c.name,
            "host": c.host,
            "port": c.port,
            "collection_prefix": c.collection_prefix,
            "visibility": c.visibility,
            "status": c.status,
            "remark": c.remark,
            "created_at": c.created_at
        })
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_chroma_config_detail_service(db: Session, ctx: RequestContext, config_id: int) -> Dict:
    """获取 Chroma 配置详情"""
    config = get_chroma_config_by_id(db, config_id)
    if not config:
        raise NotFoundException("Chroma 配置不存在")
    
    if not ctx.is_super_admin and config.visibility != "platform" and config.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此配置")
    
    return {
        "id": config.id,
        "name": config.name,
        "host": config.host,
        "port": config.port,
        "collection_prefix": config.collection_prefix,
        "visibility": config.visibility,
        "status": config.status,
        "remark": config.remark,
        "created_at": config.created_at
    }


def create_chroma_config_service(db: Session, ctx: RequestContext, data: Dict) -> Dict:
    """创建 Chroma 配置"""
    config = create_chroma_config(
        db,
        tenant_id=ctx.tenant_id if ctx.tenant_id else None,
        owner_id=ctx.user_id,
        **data
    )
    
    logger.info(f"创建 Chroma 配置: id={config.id}, name={config.name}")
    return {
        "id": config.id,
        "name": config.name,
        "host": config.host,
        "port": config.port,
        "status": config.status
    }


def update_chroma_config_service(db: Session, ctx: RequestContext, config_id: int, data: Dict) -> Dict:
    """更新 Chroma 配置"""
    config = get_chroma_config_by_id(db, config_id)
    if not config:
        raise NotFoundException("Chroma 配置不存在")
    
    if not ctx.is_super_admin and config.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权修改此配置")
    
    config = update_chroma_config(db, config_id, **data)
    
    logger.info(f"更新 Chroma 配置: id={config_id}")
    return {
        "id": config.id,
        "name": config.name,
        "updated_at": config.updated_at
    }


def delete_chroma_config_service(db: Session, ctx: RequestContext, config_id: int):
    """删除 Chroma 配置"""
    config = get_chroma_config_by_id(db, config_id)
    if not config:
        raise NotFoundException("Chroma 配置不存在")
    
    if not ctx.is_super_admin and config.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权删除此配置")
    
    delete_chroma_config(db, config_id)
    logger.info(f"删除 Chroma 配置: id={config_id}")


async def test_chroma_connection_service(db: Session, ctx: RequestContext, config_id: int) -> bool:
    """测试 Chroma 连接"""
    config = get_chroma_config_by_id(db, config_id)
    if not config:
        raise NotFoundException("Chroma 配置不存在")
    
    if not ctx.is_super_admin and config.visibility != "platform" and config.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权访问此配置")
    
    chroma = ChromaClient(host=config.host, port=config.port, collection_prefix=config.collection_prefix)
    return chroma.test_connection()
