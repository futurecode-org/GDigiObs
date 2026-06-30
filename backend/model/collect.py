from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Text,
    JSON,
)
from database.session import Base
from model.base import BaseModelMixin


class CollectPlatform(Base, BaseModelMixin):
    """采集平台表"""

    __tablename__ = "collect_platforms"

    name = Column(String(100), nullable=False, comment="平台名称")
    platform_type = Column(
        String(50),
        nullable=False,
        comment="平台类型: news/rss/social/forum/video/industry/other",
    )
    default_method = Column(
        String(20), default="api", comment="默认采集方式: api/rss/crawler"
    )
    config_schema = Column(JSON, nullable=True, comment="配置Schema")
    description = Column(String(500), nullable=True, comment="平台描述")
    status = Column(String(20), default="enabled", comment="状态: enabled/disabled")


class CollectTask(Base, BaseModelMixin):
    """采集任务表"""

    __tablename__ = "collect_tasks"

    tenant_id = Column(
        Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID"
    )
    name = Column(String(100), nullable=False, comment="任务名称")
    platform_id = Column(
        Integer, ForeignKey("collect_platforms.id"), nullable=False, comment="平台ID"
    )
    collect_method = Column(
        String(20), nullable=False, comment="采集方式: api/rss/crawler"
    )
    source_url = Column(Text, nullable=True, comment="采集地址: URL/API/RSS地址")
    request_config = Column(
        JSON, nullable=True, comment="请求配置: Header/参数/认证信息"
    )
    parse_rule = Column(
        JSON, nullable=True, comment="解析规则: 标题/正文/作者/发布时间等提取规则"
    )
    schedule_config = Column(
        JSON, nullable=True, comment="定时配置: Cron表达式或周期配置"
    )
    is_public = Column(Boolean, default=False, comment="是否公开")
    status = Column(
        String(20), default="draft", comment="状态: draft/enabled/disabled/error"
    )
    last_run_at = Column(DateTime, nullable=True, comment="最近运行时间")
    fail_count = Column(Integer, default=0, comment="连续失败次数")
    created_by = Column(
        Integer, ForeignKey("users.id"), nullable=False, comment="创建人ID"
    )
    deleted_at = Column(DateTime, nullable=True, comment="删除时间")


class CollectedItem(Base, BaseModelMixin):
    """采集数据表（原文存档）"""

    __tablename__ = "collected_items"

    tenant_id = Column(
        Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID"
    )
    task_id = Column(
        Integer,
        ForeignKey("collect_tasks.id"),
        nullable=False,
        index=True,
        comment="任务ID",
    )
    title = Column(String(500), nullable=True, comment="标题")
    content = Column(Text, nullable=True, comment="正文内容")
    author = Column(String(200), nullable=True, comment="作者")
    publish_at = Column(DateTime, nullable=True, comment="发布时间")
    source_platform = Column(String(100), nullable=True, comment="来源平台")
    source_url = Column(Text, nullable=True, comment="来源URL")
    raw_content = Column(Text, nullable=True, comment="原始HTML/JSON")
    raw_content_type = Column(
        String(50), default="html", comment="原始内容类型: html/json/text"
    )
    content_hash = Column(String(128), nullable=True, index=True, comment="内容Hash")
    attachments = Column(JSON, nullable=True, comment="附件: 图片/文件等")
    sentiment = Column(
        String(20), nullable=True, comment="情感: positive/neutral/negative"
    )
    tags = Column(JSON, nullable=True, comment="标签")
    entities = Column(JSON, nullable=True, comment="实体")
    is_public = Column(Boolean, default=False, comment="是否公开")
    status = Column(
        String(20), default="raw", comment="状态: raw/cleaned/analyzed/duplicate/error"
    )


class CollectLog(Base, BaseModelMixin):
    """采集日志表"""

    __tablename__ = "collect_logs"

    tenant_id = Column(
        Integer, ForeignKey("tenants.id"), nullable=False, index=True, comment="租户ID"
    )
    task_id = Column(
        Integer,
        ForeignKey("collect_tasks.id"),
        nullable=False,
        index=True,
        comment="任务ID",
    )
    run_at = Column(DateTime, nullable=False, comment="运行时间")
    status = Column(String(20), nullable=False, comment="状态: success/failed/partial")
    items_count = Column(Integer, default=0, comment="采集条数")
    error_message = Column(Text, nullable=True, comment="错误信息")
    duration_seconds = Column(Integer, nullable=True, comment="耗时秒数")
