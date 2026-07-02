"""仪表盘/大屏/舆情控制器"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from core.response import ApiResponse
from core.dependencies import get_request_context, require_admin, RequestContext
from service.dashboard_service import (
    get_dashboard_stats_service,
    get_dashboard_trends_service,
    get_dashboard_sentiment_service,
    get_dashboard_keywords_service,
    get_dashboard_wordcloud_service,
    get_dashboard_geo_service,
    get_risk_overview_service,
    analyze_public_opinion_service,
)
from schema.dashboard import (
    DashboardStatsWithChange,
    DashboardTrendsResponse,
    DashboardSentimentResponse,
    DashboardKeywordsResponse,
    DashboardWordCloudResponse,
    DashboardGeoResponse,
    RiskOverviewResponse,
    PublicOpinionAnalyzeRequest,
    PublicOpinionAnalyzeResponse,
)


dashboard_router = APIRouter(prefix="/dashboard", tags=["仪表盘 Dashboard"])


@dashboard_router.get("/stats", summary="工作台/大屏统计")
def dashboard_stats(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取工作台与大屏顶部统计指标"""
    result = get_dashboard_stats_service(db, ctx)
    return ApiResponse.success(data=result)


@dashboard_router.get("/trends", summary="趋势数据")
def dashboard_trends(
    days: int = 7,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取近 N 天趋势数据"""
    result = get_dashboard_trends_service(db, ctx, days=days)
    return ApiResponse.success(data=result)


@dashboard_router.get("/sentiment", summary="情感分布")
def dashboard_sentiment(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取采集数据情感分布与聊天消息风险分布"""
    result = get_dashboard_sentiment_service(db, ctx)
    return ApiResponse.success(data=result)


@dashboard_router.get("/keywords", summary="关键词 TopN")
def dashboard_keywords(
    top_n: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取关键词 TopN"""
    result = get_dashboard_keywords_service(db, ctx, top_n=top_n)
    return ApiResponse.success(data=result)


@dashboard_router.get("/wordcloud", summary="词云数据")
def dashboard_wordcloud(
    top_n: int = 100,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取词云数据"""
    result = get_dashboard_wordcloud_service(db, ctx, top_n=top_n)
    return ApiResponse.success(data=result)


@dashboard_router.get("/geo", summary="3D 地球数据")
def dashboard_geo(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取 3D 地球可视化数据"""
    result = get_dashboard_geo_service(db, ctx)
    return ApiResponse.success(data=result)


@dashboard_router.get("/risk-overview", summary="风险概览")
def dashboard_risk_overview(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取风险概览数据"""
    result = get_risk_overview_service(db, ctx)
    return ApiResponse.success(data=result)


@dashboard_router.post("/public-opinion/analyze", summary="智能舆情 AI 分析")
def dashboard_public_opinion_analyze(
    data: PublicOpinionAnalyzeRequest,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_admin()
):
    """综合分析聊天子系统与瞭望子系统数据，识别舆情风险"""
    result = analyze_public_opinion_service(
        db, ctx,
        data_sources=data.data_sources,
        days=data.days,
        chat_limit=data.chat_limit,
        collect_limit=data.collect_limit,
        model_id=data.model_id,
    )
    return ApiResponse.success(data=result)
