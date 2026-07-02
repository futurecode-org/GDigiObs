"""仪表盘/大屏/舆情相关数据模型"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class DashboardStatsResponse(BaseModel):
    """工作台/大屏统计卡片响应"""
    users: int = Field(default=0, description="用户总数")
    tenants: int = Field(default=0, description="租户总数")
    messages: int = Field(default=0, description="消息总数")
    collected: int = Field(default=0, description="采集数据量")
    cleaned: int = Field(default=0, description="清洗数据量")
    analyzed: int = Field(default=0, description="已分析数据量")
    analysis_tasks: int = Field(default=0, description="分析任务量")
    ask_records: int = Field(default=0, description="问数次数")
    model_calls: int = Field(default=0, description="模型调用次数")
    model_tokens: int = Field(default=0, description="Token 消耗")
    sensitive_messages: int = Field(default=0, description="敏感消息数(中高风险)")
    negative_collected: int = Field(default=0, description="负面采集数据数")
    alert_count: int = Field(default=0, description="未处理告警数")
    agent_runs: int = Field(default=0, description="数字员工执行次数")
    agent_success_rate: float = Field(default=0.0, description="数字员工成功率")


class StatChange(BaseModel):
    """统计项涨跌"""
    value: float = Field(default=0.0, description="变化百分比")
    direction: str = Field(default="up", description="up/down")


class DashboardStatsWithChange(BaseModel):
    """带涨跌幅的统计卡片"""
    stats: DashboardStatsResponse
    changes: Dict[str, StatChange] = Field(default_factory=dict, description="各指标较昨日变化")


class TrendItem(BaseModel):
    """趋势数据点"""
    date: str = Field(..., description="日期 YYYY-MM-DD")
    messages: int = Field(default=0)
    queries: int = Field(default=0)
    tasks: int = Field(default=0)
    collected: int = Field(default=0)
    cleaned: int = Field(default=0)
    analyzed: int = Field(default=0)
    model_calls: int = Field(default=0)


class DashboardTrendsResponse(BaseModel):
    """趋势响应"""
    items: List[TrendItem]
    days: int = Field(default=7, description="统计天数")


class SentimentItem(BaseModel):
    """情感分布项"""
    name: str
    value: int
    color: Optional[str] = None


class DashboardSentimentResponse(BaseModel):
    """情感分布响应"""
    collect: List[SentimentItem] = Field(default_factory=list, description="采集数据情感")
    chat: List[SentimentItem] = Field(default_factory=list, description="聊天消息风险等级")


class KeywordItem(BaseModel):
    """关键词项"""
    name: str
    value: int


class DashboardKeywordsResponse(BaseModel):
    """关键词响应"""
    items: List[KeywordItem]


class WordCloudItem(BaseModel):
    """词云项"""
    name: str
    value: int


class DashboardWordCloudResponse(BaseModel):
    """词云响应"""
    items: List[WordCloudItem]


class GeoCoord(BaseModel):
    """地理坐标"""
    name: str
    value: List[float]  # [lng, lat, value]


class GeoLine(BaseModel):
    """3D 飞线"""
    from_coord: List[float]
    to_coord: List[float]


class DashboardGeoResponse(BaseModel):
    """3D 地球数据响应"""
    points: List[GeoCoord] = Field(default_factory=list)
    lines: List[GeoLine] = Field(default_factory=list)
    note: str = Field(default="", description="数据说明")


class RiskOverviewResponse(BaseModel):
    """风险概览响应"""
    high_risk_messages: int = Field(default=0)
    medium_risk_messages: int = Field(default=0)
    low_risk_messages: int = Field(default=0)
    negative_collected: int = Field(default=0)
    unresolved_alerts: int = Field(default=0)
    recent_alerts: List[Dict[str, Any]] = Field(default_factory=list)


class PublicOpinionAnalyzeRequest(BaseModel):
    """智能舆情分析请求"""
    data_sources: List[str] = Field(
        default=["chat", "collect"],
        description="数据源: chat(聊天子系统)/collect(瞭望子系统)"
    )
    days: int = Field(default=7, ge=1, le=30, description="分析近 N 天数据")
    chat_limit: int = Field(default=100, ge=1, le=300, description="聊天消息采样数")
    collect_limit: int = Field(default=100, ge=1, le=300, description="采集数据采样数")
    model_id: Optional[int] = Field(None, description="指定模型 ID，为空使用默认模型")


class RiskEvent(BaseModel):
    """风险事件"""
    level: str = Field(..., description="high/medium/low")
    source: str = Field(..., description="chat/collect")
    title: str
    summary: str
    suggestion: str


class PublicOpinionAnalyzeResponse(BaseModel):
    """智能舆情分析响应"""
    summary: str = Field(..., description="分析摘要")
    risk_events: List[RiskEvent] = Field(default_factory=list)
    sentiment_trend: List[Dict[str, Any]] = Field(default_factory=list)
    keywords: List[KeywordItem] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
    model_id: Optional[int] = None
    model_name: Optional[str] = None
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)
