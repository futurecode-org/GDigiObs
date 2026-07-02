"""技能业务逻辑层"""
import json
import logging
import subprocess
import sys
import tempfile
import os
import time
from typing import List, Dict, Optional, Any
from sqlalchemy.orm import Session

from dao.skill_dao import (
    get_skills, count_skills, get_skill_by_id, create_skill,
    update_skill, update_skill_status, delete_skill, approve_skill, reject_skill,
    get_public_skills, count_public_skills
)
from dao.skill_call_log_dao import create_call_log, get_call_logs, count_call_logs
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def _can_manage_skill(skill, ctx: RequestContext) -> bool:
    """判断当前用户是否有权管理该技能"""
    if ctx.is_super_admin:
        return True
    if skill.tenant_id != ctx.tenant_id:
        return False
    # 租户管理员可以管理租户内所有技能
    if ctx.is_tenant_admin:
        return True
    # 普通用户只能管理自己创建的技能
    return skill.owner_id == ctx.user_id


def _can_view_skill(skill, ctx: RequestContext) -> bool:
    """判断当前用户是否有权查看该技能"""
    if ctx.is_super_admin:
        return True
    if skill.tenant_id == ctx.tenant_id:
        return True
    if skill.visibility == "public" and skill.review_status == "approved" and skill.status == "enabled":
        return True
    return False


def _serialize_skill(skill) -> Dict[str, Any]:
    """序列化技能对象"""
    return {
        "id": skill.id,
        "tenant_id": skill.tenant_id,
        "owner_id": skill.owner_id,
        "name": skill.name,
        "type": skill.type,
        "description": skill.description,
        "config": skill.config,
        "input_schema": skill.input_schema,
        "output_schema": skill.output_schema,
        "visibility": skill.visibility,
        "review_status": skill.review_status,
        "status": skill.status,
        "model_id": skill.model_id,
        "created_at": skill.created_at,
        "updated_at": skill.updated_at
    }


def get_skills_service(db: Session, ctx: RequestContext, skill_type: str = None,
                       visibility: str = None, review_status: str = None,
                       keyword: str = None, include_public: bool = False,
                       page: int = 1, page_size: int = 20) -> Dict:
    """获取技能列表"""
    # 超级管理员可查看全平台技能，不强制按租户过滤
    tenant_id = None if ctx.is_super_admin else ctx.tenant_id
    
    skills = get_skills(
        db, tenant_id, skill_type, visibility, review_status,
        keyword, page, page_size, include_public
    )
    total = count_skills(
        db, tenant_id, skill_type, visibility, review_status,
        keyword, include_public
    )
    
    return {
        "items": [_serialize_skill(skill) for skill in skills],
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_skill_detail_service(db: Session, ctx: RequestContext, skill_id: int) -> Dict:
    """获取技能详情"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    if not _can_view_skill(skill, ctx):
        raise ForbiddenException("无权访问此技能")
    
    return _serialize_skill(skill)


def create_skill_service(db: Session, ctx: RequestContext, name: str, skill_type: str,
                         **kwargs) -> Dict:
    """创建技能"""
    # 普通用户创建时默认个人可见；租户管理员可创建租户/公开技能
    visibility = kwargs.get("visibility", "personal")
    if visibility in ("tenant", "public") and not (ctx.is_super_admin or ctx.is_tenant_admin):
        raise ForbiddenException("无权创建该可见范围的技能")
    
    skill = create_skill(db, ctx.tenant_id, ctx.user_id, name, skill_type, **kwargs)
    logger.info(f"创建技能: skill_id={skill.id}, name={name}")
    return _serialize_skill(skill)


def update_skill_service(db: Session, ctx: RequestContext, skill_id: int, **kwargs) -> Dict:
    """更新技能"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    if not _can_manage_skill(skill, ctx):
        raise ForbiddenException("无权修改此技能")
    
    # 普通用户不能修改可见范围为租户/公开
    visibility = kwargs.get("visibility")
    if visibility in ("tenant", "public") and not (ctx.is_super_admin or ctx.is_tenant_admin):
        raise ForbiddenException("无权设置该可见范围")
    
    skill = update_skill(db, skill_id, **kwargs)
    return {
        "id": skill.id,
        "name": skill.name,
        "updated_at": skill.updated_at
    }


def delete_skill_service(db: Session, ctx: RequestContext, skill_id: int):
    """删除技能"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    if not _can_manage_skill(skill, ctx):
        raise ForbiddenException("无权删除此技能")
    
    delete_skill(db, skill_id)
    logger.info(f"删除技能: skill_id={skill_id}")


def enable_skill_service(db: Session, ctx: RequestContext, skill_id: int):
    """启用技能"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    if not _can_manage_skill(skill, ctx):
        raise ForbiddenException("无权启用此技能")
    
    update_skill_status(db, skill_id, "enabled")
    logger.info(f"启用技能: skill_id={skill_id}")


def disable_skill_service(db: Session, ctx: RequestContext, skill_id: int):
    """停用技能"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    if not _can_manage_skill(skill, ctx):
        raise ForbiddenException("无权停用此技能")
    
    update_skill_status(db, skill_id, "disabled")
    logger.info(f"停用技能: skill_id={skill_id}")


def approve_skill_service(db: Session, ctx: RequestContext, skill_id: int):
    """审核通过技能"""
    if not ctx.is_super_admin:
        raise ForbiddenException("只有管理员可以审核技能")
    
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    approve_skill(db, skill_id)
    logger.info(f"审核通过技能: skill_id={skill_id}")


def reject_skill_service(db: Session, ctx: RequestContext, skill_id: int):
    """拒绝技能审核"""
    if not ctx.is_super_admin:
        raise ForbiddenException("只有管理员可以审核技能")
    
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    reject_skill(db, skill_id)
    logger.info(f"拒绝技能审核: skill_id={skill_id}")


def _validate_mcp_config(config: Optional[Dict[str, Any]]) -> None:
    """校验 MCP 配置"""
    if not config:
        raise BadRequestException("MCP 配置不能为空")
    command = config.get("command")
    if not command:
        raise BadRequestException("MCP 配置缺少 command")
    startup_method = config.get("startup_method")
    if startup_method and startup_method not in ("npx", "uvx"):
        raise BadRequestException("MCP 启动方式仅支持 NPX 或 UVX")


def _validate_skill_config(skill_type: str, config: Optional[Dict[str, Any]],
                           input_schema: Optional[Dict[str, Any]],
                           output_schema: Optional[Dict[str, Any]]) -> None:
    """校验 Skill 配置"""
    if skill_type == "mcp":
        _validate_mcp_config(config)
    elif skill_type == "skill":
        if not config:
            raise BadRequestException("Skill 配置不能为空")
        import_method = config.get("import_method")
        if import_method and import_method not in ("npx", "markdown"):
            raise BadRequestException("Skill 导入方式仅支持 NPX 安装或 Markdown 导入")
    elif skill_type == "function_call":
        if not config:
            raise BadRequestException("Function Call 配置不能为空")
        runtime_language = config.get("runtime_language")
        if runtime_language and runtime_language not in ("python", "javascript"):
            raise BadRequestException("运行语言当前仅支持 Python 或 JavaScript")
        if not config.get("code_content"):
            raise BadRequestException("Function Call 代码内容不能为空")
        try:
            if input_schema:
                json.dumps(input_schema)
            if output_schema:
                json.dumps(output_schema)
        except (TypeError, ValueError) as e:
            raise BadRequestException(f"Schema 格式错误: {str(e)}")


def _run_function_call(code: str, language: str, input_data: Dict[str, Any],
                       timeout: int = 30) -> Dict[str, Any]:
    """在受限子进程中执行 Function Call 代码"""
    if language == "python":
        runner_code = f"""
import json, sys
input_data = json.loads(sys.argv[1])
{code}
"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
            f.write(runner_code)
            temp_path = f.name
        try:
            start = time.time()
            result = subprocess.run(
                [sys.executable, temp_path, json.dumps(input_data)],
                capture_output=True, text=True, timeout=timeout
            )
            duration_ms = int((time.time() - start) * 1000)
            if result.returncode != 0:
                return {"success": False, "message": result.stderr.strip() or "执行失败", "duration_ms": duration_ms}
            try:
                output = json.loads(result.stdout.strip())
            except json.JSONDecodeError:
                output = result.stdout.strip()
            return {"success": True, "output": output, "duration_ms": duration_ms}
        except subprocess.TimeoutExpired:
            return {"success": False, "message": f"执行超时（超过 {timeout} 秒）", "duration_ms": timeout * 1000}
        except Exception as e:
            return {"success": False, "message": f"执行异常: {str(e)}", "duration_ms": None}
        finally:
            try:
                os.unlink(temp_path)
            except Exception:
                pass
    elif language == "javascript":
        runner_code = f"""
const inputData = JSON.parse(process.argv[2]);
{code}
"""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".js", delete=False) as f:
            f.write(runner_code)
            temp_path = f.name
        try:
            start = time.time()
            result = subprocess.run(
                ["node", temp_path, json.dumps(input_data)],
                capture_output=True, text=True, timeout=timeout
            )
            duration_ms = int((time.time() - start) * 1000)
            if result.returncode != 0:
                return {"success": False, "message": result.stderr.strip() or "执行失败", "duration_ms": duration_ms}
            try:
                output = json.loads(result.stdout.strip())
            except json.JSONDecodeError:
                output = result.stdout.strip()
            return {"success": True, "output": output, "duration_ms": duration_ms}
        except subprocess.TimeoutExpired:
            return {"success": False, "message": f"执行超时（超过 {timeout} 秒）", "duration_ms": timeout * 1000}
        except Exception as e:
            return {"success": False, "message": f"执行异常: {str(e)}", "duration_ms": None}
        finally:
            try:
                os.unlink(temp_path)
            except Exception:
                pass
    else:
        return {"success": False, "message": f"不支持的运行语言: {language}"}


def test_skill_service(db: Session, ctx: RequestContext, skill_id: int,
                       input_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """测试技能"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    if not _can_view_skill(skill, ctx):
        raise ForbiddenException("无权测试此技能")
    
    input_data = input_data or {}
    config = skill.config or {}
    
    try:
        _validate_skill_config(skill.type, config, skill.input_schema, skill.output_schema)
    except BadRequestException as e:
        create_call_log(
            db, skill.id, ctx.tenant_id, ctx.user_id, "test",
            input_data, None, "failed", None, str(e.message)
        )
        return {"success": False, "message": str(e.message)}
    
    if skill.type == "function_call":
        language = config.get("runtime_language", "python")
        code = config.get("code_content", "")
        timeout = config.get("timeout", 30)
        try:
            timeout = int(timeout)
        except (TypeError, ValueError):
            timeout = 30
        result = _run_function_call(code, language, input_data, timeout)
    elif skill.type == "mcp":
        result = {
            "success": True,
            "output": {"tools": config.get("tools", []), "message": "MCP 配置校验通过"},
            "message": "MCP 测试仅校验配置，不实际启动服务"
        }
    elif skill.type == "skill":
        result = {
            "success": True,
            "output": {"entry": config.get("entry_description", ""), "message": "Skill 配置校验通过"},
            "message": "Skill 测试仅校验配置，不实际执行"
        }
    else:
        result = {"success": False, "message": f"未知技能类型: {skill.type}"}
    
    # 记录调用日志
    create_call_log(
        db, skill.id, ctx.tenant_id, ctx.user_id, "test",
        input_data,
        {"output": result.get("output")} if result.get("success") else None,
        "success" if result.get("success") else "failed",
        result.get("duration_ms"),
        result.get("message") if not result.get("success") else None
    )
    
    return result


def get_skill_call_logs_service(db: Session, ctx: RequestContext, skill_id: int,
                                page: int = 1, page_size: int = 20) -> Dict:
    """获取技能调用记录"""
    skill = get_skill_by_id(db, skill_id)
    if not skill:
        raise NotFoundException("技能不存在")
    
    if not _can_view_skill(skill, ctx):
        raise ForbiddenException("无权查看此技能的调用记录")
    
    logs = get_call_logs(db, skill_id, page, page_size)
    total = count_call_logs(db, skill_id)
    
    return {
        "items": [{
            "id": log.id,
            "skill_id": log.skill_id,
            "tenant_id": log.tenant_id,
            "caller_id": log.caller_id,
            "source": log.source,
            "input_data": log.input_data,
            "output_data": log.output_data,
            "status": log.status,
            "duration_ms": log.duration_ms,
            "error_message": log.error_message,
            "created_at": log.created_at
        } for log in logs],
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_public_skills_service(db: Session, keyword: str = None,
                              page: int = 1, page_size: int = 20) -> Dict:
    """获取公开技能列表（技能市场）"""
    skills = get_public_skills(db, page, page_size, keyword)
    total = count_public_skills(db, keyword)
    return {
        "items": [_serialize_skill(skill) for skill in skills],
        "total": total,
        "page": page,
        "page_size": page_size
    }
