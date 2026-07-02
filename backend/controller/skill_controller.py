"""技能管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.skill import (
    SkillCreate, SkillUpdate, SkillResponse, SkillListResponse,
    SkillTestRequest, SkillTestResponse, SkillCallLogResponse, SkillCallLogListResponse
)
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext
from service.skill_service import (
    get_skills_service, get_skill_detail_service, create_skill_service,
    update_skill_service, delete_skill_service, approve_skill_service, reject_skill_service,
    enable_skill_service, disable_skill_service, test_skill_service,
    get_skill_call_logs_service, get_public_skills_service
)


skill_router = APIRouter(prefix="/skills", tags=["技能管理 Skill"])


@skill_router.get("", summary="获取技能列表")
def list_skills(
    skill_type: str = None,
    visibility: str = None,
    review_status: str = None,
    keyword: str = None,
    include_public: bool = False,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取技能列表"""
    result = get_skills_service(
        db, ctx, skill_type, visibility, review_status,
        keyword, include_public, page, page_size
    )
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@skill_router.get("/public", summary="获取公开技能列表")
def list_public_skills(
    keyword: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    """获取公开技能列表（技能市场）"""
    result = get_public_skills_service(db, keyword, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@skill_router.get("/{skill_id}", summary="获取技能详情")
def get_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取技能详情"""
    result = get_skill_detail_service(db, ctx, skill_id)
    return ApiResponse.success(data=result)


@skill_router.post("", summary="创建技能")
def create_skill(
    data: SkillCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """创建技能"""
    result = create_skill_service(
        db, ctx, data.name, data.type,
        description=data.description,
        config=data.config,
        input_schema=data.input_schema,
        output_schema=data.output_schema,
        visibility=data.visibility,
        model_id=data.model_id,
        status=data.status
    )
    return ApiResponse.success(data=result)


@skill_router.put("/{skill_id}", summary="更新技能")
def update_skill(
    skill_id: int,
    data: SkillUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新技能"""
    result = update_skill_service(db, ctx, skill_id, **data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@skill_router.delete("/{skill_id}", summary="删除技能")
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除技能"""
    delete_skill_service(db, ctx, skill_id)
    return ApiResponse.success(message="技能已删除")


@skill_router.post("/{skill_id}/enable", summary="启用技能")
def enable_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """启用技能"""
    enable_skill_service(db, ctx, skill_id)
    return ApiResponse.success(message="技能已启用")


@skill_router.post("/{skill_id}/disable", summary="停用技能")
def disable_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """停用技能"""
    disable_skill_service(db, ctx, skill_id)
    return ApiResponse.success(message="技能已停用")


@skill_router.post("/{skill_id}/test", summary="测试技能")
def test_skill(
    skill_id: int,
    data: SkillTestRequest = None,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """测试技能"""
    input_data = data.input_data if data else {}
    result = test_skill_service(db, ctx, skill_id, input_data)
    return ApiResponse.success(data=result)


@skill_router.get("/{skill_id}/logs", summary="获取技能调用记录")
def get_skill_logs(
    skill_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取技能调用记录"""
    result = get_skill_call_logs_service(db, ctx, skill_id, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@skill_router.post("/{skill_id}/approve", summary="审核通过技能")
def approve_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_permission("skill:approve")
):
    """审核通过技能"""
    approve_skill_service(db, ctx, skill_id)
    return ApiResponse.success(message="技能已审核通过")


@skill_router.post("/{skill_id}/reject", summary="拒绝技能审核")
def reject_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = require_permission("skill:approve")
):
    """拒绝技能审核"""
    reject_skill_service(db, ctx, skill_id)
    return ApiResponse.success(message="技能审核已拒绝")
