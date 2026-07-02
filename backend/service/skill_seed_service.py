"""技能示例数据初始化"""
import logging
from sqlalchemy.orm import Session

from model.skill import Skill
from model.user import User
from dao.skill_dao import get_skills, create_skill
from dao.user_dao import get_user_by_username
from core.config import settings

logger = logging.getLogger(__name__)


SAMPLE_SKILLS = [
    {
        "name": "加法计算器",
        "type": "function_call",
        "description": "接收两个数字并返回它们的和",
        "input_schema": {
            "type": "object",
            "properties": {
                "a": {"type": "number", "description": "第一个加数"},
                "b": {"type": "number", "description": "第二个加数"}
            },
            "required": ["a", "b"]
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "result": {"type": "number"}
            }
        },
        "config": {
            "runtime_language": "python",
            "code_content": "result = {'result': input_data['a'] + input_data['b']}\nprint(result)",
            "timeout": 10
        },
        "visibility": "public",
        "review_status": "approved",
        "status": "enabled"
    },
    {
        "name": "字符串反转",
        "type": "function_call",
        "description": "将输入字符串反转后返回",
        "input_schema": {
            "type": "object",
            "properties": {
                "text": {"type": "string", "description": "待反转的字符串"}
            },
            "required": ["text"]
        },
        "output_schema": {
            "type": "object",
            "properties": {
                "reversed": {"type": "string"}
            }
        },
        "config": {
            "runtime_language": "python",
            "code_content": "result = {'reversed': input_data['text'][::-1]}\nprint(result)",
            "timeout": 10
        },
        "visibility": "tenant",
        "review_status": "approved",
        "status": "enabled"
    },
    {
        "name": "文件服务器 MCP",
        "type": "mcp",
        "description": "示例 MCP 服务，提供文件读取与列表工具",
        "config": {
            "import_method": "json",
            "startup_method": "npx",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"],
            "env": {},
            "tools": [
                {"name": "read_file", "description": "读取文件内容"},
                {"name": "list_directory", "description": "列出目录内容"}
            ]
        },
        "visibility": "tenant",
        "review_status": "approved",
        "status": "enabled"
    },
    {
        "name": "SQLite MCP",
        "type": "mcp",
        "description": "通过 MCP 连接 SQLite 数据库并执行查询",
        "config": {
            "import_method": "json",
            "startup_method": "npx",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-sqlite", "/tmp/sample.db"],
            "env": {},
            "tools": [
                {"name": "query", "description": "执行 SQL 查询"}
            ]
        },
        "visibility": "public",
        "review_status": "approved",
        "status": "enabled"
    },
    {
        "name": "Python 代码规范助手",
        "type": "skill",
        "description": "检查 Python 代码是否符合 PEP8 规范",
        "config": {
            "import_method": "npx",
            "entry_description": "调用方式：npx python-lint-agent --code '<python_code>'"
        },
        "visibility": "personal",
        "review_status": "draft",
        "status": "enabled"
    },
    {
        "name": "Markdown 文档生成器",
        "type": "skill",
        "description": "根据输入主题生成 Markdown 格式文档",
        "config": {
            "import_method": "markdown",
            "entry_description": "读取 docs/markdown-generator.md 中的提示词模板，调用大模型生成文档"
        },
        "visibility": "public",
        "review_status": "approved",
        "status": "enabled"
    }
]


def init_sample_skills(db: Session) -> int:
    """初始化示例技能数据
    
    Returns:
        创建的示例技能数量
    """
    # 查找默认超级管理员作为示例数据所有者
    default_admin_username = getattr(settings, "INITIAL_SUPER_ADMIN_USERNAME", "admin")
    admin = get_user_by_username(db, default_admin_username)
    if not admin:
        logger.warning("默认超级管理员不存在，跳过示例技能初始化")
        return 0
    
    tenant_id = admin.tenant_id
    if not tenant_id:
        logger.warning("超级管理员未绑定租户，跳过示例技能初始化")
        return 0
    
    # 若当前租户已存在技能，则不再重复创建
    existing = get_skills(db, tenant_id=tenant_id, page=1, page_size=1)
    if existing:
        logger.info("当前租户已存在技能，跳过示例技能初始化")
        return 0
    
    created_count = 0
    for sample in SAMPLE_SKILLS:
        try:
            create_skill(
                db,
                tenant_id=tenant_id,
                owner_id=admin.id,
                name=sample["name"],
                skill_type=sample["type"],
                description=sample.get("description"),
                config=sample.get("config"),
                input_schema=sample.get("input_schema"),
                output_schema=sample.get("output_schema"),
                visibility=sample.get("visibility", "personal"),
                review_status=sample.get("review_status", "draft"),
                status=sample.get("status", "enabled")
            )
            created_count += 1
            logger.info(f"创建示例技能: {sample['name']}")
        except Exception as e:
            logger.error(f"创建示例技能失败 {sample['name']}: {e}")
    
    logger.info(f"示例技能初始化完成，共创建 {created_count} 个")
    return created_count
