"""数字员工管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.session import get_db
from schema.agent import (
    AgentCreate, AgentUpdate, AgentResponse, AgentRunResponse,
    AgentRunCreate, AgentListResponse
)
from core.response import ApiResponse, PaginatedResponse, PaginatedData
from core.dependencies import get_current_user, require_permission, get_request_context, RequestContext, RequestContext
from service.agent_service import (
    get_agents_service, get_agent_detail_service, create_agent_service,
    update_agent_service, delete_agent_service, run_agent_service,
    get_agent_runs_service, get_agent_run_detail_service
)

from model.user import User


agent_router = APIRouter(prefix="/agents", tags=["数字员工 Agent"])


@agent_router.get("", summary="获取数字员工列表")
def list_agents(
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取数字员工列表"""
    result = get_agents_service(db, ctx, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@agent_router.get("/{agent_id}", summary="获取数字员工详情")
def get_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取数字员工详情"""
    result = get_agent_detail_service(db, ctx, agent_id)
    return ApiResponse.success(data=result)


@agent_router.post("", summary="创建数字员工")
def create_agent(
    data: AgentCreate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """创建数字员工"""
    result = create_agent_service(
        db, ctx, data.name,
        avatar_file_id=data.avatar_file_id,
        role_description=data.role_description,
        system_prompt=data.system_prompt,
        model_id=data.model_id,
        skill_ids=data.skill_ids,
        knowledge_base_ids=data.knowledge_base_ids,
        workflow_ids=data.workflow_ids,
        trigger_config=data.trigger_config,
        push_config=data.push_config,
        visibility=data.visibility
    )
    return ApiResponse.success(data=result)


@agent_router.put("/{agent_id}", summary="更新数字员工")
def update_agent(
    agent_id: int,
    data: AgentUpdate,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新数字员工"""
    result = update_agent_service(db, ctx, agent_id, **data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@agent_router.delete("/{agent_id}", summary="删除数字员工")
def delete_agent(
    agent_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除数字员工"""
    delete_agent_service(db, ctx, agent_id)
    return ApiResponse.success(message="数字员工已删除")


@agent_router.post("/{agent_id}/run", summary="执行数字员工")
def run_agent(
    agent_id: int,
    data: AgentRunCreate = None,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """执行数字员工"""
    input_data = data.input_data if data else None
    result = run_agent_service(db, ctx, agent_id, input_data)
    return ApiResponse.success(data=result)


@agent_router.get("/{agent_id}/runs", summary="获取执行记录列表")
def list_agent_runs(
    agent_id: int,
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取数字员工执行记录列表"""
    result = get_agent_runs_service(db, ctx, agent_id, page, page_size)
    paginated = PaginatedData(
        items=result["items"],
        total=result["total"],
        page=result["page"],
        page_size=result["page_size"]
    )
    return PaginatedResponse.success(data=paginated)


@agent_router.get("/runs/{run_id}", summary="获取执行记录详情")
def get_agent_run(
    run_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取执行记录详情"""
    result = get_agent_run_detail_service(db, ctx, run_id)
    return ApiResponse.success(data=result)