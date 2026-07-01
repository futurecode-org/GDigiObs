from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, DateTime
from database.session import Base
from model.base import BaseModelMixin


class ChromaConfig(Base, BaseModelMixin):
    """Chroma 向量数据库配置表"""
    __tablename__ = "chroma_configs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True, index=True, comment="租户ID，空表示平台级")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, comment="创建人ID")
    name = Column(String(100), nullable=False, comment="配置名称")
    host = Column(String(500), nullable=False, comment="Chroma 服务器地址")
    port = Column(Integer, default=8000, comment="Chroma 端口")
    collection_prefix = Column(String(50), default="kb", comment="Collection 前缀")
    visibility = Column(String(20), default="platform", comment="可见范围: platform/tenant/personal")
    status = Column(String(20), default="enabled", comment="状态: enabled/disabled")
    remark = Column(Text, nullable=True, comment="备注")
    deleted_at = Column(DateTime, nullable=True, comment="删除时间")
