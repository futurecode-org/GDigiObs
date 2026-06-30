"""组织架构业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import Dict, List, Optional

from dao.rbac_dao import (
    get_role_by_code, assign_role_to_user, get_user_roles
)
from model.organization import Organization, Department, Position, UserOrganization
from model.user import User
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


# ============== 组织管理 ==============

def create_organization(db: Session, name: str, code: Optional[str], parent_id: Optional[int], 
                        description: Optional[str], ctx: RequestContext) -> Organization:
    """创建组织（公司）"""
    if not ctx.is_super_admin and ctx.tenant_id is None:
        raise ForbiddenException("需要租户权限")
    
    tenant_id = ctx.tenant_id
    
    org = Organization(
        tenant_id=tenant_id,
        name=name,
        code=code,
        parent_id=parent_id,
        description=description,
        status="enabled"
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    logger.info(f"创建组织: tenant_id={tenant_id}, name={name}")
    return org


def get_organization_list(db: Session, ctx: RequestContext) -> List[Organization]:
    """获取组织列表"""
    if ctx.is_super_admin:
        return db.query(Organization).filter(Organization.status == "enabled").all()
    return db.query(Organization).filter(
        Organization.tenant_id == ctx.tenant_id,
        Organization.status == "enabled"
    ).all()


def get_organization_detail(db: Session, org_id: int, ctx: RequestContext) -> Organization:
    """获取组织详情"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise NotFoundException("组织不存在")
    if not ctx.is_super_admin and org.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权查看该组织")
    return org


def update_organization(db: Session, org_id: int, data: dict, ctx: RequestContext) -> Organization:
    """更新组织信息"""
    org = get_organization_detail(db, org_id, ctx)
    
    if data.get("name"):
        org.name = data["name"]
    if data.get("code") is not None:
        org.code = data["code"]
    if data.get("parent_id") is not None:
        org.parent_id = data["parent_id"]
    if data.get("description") is not None:
        org.description = data["description"]
    if data.get("status"):
        org.status = data["status"]
    
    db.commit()
    db.refresh(org)
    return org


def delete_organization(db: Session, org_id: int, ctx: RequestContext):
    """删除组织（软删除）"""
    org = get_organization_detail(db, org_id, ctx)
    
    # 检查是否有下级部门
    departments = db.query(Department).filter(Department.organization_id == org_id, Department.status == "enabled").all()
    if departments:
        raise BadRequestException("组织下还有部门，无法删除")
    
    org.status = "deleted"
    db.commit()
    logger.info(f"删除组织: org_id={org_id}")


# ============== 部门管理 ==============

def create_department(db: Session, org_id: int, name: str, code: Optional[str], 
                      parent_id: Optional[int], manager_user_id: Optional[int], 
                      description: Optional[str], ctx: RequestContext) -> Department:
    """创建部门"""
    if not ctx.is_super_admin and ctx.tenant_id is None:
        raise ForbiddenException("需要租户权限")
    
    # 检查组织是否存在
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise NotFoundException("组织不存在")
    
    # 同级部门名称唯一
    existing = db.query(Department).filter(
        Department.organization_id == org_id,
        Department.parent_id == parent_id,
        Department.name == name,
        Department.status == "enabled"
    ).first()
    if existing:
        raise BadRequestException("同级部门名称已存在")
    
    dept = Department(
        tenant_id=ctx.tenant_id,
        organization_id=org_id,
        name=name,
        code=code,
        parent_id=parent_id,
        manager_user_id=manager_user_id,
        description=description,
        status="enabled"
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)
    logger.info(f"创建部门: org_id={org_id}, name={name}")
    return dept


def get_department_list(db: Session, org_id: Optional[int], ctx: RequestContext) -> List[Department]:
    """获取部门列表"""
    query = db.query(Department).filter(Department.status == "enabled")
    if not ctx.is_super_admin:
        query = query.filter(Department.tenant_id == ctx.tenant_id)
    if org_id:
        query = query.filter(Department.organization_id == org_id)
    return query.all()


def get_department_tree(db: Session, org_id: Optional[int], ctx: RequestContext) -> List[dict]:
    """获取部门树"""
    departments = get_department_list(db, org_id, ctx)
    
    dept_dicts = []
    for dept in departments:
        dept_dicts.append({
            "id": dept.id,
            "name": dept.name,
            "code": dept.code,
            "parent_id": dept.parent_id,
            "manager_user_id": dept.manager_user_id,
            "description": dept.description,
            "sort_order": dept.sort_order,
            "children": []
        })
    
    # 构建树
    roots = [d for d in dept_dicts if d["parent_id"] is None]
    for root in roots:
        root["children"] = _build_dept_children(dept_dicts, root["id"])
    
    return roots


def _build_dept_children(dept_dicts: List[dict], parent_id: int) -> List[dict]:
    """递归构建部门子树"""
    children = [d for d in dept_dicts if d["parent_id"] == parent_id]
    for child in children:
        child["children"] = _build_dept_children(dept_dicts, child["id"])
    return children


def get_department_detail(db: Session, dept_id: int, ctx: RequestContext) -> Department:
    """获取部门详情"""
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise NotFoundException("部门不存在")
    if not ctx.is_super_admin and dept.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权查看该部门")
    return dept


def update_department(db: Session, dept_id: int, data: dict, ctx: RequestContext) -> Department:
    """更新部门信息"""
    dept = get_department_detail(db, dept_id, ctx)
    
    if data.get("name"):
        # 检查同级名称是否冲突
        existing = db.query(Department).filter(
            Department.organization_id == dept.organization_id,
            Department.parent_id == dept.parent_id,
            Department.name == data["name"],
            Department.id != dept_id,
            Department.status == "enabled"
        ).first()
        if existing:
            raise BadRequestException("同级部门名称已存在")
        dept.name = data["name"]
    if data.get("code") is not None:
        dept.code = data["code"]
    if data.get("parent_id") is not None:
        dept.parent_id = data["parent_id"]
    if data.get("manager_user_id") is not None:
        dept.manager_user_id = data["manager_user_id"]
    if data.get("description") is not None:
        dept.description = data["description"]
    if data.get("sort_order") is not None:
        dept.sort_order = data["sort_order"]
    if data.get("status"):
        dept.status = data["status"]
    
    db.commit()
    db.refresh(dept)
    return dept


def delete_department(db: Session, dept_id: int, ctx: RequestContext):
    """删除部门"""
    dept = get_department_detail(db, dept_id, ctx)
    
    # 检查是否有子部门
    children = db.query(Department).filter(Department.parent_id == dept_id, Department.status == "enabled").all()
    if children:
        raise BadRequestException("部门下还有子部门，无法删除")
    
    # 检查是否有成员
    members = db.query(UserOrganization).filter(
        UserOrganization.department_id == dept_id,
        UserOrganization.status == "active"
    ).all()
    if members:
        raise BadRequestException("部门下还有成员，请先移除成员")
    
    dept.status = "deleted"
    db.commit()
    logger.info(f"删除部门: dept_id={dept_id}")


# ============== 岗位管理 ==============

def create_position(db: Session, dept_id: int, name: str, code: Optional[str], 
                    description: Optional[str], ctx: RequestContext) -> Position:
    """创建岗位"""
    if not ctx.is_super_admin and ctx.tenant_id is None:
        raise ForbiddenException("需要租户权限")
    
    dept = db.query(Department).filter(Department.id == dept_id).first()
    if not dept:
        raise NotFoundException("部门不存在")
    
    position = Position(
        tenant_id=ctx.tenant_id,
        department_id=dept_id,
        name=name,
        code=code,
        description=description,
        status="enabled"
    )
    db.add(position)
    db.commit()
    db.refresh(position)
    logger.info(f"创建岗位: dept_id={dept_id}, name={name}")
    return position


def get_position_list(db: Session, dept_id: Optional[int], ctx: RequestContext) -> List[Position]:
    """获取岗位列表"""
    query = db.query(Position).filter(Position.status == "enabled")
    if not ctx.is_super_admin:
        query = query.filter(Position.tenant_id == ctx.tenant_id)
    if dept_id:
        query = query.filter(Position.department_id == dept_id)
    return query.all()


def get_position_detail(db: Session, position_id: int, ctx: RequestContext) -> Position:
    """获取岗位详情"""
    position = db.query(Position).filter(Position.id == position_id).first()
    if not position:
        raise NotFoundException("岗位不存在")
    if not ctx.is_super_admin and position.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权查看该岗位")
    return position


def update_position(db: Session, position_id: int, data: dict, ctx: RequestContext) -> Position:
    """更新岗位信息"""
    position = get_position_detail(db, position_id, ctx)
    
    if data.get("name"):
        position.name = data["name"]
    if data.get("code") is not None:
        position.code = data["code"]
    if data.get("description") is not None:
        position.description = data["description"]
    if data.get("status"):
        position.status = data["status"]
    
    db.commit()
    db.refresh(position)
    return position


def delete_position(db: Session, position_id: int, ctx: RequestContext):
    """删除岗位"""
    position = get_position_detail(db, position_id, ctx)
    
    # 检查是否有成员关联
    members = db.query(UserOrganization).filter(
        UserOrganization.position_id == position_id,
        UserOrganization.status == "active"
    ).all()
    if members:
        raise BadRequestException("岗位下还有成员，请先移除成员")
    
    position.status = "deleted"
    db.commit()
    logger.info(f"删除岗位: position_id={position_id}")


# ============== 成员分配 ==============

def assign_user_to_organization(db: Session, user_id: int, org_id: int, dept_id: Optional[int], 
                                position_id: Optional[int], is_primary: bool, ctx: RequestContext) -> UserOrganization:
    """分配用户到组织/部门/岗位"""
    # 检查用户是否存在
    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise NotFoundException("用户不存在")
    
    # 检查权限
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能操作本租户用户")
    
    # 如果设为主组织，清除其他主组织标记
    if is_primary:
        db.query(UserOrganization).filter(
            UserOrganization.user_id == user_id,
            UserOrganization.is_primary == True
        ).update({"is_primary": False})
    
    # 检查是否已存在关联
    existing = db.query(UserOrganization).filter(
        UserOrganization.user_id == user_id,
        UserOrganization.organization_id == org_id,
        UserOrganization.department_id == dept_id,
        UserOrganization.position_id == position_id
    ).first()
    
    if existing:
        existing.status = "active"
        existing.is_primary = is_primary
        db.commit()
        db.refresh(existing)
        return existing
    
    uo = UserOrganization(
        tenant_id=ctx.tenant_id,
        user_id=user_id,
        organization_id=org_id,
        department_id=dept_id,
        position_id=position_id,
        is_primary=is_primary,
        status="active"
    )
    db.add(uo)
    db.commit()
    db.refresh(uo)
    logger.info(f"分配用户到组织: user_id={user_id}, org_id={org_id}")
    return uo


def get_user_organizations(db: Session, user_id: int, ctx: RequestContext) -> List[UserOrganization]:
    """获取用户的组织关联"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise NotFoundException("用户不存在")
    if not ctx.is_super_admin and user.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权查看该用户信息")
    
    return db.query(UserOrganization).filter(
        UserOrganization.user_id == user_id,
        UserOrganization.status == "active"
    ).all()


def remove_user_from_organization(db: Session, uo_id: int, ctx: RequestContext):
    """移除用户的组织关联"""
    uo = db.query(UserOrganization).filter(UserOrganization.id == uo_id).first()
    if not uo:
        raise NotFoundException("关联不存在")
    if not ctx.is_super_admin and uo.tenant_id != ctx.tenant_id:
        raise ForbiddenException("无权操作")
    
    uo.status = "inactive"
    db.commit()
    logger.info(f"移除用户组织关联: uo_id={uo_id}")


def get_department_members(db: Session, dept_id: int, ctx: RequestContext) -> List[dict]:
    """获取部门成员列表"""
    dept = get_department_detail(db, dept_id, ctx)
    
    uos = db.query(UserOrganization).filter(
        UserOrganization.department_id == dept_id,
        UserOrganization.status == "active"
    ).all()
    
    result = []
    for uo in uos:
        user = db.query(User).filter(User.id == uo.user_id).first()
        if user:
            position = db.query(Position).filter(Position.id == uo.position_id).first() if uo.position_id else None
            result.append({
                "id": uo.id,
                "user_id": user.id,
                "username": user.username,
                "nickname": user.nickname,
                "avatar_file_id": user.avatar_file_id,
                "position_id": uo.position_id,
                "position_name": position.name if position else None,
                "is_primary": uo.is_primary,
                "joined_at": uo.created_at
            })
    
    return result
