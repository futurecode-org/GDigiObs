"""技能管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.skill import SkillCreate, SkillUpdate, SkillResponse, SkillListResponse
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context
from service.skill_service import (
    get_skills_service, get_skill_detail_service, create_skill_service,
    update_skill_service, delete_skill_service, approve_skill_service, reject_skill_service
)

from model.user import User


skill_router = APIRouter(prefix="/skills", tags=["技能管理 Skill"])


@skill_router.get("", summary="获取技能列表")
def list_skills(
    skill_type: str = None,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取技能列表"""
    ctx = get_request_context(current_user)
    result = get_skills_service(db, ctx, skill_type, page, page_size)
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
    current_user: User = Depends(get_current_user)
):
    """获取技能详情"""
    ctx = get_request_context(current_user)
    result = get_skill_detail_service(db, ctx, skill_id)
    return ApiResponse.success(data=result)


@skill_router.post("", summary="创建技能")
def create_skill(
    data: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """创建技能"""
    ctx = get_request_context(current_user)
    result = create_skill_service(
        db, ctx, data.name, data.type,
        description=data.description,
        config=data.config,
        input_schema=data.input_schema,
        output_schema=data.output_schema,
        visibility=data.visibility
    )
    return ApiResponse.success(data=result)


@skill_router.put("/{skill_id}", summary="更新技能")
def update_skill(
    skill_id: int,
    data: SkillUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """更新技能"""
    ctx = get_request_context(current_user)
    result = update_skill_service(db, ctx, skill_id, **data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@skill_router.delete("/{skill_id}", summary="删除技能")
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """删除技能"""
    ctx = get_request_context(current_user)
    delete_skill_service(db, ctx, skill_id)
    return ApiResponse.success(message="技能已删除")


@skill_router.post("/{skill_id}/approve", summary="审核通过技能")
def approve_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    ctx = require_permission("skill:approve")
):
    """审核通过技能"""
    approve_skill_service(db, ctx, skill_id)
    return ApiResponse.success(message="技能已审核通过")


@skill_router.post("/{skill_id}/reject", summary="拒绝技能审核")
def reject_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    ctx = require_permission("skill:approve")
):
    """拒绝技能审核"""
    reject_skill_service(db, ctx, skill_id)
    return ApiResponse.success(message="技能审核已拒绝")