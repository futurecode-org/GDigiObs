"""仪表盘/大屏/舆情业务逻辑层"""

import json
import logging
import re
from collections import Counter
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from sqlalchemy import func, Integer
from sqlalchemy.orm import Session

from core.dependencies import RequestContext
from core.exceptions import BadRequestException
from model.alert import AlertRecord
from model.analysis import AnalysisLog, AnalysisTask
from model.collect import CollectedItem, CollectLog
from model.conversation import Message
from model.dify import DifyCallLog
from model.log import AskRecord, AuditLog
from model.tenant import Tenant
from model.user import User
from model.workflow import WorkflowRun
from model.agent import AgentRun

logger = logging.getLogger(__name__)

# 简单中文停用词
STOP_WORDS = set(
    "的,了,在,是,我,有,和,就,不,人,都,一,一个,上,也,很,到,说,要,去,你,会,着,没有,看,好,自己,这,那,我们,他,她,它,们,这个,那个,为,之,与,及,而,或,但,如果,因为,所以,可以,已经,现在,今天,明天,昨天,已经,进行,认为,表示,目前,需要,能够,成为,作为,对于,关于,通过,根据,由于,随着,以及,但是,因此,所有,一些,这样,那样,这里,那里,怎么,什么,为什么,如何,谁,哪,个,第,更,最,太,非常,已经,正在,曾经,正在,一直,一起,一次,一下,一种,方面,问题,工作,情况,时间,公司,企业,产品,服务,用户,数据,系统,平台,信息,内容,功能,技术,业务,市场,行业".split(",")
)

# 来源平台 -> 城市经纬度（演示映射）
PLATFORM_GEO_MAP = {
    "微博": {"coord": [116.4074, 39.9042], "city": "北京"},
    "weibo": {"coord": [116.4074, 39.9042], "city": "北京"},
    "微信": {"coord": [121.4737, 31.2304], "city": "上海"},
    "wechat": {"coord": [121.4737, 31.2304], "city": "上海"},
    "twitter": {"coord": [-74.0060, 40.7128], "city": "纽约"},
    "推特": {"coord": [-74.0060, 40.7128], "city": "纽约"},
    "facebook": {"coord": [-122.4194, 37.7749], "city": "旧金山"},
    "脸书": {"coord": [-122.4194, 37.7749], "city": "旧金山"},
    "reddit": {"coord": [-77.0369, 38.9072], "city": "华盛顿"},
    "知乎": {"coord": [116.4074, 39.9042], "city": "北京"},
    "zhihu": {"coord": [116.4074, 39.9042], "city": "北京"},
    "头条": {"coord": [116.4074, 39.9042], "city": "北京"},
    "toutiao": {"coord": [116.4074, 39.9042], "city": "北京"},
    "新闻": {"coord": [116.4074, 39.9042], "city": "北京"},
    "rss": {"coord": [121.4737, 31.2304], "city": "上海"},
    "论坛": {"coord": [113.2644, 23.1291], "city": "广州"},
    "forum": {"coord": [113.2644, 23.1291], "city": "广州"},
    "视频网站": {"coord": [114.0579, 22.5431], "city": "深圳"},
    "video": {"coord": [114.0579, 22.5431], "city": "深圳"},
    "行业网站": {"coord": [120.1551, 30.2741], "city": "杭州"},
    "industry": {"coord": [120.1551, 30.2741], "city": "杭州"},
}

SENTIMENT_COLORS = {
    "positive": "#10B981",
    "neutral": "#6B7280",
    "negative": "#EF4444",
    "none": "#9CA3AF",
    "low": "#F59E0B",
    "medium": "#F97316",
    "high": "#EF4444",
}


def _get_date_range(days: int = 7) -> (datetime, datetime):
    """获取日期范围"""
    end = datetime.utcnow()
    start = end - timedelta(days=days)
    return start, end


def _build_tenant_filter(ctx: RequestContext, model) -> Any:
    """构建租户过滤条件"""
    if ctx.is_super_admin:
        return None
    return model.tenant_id == ctx.tenant_id


def _fill_date_series(days: int, data_map: Dict[str, Dict[str, int]]) -> List[Dict[str, Any]]:
    """补全无数据的日期"""
    result = []
    end = datetime.utcnow().date()
    for i in range(days - 1, -1, -1):
        d = end - timedelta(days=i)
        key = str(d)
        result.append({
            "date": key,
            "messages": data_map.get(key, {}).get("messages", 0),
            "queries": data_map.get(key, {}).get("queries", 0),
            "tasks": data_map.get(key, {}).get("tasks", 0),
            "collected": data_map.get(key, {}).get("collected", 0),
            "cleaned": data_map.get(key, {}).get("cleaned", 0),
            "analyzed": data_map.get(key, {}).get("analyzed", 0),
            "model_calls": data_map.get(key, {}).get("model_calls", 0),
        })
    return result


def get_dashboard_stats_service(db: Session, ctx: RequestContext) -> Dict[str, Any]:
    """获取工作台/大屏统计"""
    tenant_filter_user = _build_tenant_filter(ctx, User)
    tenant_filter_item = _build_tenant_filter(ctx, CollectedItem)
    tenant_filter_task = _build_tenant_filter(ctx, AnalysisTask)
    tenant_filter_ask = _build_tenant_filter(ctx, AskRecord)
    tenant_filter_msg = _build_tenant_filter(ctx, Message)
    tenant_filter_alert = _build_tenant_filter(ctx, AlertRecord)
    tenant_filter_agent_run = _build_tenant_filter(ctx, AgentRun)
    tenant_filter_dify = _build_tenant_filter(ctx, DifyCallLog)

    # 用户数
    user_q = db.query(func.count(User.id))
    if tenant_filter_user is not None:
        user_q = user_q.filter(tenant_filter_user)
    users = user_q.scalar() or 0

    # 租户数（仅超管可见，否则为 0）
    tenants = db.query(func.count(Tenant.id)).scalar() or 0 if ctx.is_super_admin else 0

    # 消息数
    msg_q = db.query(func.count(Message.id))
    if tenant_filter_msg is not None:
        msg_q = msg_q.filter(tenant_filter_msg)
    messages = msg_q.scalar() or 0

    # 采集量
    item_q = db.query(func.count(CollectedItem.id))
    if tenant_filter_item is not None:
        item_q = item_q.filter(tenant_filter_item)
    collected = item_q.scalar() or 0

    # 清洗量
    cleaned_q = db.query(func.count(CollectedItem.id))
    if tenant_filter_item is not None:
        cleaned_q = cleaned_q.filter(tenant_filter_item)
    cleaned = cleaned_q.filter(CollectedItem.status == "cleaned").scalar() or 0

    # 已分析量
    analyzed_q = db.query(func.count(CollectedItem.id))
    if tenant_filter_item is not None:
        analyzed_q = analyzed_q.filter(tenant_filter_item)
    analyzed = analyzed_q.filter(CollectedItem.status == "analyzed").scalar() or 0

    # 分析任务量
    task_q = db.query(func.count(AnalysisTask.id))
    if tenant_filter_task is not None:
        task_q = task_q.filter(tenant_filter_task)
    analysis_tasks = task_q.scalar() or 0

    # 问数次数
    ask_q = db.query(func.count(AskRecord.id))
    if tenant_filter_ask is not None:
        ask_q = ask_q.filter(tenant_filter_ask)
    ask_records = ask_q.scalar() or 0

    # 模型调用次数（DifyCallLog）
    dify_q = db.query(func.count(DifyCallLog.id))
    if tenant_filter_dify is not None:
        dify_q = dify_q.filter(tenant_filter_dify)
    model_calls = dify_q.scalar() or 0

    # Token 消耗
    token_q = db.query(func.coalesce(func.sum(
        func.json_extract(DifyCallLog.token_usage, "$.total_tokens").cast(Integer)
    ), 0))
    if tenant_filter_dify is not None:
        token_q = token_q.filter(tenant_filter_dify)
    model_tokens = token_q.scalar() or 0

    # 敏感消息（中高风险）
    sensitive_q = db.query(func.count(Message.id))
    if tenant_filter_msg is not None:
        sensitive_q = sensitive_q.filter(tenant_filter_msg)
    sensitive_messages = sensitive_q.filter(Message.risk_level.in_(["medium", "high"])).scalar() or 0

    # 负面采集
    negative_q = db.query(func.count(CollectedItem.id))
    if tenant_filter_item is not None:
        negative_q = negative_q.filter(tenant_filter_item)
    negative_collected = negative_q.filter(CollectedItem.sentiment == "negative").scalar() or 0

    # 未处理告警
    alert_q = db.query(func.count(AlertRecord.id)).filter(AlertRecord.status == "unresolved")
    if tenant_filter_alert is not None:
        alert_q = alert_q.filter(tenant_filter_alert)
    alert_count = alert_q.scalar() or 0

    # 数字员工执行
    agent_run_q = db.query(func.count(AgentRun.id))
    if tenant_filter_agent_run is not None:
        agent_run_q = agent_run_q.filter(tenant_filter_agent_run)
    agent_runs = agent_run_q.scalar() or 0

    agent_success_q = db.query(func.count(AgentRun.id))
    if tenant_filter_agent_run is not None:
        agent_success_q = agent_success_q.filter(tenant_filter_agent_run)
    agent_success = agent_success_q.filter(AgentRun.status == "success").scalar() or 0
    agent_success_rate = round(agent_success / agent_runs * 100, 2) if agent_runs else 0.0

    stats = {
        "users": users,
        "tenants": tenants,
        "messages": messages,
        "collected": collected,
        "cleaned": cleaned,
        "analyzed": analyzed,
        "analysis_tasks": analysis_tasks,
        "ask_records": ask_records,
        "model_calls": model_calls,
        "model_tokens": int(model_tokens),
        "sensitive_messages": sensitive_messages,
        "negative_collected": negative_collected,
        "alert_count": alert_count,
        "agent_runs": agent_runs,
        "agent_success_rate": agent_success_rate,
    }

    # 计算较昨日涨跌幅
    changes = _compute_changes(db, ctx)
    return {"stats": stats, "changes": changes}


def _compute_changes(db: Session, ctx: RequestContext) -> Dict[str, Any]:
    """计算关键指标较昨日变化"""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    def _count_between(model, filter_field, tenant_field=None):
        q = db.query(func.count(model.id)).filter(
            filter_field >= yesterday_start,
            filter_field < today_start
        )
        if tenant_field is not None and not ctx.is_super_admin:
            q = q.filter(tenant_field == ctx.tenant_id)
        return q.scalar() or 0

    def _calc_change(today: int, yesterday: int) -> Dict[str, Any]:
        if yesterday == 0:
            return {"value": today * 100.0 if today else 0.0, "direction": "up"}
        delta = (today - yesterday) / yesterday * 100
        return {"value": round(abs(delta), 2), "direction": "up" if delta >= 0 else "down"}

    # 今日/昨日消息
    today_messages = db.query(func.count(Message.id)).filter(Message.created_at >= today_start)
    if not ctx.is_super_admin:
        today_messages = today_messages.filter(Message.tenant_id == ctx.tenant_id)
    today_messages = today_messages.scalar() or 0
    yesterday_messages = _count_between(Message, Message.created_at, Message.tenant_id)

    # 今日/昨日采集
    today_collected = db.query(func.count(CollectedItem.id)).filter(CollectedItem.created_at >= today_start)
    if not ctx.is_super_admin:
        today_collected = today_collected.filter(CollectedItem.tenant_id == ctx.tenant_id)
    today_collected = today_collected.scalar() or 0
    yesterday_collected = _count_between(CollectedItem, CollectedItem.created_at, CollectedItem.tenant_id)

    # 今日/昨日问数
    today_ask = db.query(func.count(AskRecord.id)).filter(AskRecord.created_at >= today_start)
    if not ctx.is_super_admin:
        today_ask = today_ask.filter(AskRecord.tenant_id == ctx.tenant_id)
    today_ask = today_ask.scalar() or 0
    yesterday_ask = _count_between(AskRecord, AskRecord.created_at, AskRecord.tenant_id)

    # 今日/昨日模型调用
    today_model = db.query(func.count(DifyCallLog.id)).filter(DifyCallLog.created_at >= today_start)
    if not ctx.is_super_admin:
        today_model = today_model.filter(DifyCallLog.tenant_id == ctx.tenant_id)
    today_model = today_model.scalar() or 0
    yesterday_model = _count_between(DifyCallLog, DifyCallLog.created_at, DifyCallLog.tenant_id)

    return {
        "messages": _calc_change(today_messages, yesterday_messages),
        "collected": _calc_change(today_collected, yesterday_collected),
        "ask_records": _calc_change(today_ask, yesterday_ask),
        "model_calls": _calc_change(today_model, yesterday_model),
    }


def get_dashboard_trends_service(db: Session, ctx: RequestContext, days: int = 7) -> Dict[str, Any]:
    """获取趋势数据"""
    start, end = _get_date_range(days)

    def _apply_tenant(q, model):
        if not ctx.is_super_admin:
            q = q.filter(model.tenant_id == ctx.tenant_id)
        return q

    # messages
    msg_rows = _apply_tenant(
        db.query(func.date(Message.created_at).label("d"), func.count(Message.id).label("c")),
        Message
    ).filter(Message.created_at >= start).group_by(func.date(Message.created_at)).all()

    # ask
    ask_rows = _apply_tenant(
        db.query(func.date(AskRecord.created_at).label("d"), func.count(AskRecord.id).label("c")),
        AskRecord
    ).filter(AskRecord.created_at >= start).group_by(func.date(AskRecord.created_at)).all()

    # workflow runs (作为 tasks)
    wf_rows = _apply_tenant(
        db.query(func.date(WorkflowRun.started_at).label("d"), func.count(WorkflowRun.id).label("c")),
        WorkflowRun
    ).filter(WorkflowRun.started_at >= start).group_by(func.date(WorkflowRun.started_at)).all()

    # collected items
    item_rows = _apply_tenant(
        db.query(func.date(CollectedItem.created_at).label("d"), func.count(CollectedItem.id).label("c")),
        CollectedItem
    ).filter(CollectedItem.created_at >= start).group_by(func.date(CollectedItem.created_at)).all()

    # cleaned
    cleaned_rows = _apply_tenant(
        db.query(func.date(CollectedItem.created_at).label("d"), func.count(CollectedItem.id).label("c")),
        CollectedItem
    ).filter(CollectedItem.created_at >= start, CollectedItem.status == "cleaned").group_by(
        func.date(CollectedItem.created_at)
    ).all()

    # analyzed
    analyzed_rows = _apply_tenant(
        db.query(func.date(CollectedItem.created_at).label("d"), func.count(CollectedItem.id).label("c")),
        CollectedItem
    ).filter(CollectedItem.created_at >= start, CollectedItem.status == "analyzed").group_by(
        func.date(CollectedItem.created_at)
    ).all()

    # model calls
    model_rows = _apply_tenant(
        db.query(func.date(DifyCallLog.created_at).label("d"), func.count(DifyCallLog.id).label("c")),
        DifyCallLog
    ).filter(DifyCallLog.created_at >= start).group_by(func.date(DifyCallLog.created_at)).all()

    data_map: Dict[str, Dict[str, int]] = {}
    for rows, key in [
        (msg_rows, "messages"),
        (ask_rows, "queries"),
        (wf_rows, "tasks"),
        (item_rows, "collected"),
        (cleaned_rows, "cleaned"),
        (analyzed_rows, "analyzed"),
        (model_rows, "model_calls"),
    ]:
        for r in rows:
            date_key = str(r.d)
            data_map.setdefault(date_key, {})[key] = r.c

    items = _fill_date_series(days, data_map)
    return {"items": items, "days": days}


def get_dashboard_sentiment_service(db: Session, ctx: RequestContext) -> Dict[str, Any]:
    """获取情感分布"""
    item_q = db.query(CollectedItem.sentiment, func.count(CollectedItem.id))
    if not ctx.is_super_admin:
        item_q = item_q.filter(CollectedItem.tenant_id == ctx.tenant_id)
    item_rows = item_q.group_by(CollectedItem.sentiment).all()

    collect_counts = {"positive": 0, "neutral": 0, "negative": 0}
    for sentiment, cnt in item_rows:
        if sentiment in collect_counts:
            collect_counts[sentiment] = cnt

    collect_items = [
        {"name": "正面", "value": collect_counts["positive"], "color": SENTIMENT_COLORS["positive"]},
        {"name": "中性", "value": collect_counts["neutral"], "color": SENTIMENT_COLORS["neutral"]},
        {"name": "负面", "value": collect_counts["negative"], "color": SENTIMENT_COLORS["negative"]},
    ]

    # 聊天风险等级
    msg_q = db.query(Message.risk_level, func.count(Message.id))
    if not ctx.is_super_admin:
        msg_q = msg_q.filter(Message.tenant_id == ctx.tenant_id)
    msg_rows = msg_q.group_by(Message.risk_level).all()

    chat_counts = {"none": 0, "low": 0, "medium": 0, "high": 0}
    for risk_level, cnt in msg_rows:
        if risk_level in chat_counts:
            chat_counts[risk_level] = cnt

    chat_items = [
        {"name": "无风险", "value": chat_counts["none"], "color": SENTIMENT_COLORS["none"]},
        {"name": "低风险", "value": chat_counts["low"], "color": SENTIMENT_COLORS["low"]},
        {"name": "中风险", "value": chat_counts["medium"], "color": SENTIMENT_COLORS["medium"]},
        {"name": "高风险", "value": chat_counts["high"], "color": SENTIMENT_COLORS["high"]},
    ]

    return {"collect": collect_items, "chat": chat_items}


def _extract_words(texts: List[str]) -> Counter:
    """提取中文/英文词"""
    counter = Counter()
    for text in texts:
        if not text:
            continue
        # 英文单词
        for word in re.findall(r"[a-zA-Z]{3,}", text):
            word = word.lower()
            if word not in STOP_WORDS:
                counter[word] += 1
        # 中文：简单按 2-4 字滑动提取，避免引入 jieba 依赖
        cleaned = re.sub(r"[^\u4e00-\u9fa5]", "", text)
        for length in (2, 3, 4):
            for i in range(0, len(cleaned) - length + 1):
                seg = cleaned[i:i + length]
                if seg not in STOP_WORDS:
                    counter[seg] += 1
    return counter


def get_dashboard_keywords_service(db: Session, ctx: RequestContext, top_n: int = 20) -> Dict[str, Any]:
    """获取关键词 TopN"""
    q = db.query(CollectedItem)
    if not ctx.is_super_admin:
        q = q.filter(CollectedItem.tenant_id == ctx.tenant_id)
    items = q.order_by(CollectedItem.created_at.desc()).limit(500).all()

    # 优先从 tags 提取
    counter = Counter()
    texts = []
    for item in items:
        if item.tags and isinstance(item.tags, dict):
            for k, v in item.tags.items():
                if isinstance(v, list):
                    for tag in v:
                        if isinstance(tag, str) and tag not in STOP_WORDS:
                            counter[tag] += 1
                elif isinstance(v, str) and v not in STOP_WORDS:
                    counter[v] += 1
        title = item.title or ""
        content = (item.content or "")[:500]
        texts.append(f"{title} {content}")

    word_counter = _extract_words(texts)
    # tags 权重更高
    for k, v in counter.items():
        word_counter[k] += v * 2

    return {
        "items": [
            {"name": k, "value": v}
            for k, v in word_counter.most_common(top_n)
        ]
    }


def get_dashboard_wordcloud_service(db: Session, ctx: RequestContext, top_n: int = 100) -> Dict[str, Any]:
    """获取词云数据"""
    keywords = get_dashboard_keywords_service(db, ctx, top_n=top_n)
    return {"items": keywords["items"]}


def get_dashboard_geo_service(db: Session, ctx: RequestContext) -> Dict[str, Any]:
    """获取 3D 地球地理数据（按来源平台映射演示）"""
    q = db.query(
        CollectedItem.source_platform,
        func.count(CollectedItem.id).label("cnt")
    )
    if not ctx.is_super_admin:
        q = q.filter(CollectedItem.tenant_id == ctx.tenant_id)
    rows = q.group_by(CollectedItem.source_platform).all()

    points = []
    for platform, cnt in rows:
        key = (platform or "").lower()
        geo = PLATFORM_GEO_MAP.get(key)
        if not geo:
            # 模糊匹配
            for k, v in PLATFORM_GEO_MAP.items():
                if k in key or key in k:
                    geo = v
                    break
        if not geo:
            geo = {"coord": [116.4074, 39.9042], "city": "北京"}
        coord = geo["coord"] + [int(cnt)]
        points.append({"name": f"{geo['city']}({platform or '未知'})", "value": coord})

    # 生成飞线：北京 -> 其他城市
    lines = []
    if points:
        beijing = [116.4074, 39.9042]
        for p in points[1:]:
            lines.append({"from_coord": beijing, "to_coord": p["value"][:2]})

    return {
        "points": points,
        "lines": lines,
        "note": ""
    }


def get_risk_overview_service(db: Session, ctx: RequestContext) -> Dict[str, Any]:
    """获取风险概览"""
    msg_q = db.query(Message.risk_level, func.count(Message.id))
    if not ctx.is_super_admin:
        msg_q = msg_q.filter(Message.tenant_id == ctx.tenant_id)
    msg_rows = msg_q.group_by(Message.risk_level).all()

    msg_counts = {"high": 0, "medium": 0, "low": 0}
    for level, cnt in msg_rows:
        if level in msg_counts:
            msg_counts[level] = cnt

    negative_q = db.query(func.count(CollectedItem.id))
    if not ctx.is_super_admin:
        negative_q = negative_q.filter(CollectedItem.tenant_id == ctx.tenant_id)
    negative_collected = negative_q.filter(CollectedItem.sentiment == "negative").scalar() or 0

    alert_q = db.query(AlertRecord).filter(AlertRecord.status == "unresolved")
    if not ctx.is_super_admin:
        alert_q = alert_q.filter(AlertRecord.tenant_id == ctx.tenant_id)
    unresolved_alerts = alert_q.count()
    recent_alerts = [
        {
            "id": a.id,
            "title": a.title,
            "risk_level": a.risk_level,
            "alert_type": a.alert_type,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in alert_q.order_by(AlertRecord.created_at.desc()).limit(5).all()
    ]

    return {
        "high_risk_messages": msg_counts["high"],
        "medium_risk_messages": msg_counts["medium"],
        "low_risk_messages": msg_counts["low"],
        "negative_collected": negative_collected,
        "unresolved_alerts": unresolved_alerts,
        "recent_alerts": recent_alerts,
    }


def analyze_public_opinion_service(
    db: Session,
    ctx: RequestContext,
    data_sources: List[str],
    days: int,
    chat_limit: int,
    collect_limit: int,
    model_id: Optional[int] = None,
) -> Dict[str, Any]:
    """智能舆情 AI 分析"""
    start = datetime.utcnow() - timedelta(days=days)

    chat_samples = []
    collect_samples = []

    if "chat" in data_sources:
        q = db.query(Message).filter(
            Message.created_at >= start,
            Message.message_type == "text"
        )
        if not ctx.is_super_admin:
            q = q.filter(Message.tenant_id == ctx.tenant_id)
        chat_samples = [
            {
                "id": m.id,
                "content": m.content,
                "risk_level": m.risk_level,
                "risk_tags": m.risk_tags,
                "audit_status": m.audit_status,
                "created_at": m.created_at.isoformat() if m.created_at else None,
            }
            for m in q.order_by(Message.created_at.desc()).limit(chat_limit).all()
        ]

    if "collect" in data_sources:
        q = db.query(CollectedItem).filter(CollectedItem.created_at >= start)
        if not ctx.is_super_admin:
            q = q.filter(CollectedItem.tenant_id == ctx.tenant_id)
        collect_samples = [
            {
                "id": c.id,
                "title": c.title,
                "content": (c.content or "")[:300],
                "sentiment": c.sentiment,
                "source_platform": c.source_platform,
                "tags": c.tags,
                "created_at": c.created_at.isoformat() if c.created_at else None,
            }
            for c in q.order_by(CollectedItem.created_at.desc()).limit(collect_limit).all()
        ]

    if not chat_samples and not collect_samples:
        return {
            "summary": "近期暂无聊天或采集数据，无法生成舆情分析。",
            "risk_events": [],
            "sentiment_trend": [],
            "keywords": [],
            "suggestions": ["建议配置采集任务或启用聊天审计以积累数据。"],
            "model_id": model_id,
            "model_name": None,
        }

    prompt = _build_public_opinion_prompt(chat_samples, collect_samples, days)

    model_name = None
    try:
        result, model_name = _invoke_llm(db, ctx, prompt, model_id=model_id)
        parsed = _parse_public_opinion_result(result)
        parsed["model_id"] = model_id
        parsed["model_name"] = model_name
        return parsed
    except Exception as e:
        logger.exception("智能舆情 AI 分析失败")
        # fallback: 基于规则生成简要分析
        fallback = _rule_based_public_opinion(chat_samples, collect_samples, days)
        fallback["model_id"] = model_id
        fallback["model_name"] = model_name
        return fallback


def _invoke_llm(db: Session, ctx: RequestContext, prompt: str, model_id: Optional[int] = None) -> tuple:
    """调用模型生成文本"""
    import httpx
    from model.model_config import ModelConfig
    from core.security import decrypt_api_key

    # 选择模型
    query = db.query(ModelConfig).filter(ModelConfig.status == "enabled", ModelConfig.model_type.in_(["llm", "chat"]))
    if model_id:
        query = query.filter(ModelConfig.id == model_id)
    else:
        # 优先选择平台模型
        query = query.order_by(
            ModelConfig.visibility == "platform",
            ModelConfig.id.asc()
        )
    model = query.first()
    if not model:
        raise BadRequestException("未找到可用的 LLM 模型，请先配置模型")

    api_key = None
    if model.api_key_encrypted:
        api_key = decrypt_api_key(model.api_key_encrypted)

    base_url = (model.base_url or "").rstrip("/")
    messages = [{"role": "user", "content": prompt}]

    if model.api_type == "anthropic":
        url = f"{base_url}/messages"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        }
        payload = {
            "model": model.model_key,
            "messages": messages,
            "max_tokens": 2048,
        }
    elif model.api_type == "ollama":
        url = f"{base_url}/api/chat"
        headers = {"Content-Type": "application/json"}
        payload = {
            "model": model.model_key,
            "messages": messages,
            "stream": False,
        }
    else:
        # openai / custom
        url = f"{base_url}/chat/completions"
        headers = {"Content-Type": "application/json"}
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
        payload = {
            "model": model.model_key,
            "messages": messages,
            "max_tokens": 2048,
            "temperature": 0.3,
        }

    with httpx.Client(timeout=60.0) as client:
        resp = client.post(url, headers=headers, json=payload)
        resp.raise_for_status()
        data = resp.json()

    if model.api_type == "ollama":
        text = data.get("message", {}).get("content", "")
    elif model.api_type == "anthropic":
        text = "".join([c.get("text", "") for c in data.get("content", [])])
    else:
        text = data.get("choices", [{}])[0].get("message", {}).get("content", "")

    return text, model.name


def _build_public_opinion_prompt(chat_samples: List[Dict], collect_samples: List[Dict], days: int) -> str:
    """构造舆情分析 prompt"""
    chat_text = json.dumps(chat_samples, ensure_ascii=False, indent=2)
    collect_text = json.dumps(collect_samples, ensure_ascii=False, indent=2)
    return f"""你是一名专业的舆情与风险分析专家。请根据以下近 {days} 天的数据，对智能聊天子系统和瞭望（数据采集）子系统进行综合分析，识别潜在风险并给出建议。

【聊天子系统样本】
{chat_text}

【瞭望子系统样本】
{collect_text}

请严格按以下 JSON 格式返回，不要包含其他说明：
{{
  "summary": "一段 200 字以内的分析摘要",
  "risk_events": [
    {{"level": "high|medium|low", "source": "chat|collect", "title": "风险标题", "summary": "风险内容摘要", "suggestion": "建议措施"}}
  ],
  "sentiment_trend": [
    {{"date": "YYYY-MM-DD", "positive": 0, "neutral": 0, "negative": 0}}
  ],
  "keywords": [
    {{"name": "关键词", "value": 10}}
  ],
  "suggestions": ["建议1", "建议2"]
}}
"""


def _parse_public_opinion_result(text: str) -> Dict[str, Any]:
    """解析模型返回的 JSON"""
    # 尝试提取 JSON 块
    match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
    if match:
        text = match.group(1)
    else:
        # 尝试找到第一个 { 到最后一个 }
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            text = text[start:end + 1]
    try:
        data = json.loads(text)
    except Exception:
        return {
            "summary": text[:500],
            "risk_events": [],
            "sentiment_trend": [],
            "keywords": [],
            "suggestions": [],
        }

    return {
        "summary": data.get("summary", ""),
        "risk_events": data.get("risk_events", []),
        "sentiment_trend": data.get("sentiment_trend", []),
        "keywords": data.get("keywords", []),
        "suggestions": data.get("suggestions", []),
    }


def _rule_based_public_opinion(chat_samples: List[Dict], collect_samples: List[Dict], days: int) -> Dict[str, Any]:
    """基于规则的 fallback 分析"""
    high_risk_chat = [c for c in chat_samples if c.get("risk_level") == "high"]
    medium_risk_chat = [c for c in chat_samples if c.get("risk_level") == "medium"]
    negative_collect = [c for c in collect_samples if c.get("sentiment") == "negative"]

    risk_events = []
    if high_risk_chat:
        risk_events.append({
            "level": "high",
            "source": "chat",
            "title": "聊天子系统存在高风险消息",
            "summary": f"发现 {len(high_risk_chat)} 条高风险聊天消息，可能涉及违规、敏感内容。",
            "suggestion": "建议立即复核高风险消息并启动人工审核流程。",
        })
    if medium_risk_chat:
        risk_events.append({
            "level": "medium",
            "source": "chat",
            "title": "聊天子系统存在中风险消息",
            "summary": f"发现 {len(medium_risk_chat)} 条中风险聊天消息。",
            "suggestion": "建议加强敏感词监控并提示用户。",
        })
    if negative_collect:
        risk_events.append({
            "level": "medium",
            "source": "collect",
            "title": "瞭望子系统采集到负面数据",
            "summary": f"发现 {len(negative_collect)} 条负面采集数据。",
            "suggestion": "建议对负面数据进行专题分析并生成舆情日报。",
        })

    # 关键词
    texts = []
    for c in chat_samples:
        texts.append(c.get("content", ""))
    for c in collect_samples:
        texts.append(f"{c.get('title', '')} {c.get('content', '')}")
    counter = _extract_words(texts)

    return {
        "summary": f"近 {days} 天共分析聊天样本 {len(chat_samples)} 条、采集样本 {len(collect_samples)} 条。发现高风险聊天 {len(high_risk_chat)} 条、中风险 {len(medium_risk_chat)} 条、负面采集 {len(negative_collect)} 条。",
        "risk_events": risk_events,
        "sentiment_trend": [],
        "keywords": [{"name": k, "value": v} for k, v in counter.most_common(20)],
        "suggestions": [
            "对高风险消息进行人工复核",
            "对负面采集数据生成专项分析报告",
            "优化敏感词库与 AI 检测模型",
        ],
    }
