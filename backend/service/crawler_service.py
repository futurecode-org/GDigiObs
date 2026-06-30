"""Crawl4AI 爬虫服务 - 集成 Crawl4AI 实现网页采集"""

import logging
import hashlib
import json
import time
from typing import Optional, List, Dict, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Crawl4AI 可选依赖：如果未安装则优雅降级
_crawl4ai_available = False
try:
    from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
    from crawl4ai.extraction_strategy import JsonCssExtractionStrategy

    _crawl4ai_available = True
    logger.info("Crawl4AI 已加载")
except ImportError:
    logger.warning("Crawl4AI 未安装，爬虫采集功能不可用。请执行: pip install crawl4ai")


async def crawl_with_crawl4ai(
    url: str,
    request_config: Optional[Dict[str, Any]] = None,
    parse_rule: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    使用 Crawl4AI 执行网页采集

    Args:
        url: 目标URL
        request_config: 请求配置 {headers, params, auth, ...}
        parse_rule: 解析规则 {title_selector, content_selector, author_selector, ...}

    Returns:
        {
            "success": bool,
            "html": str,           # 原始HTML
            "markdown": str,       # Markdown正文
            "cleaned_html": str,   # 清洗后HTML
            "items": List[Dict],   # 结构化提取结果
            "links": List[str],    # 页面链接
            "error": str | None
        }
    """
    if not _crawl4ai_available:
        return {
            "success": False,
            "html": "",
            "markdown": "",
            "cleaned_html": "",
            "items": [],
            "links": [],
            "error": "Crawl4AI 未安装，请执行 pip install crawl4ai",
        }

    start_time = time.time()

    try:
        # 构建浏览器配置
        browser_config = BrowserConfig(
            headless=True,
            verbose=False,
        )

        # 应用请求配置
        if request_config:
            headers = request_config.get("headers", {})
            if headers:
                browser_config.headers = headers
            user_agent = request_config.get("user_agent")
            if user_agent:
                browser_config.user_agent = user_agent
            proxy = request_config.get("proxy")
            if proxy:
                browser_config.proxy = proxy

        # 构建运行配置
        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            wait_until="networkidle",
            page_timeout=30000,
        )

        # 应用等待配置
        if request_config:
            wait_for = request_config.get("wait_for")
            if wait_for:
                run_config.wait_for = wait_for
            delay_before_return_html = request_config.get("delay_before_return_html", 0)
            if delay_before_return_html:
                run_config.delay_before_return_html = delay_before_return_html

        # 构建提取策略
        extraction_strategy = None
        if parse_rule:
            css_selectors = {}
            for field_name, selector in parse_rule.items():
                if selector and field_name not in ("publish_time_selector",):
                    css_selectors[field_name] = selector

            if css_selectors:
                schema = {
                    "name": "content_extraction",
                    "baseSelector": parse_rule.get("base_selector", "body"),
                    "fields": [],
                }
                for name, sel in css_selectors.items():
                    field_def = {
                        "name": name,
                        "selector": sel,
                        "type": "html"
                        if name in ("content", "body", "text")
                        else "text",
                    }
                    schema["fields"].append(field_def)

                extraction_strategy = JsonCssExtractionStrategy(schema, verbose=False)
                run_config.extraction_strategy = extraction_strategy

        # 执行采集
        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(url=url, config=run_config)

        elapsed = int(time.time() - start_time)

        if not result.success:
            logger.error(f"Crawl4AI 采集失败: url={url}, error={result.error_message}")
            return {
                "success": False,
                "html": "",
                "markdown": "",
                "cleaned_html": "",
                "items": [],
                "links": [],
                "error": result.error_message or "采集失败",
                "duration_seconds": elapsed,
            }

        # 解析提取结果
        items = []
        if result.extracted_content:
            try:
                extracted = json.loads(result.extracted_content)
                if isinstance(extracted, list):
                    items = extracted
                elif isinstance(extracted, dict):
                    items = [extracted]
            except json.JSONDecodeError:
                items = [{"raw_extracted": result.extracted_content}]

        # 如果没有提取策略，使用默认的markdown作为内容
        if not items and result.markdown:
            items = [
                {
                    "title": "",
                    "content": result.markdown,
                    "author": "",
                    "publish_at": "",
                }
            ]

        # 获取链接
        links = []
        if hasattr(result, "links") and result.links:
            internal_links = result.links.get("internal", [])
            external_links = result.links.get("external", [])
            links = [
                l.get("href", "")
                for l in internal_links + external_links
                if l.get("href")
            ]

        return {
            "success": True,
            "html": result.html or "",
            "markdown": result.markdown or "",
            "cleaned_html": result.cleaned_html or "",
            "items": items,
            "links": links[:100],  # 限制链接数量
            "error": None,
            "duration_seconds": elapsed,
        }

    except Exception as e:
        elapsed = int(time.time() - start_time)
        logger.error(f"Crawl4AI 采集异常: url={url}, error={str(e)}")
        return {
            "success": False,
            "html": "",
            "markdown": "",
            "cleaned_html": "",
            "items": [],
            "links": [],
            "error": str(e),
            "duration_seconds": elapsed,
        }


async def crawl_rss(
    url: str, request_config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    用 HTTP 直接请求并解析 RSS / Atom 源

    解析逻辑：
      - RSS 2.0  -> <channel>/<item>
      - Atom 1.0 -> <entry>
    """
    import httpx
    import xml.etree.ElementTree as ET

    start_time = time.time()

    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        if request_config:
            headers.update(request_config.get("headers", {}))
            proxy = request_config.get("proxy")
        else:
            proxy = None

        async with httpx.AsyncClient(
            timeout=15.0, proxy=proxy, follow_redirects=True
        ) as client:
            resp = await client.get(url, headers=headers, follow_redirects=True)

        elapsed = int(time.time() - start_time)

        if resp.status_code >= 400:
            return {
                "success": False,
                "html": "",
                "markdown": resp.text[:500],
                "cleaned_html": "",
                "items": [],
                "links": [],
                "error": f"HTTP {resp.status_code}",
                "duration_seconds": elapsed,
            }

        raw_content = resp.text
        items = []

        try:
            root = ET.fromstring(raw_content)
            # RSS 2.0
            if root.tag == "rss" or root.tag.endswith("rss"):
                channel = root.find("channel")
                if channel is not None:
                    for item in channel.findall("item"):
                        title = item.findtext("title", "")
                        link = item.findtext("link", "")
                        desc = item.findtext("description", "")
                        pub = item.findtext("pubDate", "") or item.findtext(
                            "pubdate", ""
                        )
                        author = item.findtext("author", "") or item.findtext(
                            "{http://purl.org/dc/elements/1.1/}creator", ""
                        )
                        content = (
                            item.findtext(
                                "{http://purl.org/rss/1.0/modules/content/}encoded", ""
                            )
                            or desc
                        )
                        items.append(
                            {
                                "title": title.strip() if title else "",
                                "content": content.strip() if content else desc,
                                "author": author.strip() if author else "",
                                "publish_at": pub.strip() if pub else "",
                                "source_url": link.strip() if link else "",
                            }
                        )
            # Atom 1.0
            elif root.tag.endswith("feed") or "Atom" in raw_content[:500]:
                ns = {"atom": "http://www.w3.org/2005/Atom"}
                for entry in root.findall("atom:entry", ns) or root.findall("entry"):
                    title = entry.findtext("atom:title", "", ns) or entry.findtext(
                        "title", ""
                    )
                    link_el = entry.find("atom:link", ns) or entry.find("link")
                    link = link_el.get("href", "") if link_el is not None else ""
                    content = (
                        entry.findtext("atom:content", "", ns)
                        or entry.findtext("atom:summary", "", ns)
                        or entry.findtext("content", "")
                        or entry.findtext("summary", "")
                    )
                    pub = (
                        entry.findtext("atom:published", "", ns)
                        or entry.findtext("atom:updated", "", ns)
                        or entry.findtext("published", "")
                        or entry.findtext("updated", "")
                    )
                    author_el = entry.find("atom:author", ns) or entry.find("author")
                    author = (
                        author_el.findtext("atom:name", "", ns)
                        if author_el is not None
                        else entry.findtext("author", "")
                    )
                    items.append(
                        {
                            "title": title.strip() if title else "",
                            "content": content.strip() if content else "",
                            "author": author.strip() if author else "",
                            "publish_at": pub.strip() if pub else "",
                            "source_url": link.strip() if link else "",
                        }
                    )
        except ET.ParseError as e:
            logger.warning(f"RSS XML 解析失败，回退到原始文本: {e}")
            items = [
                {
                    "title": "",
                    "content": raw_content[:5000],
                    "author": "",
                    "publish_at": "",
                    "source_url": url,
                }
            ]

        return {
            "success": True,
            "html": raw_content,
            "markdown": raw_content,
            "cleaned_html": "",
            "items": items,
            "links": [],
            "raw_content": raw_content,
            "raw_content_type": "rss",
            "error": None,
            "duration_seconds": elapsed,
        }

    except Exception as e:
        elapsed = int(time.time() - start_time)
        logger.error(f"RSS 采集异常: url={url}, error={str(e)}")
        return {
            "success": False,
            "html": "",
            "markdown": "",
            "cleaned_html": "",
            "items": [],
            "links": [],
            "error": str(e),
            "duration_seconds": elapsed,
        }


async def crawl_api(
    url: str, request_config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    采集 API 接口数据

    Args:
        url: API 地址
        request_config: {headers, params, auth_type, auth_token, method}
    """
    import httpx

    start_time = time.time()

    try:
        method = (request_config or {}).get("method", "GET").upper()
        headers = (request_config or {}).get("headers", {})
        params = (request_config or {}).get("params", {})

        # 处理认证
        auth_config = (request_config or {}).get("auth", {})
        if auth_config:
            auth_type = auth_config.get("type", "bearer")
            auth_token = auth_config.get("token", "")
            if auth_type == "bearer" and auth_token:
                headers["Authorization"] = f"Bearer {auth_token}"
            elif auth_type == "basic":
                import base64

                username = auth_config.get("username", "")
                password = auth_config.get("password", "")
                credentials = base64.b64encode(
                    f"{username}:{password}".encode()
                ).decode()
                headers["Authorization"] = f"Basic {credentials}"
            elif auth_type == "api_key":
                key_name = auth_config.get("key_name", "X-API-Key")
                headers[key_name] = auth_token

        async with httpx.AsyncClient(timeout=30.0) as client:
            if method == "GET":
                resp = await client.get(url, headers=headers, params=params)
            elif method == "POST":
                body = (request_config or {}).get("body", {})
                resp = await client.post(url, headers=headers, params=params, json=body)
            else:
                resp = await client.request(method, url, headers=headers, params=params)

        elapsed = int(time.time() - start_time)

        if resp.status_code >= 400:
            return {
                "success": False,
                "html": "",
                "markdown": "",
                "cleaned_html": "",
                "items": [],
                "links": [],
                "error": f"HTTP {resp.status_code}: {resp.text[:500]}",
                "duration_seconds": elapsed,
            }

        # 尝试解析 JSON 响应
        items = []
        raw_content = resp.text
        raw_content_type = "text"

        try:
            json_data = resp.json()
            raw_content_type = "json"
            raw_content = json.dumps(json_data, ensure_ascii=False)

            # 如果是列表，直接作为 items
            if isinstance(json_data, list):
                items = json_data
            elif isinstance(json_data, dict):
                # 尝试从常见字段中提取列表数据
                for key in ("data", "items", "results", "list", "records"):
                    if key in json_data and isinstance(json_data[key], list):
                        items = json_data[key]
                        break
                if not items:
                    items = [json_data]
        except Exception:
            pass

        return {
            "success": True,
            "html": "",
            "markdown": raw_content,
            "cleaned_html": "",
            "items": items,
            "links": [],
            "raw_content": raw_content,
            "raw_content_type": raw_content_type,
            "error": None,
            "duration_seconds": elapsed,
        }

    except Exception as e:
        elapsed = int(time.time() - start_time)
        logger.error(f"API 采集异常: url={url}, error={str(e)}")
        return {
            "success": False,
            "html": "",
            "markdown": "",
            "cleaned_html": "",
            "items": [],
            "links": [],
            "error": str(e),
            "duration_seconds": elapsed,
        }


def generate_content_hash(content: str) -> str:
    """生成内容 Hash 用于去重"""
    return hashlib.md5(content.encode()).hexdigest()
