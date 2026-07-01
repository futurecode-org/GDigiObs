from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON, DateTime, Float
from database.session import Base
from model.base import BaseModelMixin


class KBRetrievalLog(Base, BaseModelMixin):
    """知识库检索调用记录表"""
    __tablename__ = "kb_retrieval_logs"
    
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID")
    kb_id = Column(Integer, ForeignKey("knowledge_bases.id"), nullable=False, index=True, comment="知识库ID")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    query = Column(Text, nullable=False, comment="查询内容")
    retrieval_type = Column(String(20), default="local", comment="检索类型: local/dify")
    results_count = Column(Integer, default=0, comment="返回结果数")
    top_results = Column(JSON, nullable=True, comment="Top 结果摘要")
    latency_ms = Column(Integer, nullable=True, comment="耗时毫秒")
    status = Column(String(20), default="success", comment="状态: success/failed")
    error_message = Column(Text, nullable=True, comment="错误信息")
