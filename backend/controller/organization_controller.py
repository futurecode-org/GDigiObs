"""组织架构控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from database.session import get_db
from core.response import ApiResponse
from core.dependencies import get_request_context, RequestContext, require_admin
from service.organization_service import (
    create_organization, get_organization_list, get_organization_detail, 
    update_organization, delete_organization,
    create_department, get_department_list, get_department_tree, 
    get_department_detail, update_department, delete_department,
    create_position, get_position_list, get_position_detail, 
    update_position, delete_position,
    assign_user_to_organization, get_user_organizations, remove_user_from_organization,
    get_department_members
)

org_router = APIRouter(prefix="/organizations", tags=["组织架构 Organization"])


# ============== 组织管理 ==============

@org_router.post("", summary="创建组织")
def create_org(
    name: str,
    code: Optional[str] = None,
    parent_id: Optional[int] = None,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """创建组织（公司）"""
    org = create_organization(db, name, code, parent_id, description, ctx)
    return ApiResponse.success(data={
        "id": org.id,
        "name": org.name,
        "code": org.code,
        "parent_id": org.parent_id,
        "description": org.description
    })


@org_router.get("", summary="组织列表")
def list_orgs(
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取组织列表"""
    orgs = get_organization_list(db, ctx)
    return ApiResponse.success(data=[{
        "id": o.id,
        "name": o.name,
        "code": o.code,
        "parent_id": o.parent_id,
        "description": o.description,
        "status": o.status
    } for o in orgs])


@org_router.get("/{org_id}", summary="组织详情")
def get_org(
    org_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取组织详情"""
    org = get_organization_detail(db, org_id, ctx)
    return ApiResponse.success(data={
        "id": org.id,
        "name": org.name,
        "code": org.code,
        "parent_id": org.parent_id,
        "description": org.description,
        "status": org.status,
        "created_at": org.created_at
    })


@org_router.put("/{org_id}", summary="更新组织")
def update_org(
    org_id: int,
    data: dict,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新组织信息"""
    org = update_organization(db, org_id, data, ctx)
    return ApiResponse.success(data={
        "id": org.id,
        "name": org.name,
        "code": org.code,
        "description": org.description
    })


@org_router.delete("/{org_id}", summary="删除组织")
def delete_org(
    org_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除组织"""
    delete_organization(db, org_id, ctx)
    return ApiResponse.success(message="组织已删除")


# ============== 部门管理 ==============

@org_router.post("/{org_id}/departments", summary="创建部门")
def create_dept(
    org_id: int,
    name: str,
    code: Optional[str] = None,
    parent_id: Optional[int] = None,
    manager_user_id: Optional[int] = None,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """创建部门"""
    dept = create_department(db, org_id, name, code, parent_id, manager_user_id, description, ctx)
    return ApiResponse.success(data={
        "id": dept.id,
        "name": dept.name,
        "code": dept.code,
        "parent_id": dept.parent_id,
        "manager_user_id": dept.manager_user_id,
        "description": dept.description
    })


@org_router.get("/{org_id}/departments", summary="部门列表")
def list_depts(
    org_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取部门列表（树形）"""
    tree = get_department_tree(db, org_id, ctx)
    return ApiResponse.success(data=tree)


@org_router.get("/departments/{dept_id}", summary="部门详情")
def get_dept(
    dept_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取部门详情"""
    dept = get_department_detail(db, dept_id, ctx)
    return ApiResponse.success(data={
        "id": dept.id,
        "name": dept.name,
        "code": dept.code,
        "parent_id": dept.parent_id,
        "manager_user_id": dept.manager_user_id,
        "description": dept.description,
        "sort_order": dept.sort_order
    })


@org_router.put("/departments/{dept_id}", summary="更新部门")
def update_dept(
    dept_id: int,
    data: dict,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新部门信息"""
    dept = update_department(db, dept_id, data, ctx)
    return ApiResponse.success(data={
        "id": dept.id,
        "name": dept.name,
        "code": dept.code,
        "parent_id": dept.parent_id
    })


@org_router.delete("/departments/{dept_id}", summary="删除部门")
def delete_dept(
    dept_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除部门"""
    delete_department(db, dept_id, ctx)
    return ApiResponse.success(message="部门已删除")


@org_router.get("/departments/{dept_id}/members", summary="部门成员")
def list_dept_members(
    dept_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取部门成员列表"""
    members = get_department_members(db, dept_id, ctx)
    return ApiResponse.success(data=members)


# ============== 岗位管理 ==============

@org_router.post("/departments/{dept_id}/positions", summary="创建岗位")
def create_pos(
    dept_id: int,
    name: str,
    code: Optional[str] = None,
    description: Optional[str] = None,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """创建岗位"""
    position = create_position(db, dept_id, name, code, description, ctx)
    return ApiResponse.success(data={
        "id": position.id,
        "name": position.name,
        "code": position.code,
        "description": position.description
    })


@org_router.get("/departments/{dept_id}/positions", summary="岗位列表")
def list_positions(
    dept_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取岗位列表"""
    positions = get_position_list(db, dept_id, ctx)
    return ApiResponse.success(data=[{
        "id": p.id,
        "name": p.name,
        "code": p.code,
        "description": p.description
    } for p in positions])


@org_router.put("/positions/{position_id}", summary="更新岗位")
def update_pos(
    position_id: int,
    data: dict,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """更新岗位信息"""
    position = update_position(db, position_id, data, ctx)
    return ApiResponse.success(data={
        "id": position.id,
        "name": position.name,
        "code": position.code
    })


@org_router.delete("/positions/{position_id}", summary="删除岗位")
def delete_pos(
    position_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """删除岗位"""
    delete_position(db, position_id, ctx)
    return ApiResponse.success(message="岗位已删除")


# ============== 成员分配 ==============

@org_router.post("/assign-user", summary="分配用户到组织")
def assign_user(
    user_id: int,
    org_id: int,
    dept_id: Optional[int] = None,
    position_id: Optional[int] = None,
    is_primary: bool = False,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """分配用户到组织/部门/岗位"""
    uo = assign_user_to_organization(db, user_id, org_id, dept_id, position_id, is_primary, ctx)
    return ApiResponse.success(data={
        "id": uo.id,
        "user_id": uo.user_id,
        "organization_id": uo.organization_id,
        "department_id": uo.department_id,
        "position_id": uo.position_id,
        "is_primary": uo.is_primary
    })


@org_router.get("/users/{user_id}/organizations", summary="用户组织关联")
def get_user_orgs(
    user_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """获取用户的组织关联"""
    uos = get_user_organizations(db, user_id, ctx)
    return ApiResponse.success(data=[{
        "id": uo.id,
        "organization_id": uo.organization_id,
        "department_id": uo.department_id,
        "position_id": uo.position_id,
        "is_primary": uo.is_primary,
        "status": uo.status
    } for uo in uos])


@org_router.delete("/user-organizations/{uo_id}", summary="移除用户组织关联")
def remove_user_org(
    uo_id: int,
    db: Session = Depends(get_db),
    ctx: RequestContext = Depends(get_request_context)
):
    """移除用户的组织关联"""
    remove_user_from_organization(db, uo_id, ctx)
    return ApiResponse.success(message="关联已移除")
