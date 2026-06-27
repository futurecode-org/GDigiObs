import logging
from sqlalchemy.orm import Session
from typing import Dict, List

from dao.rbac_dao import (
    get_role_by_id, get_roles_by_tenant, get_all_roles, create_role, update_role, soft_delete_role,
    get_permission_by_id, get_all_permissions, get_menu_permissions,
    assign_permission_to_role, clear_role_permissions, get_role_permissions
)
from model.role import Role
from model.permission import Permission
from schema.rbac import RoleCreate, RoleUpdate, MenuNode
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


def get_role_list(db: Session, ctx: RequestContext, page: int = 1, page_size: int = 20) -> Dict:
    """获取角色列表"""
    if ctx.is_super_admin:
        # 超级管理员可以看到所有角色
        roles = get_all_roles(db)
    else:
        # 普通管理员只能看到自己租户的角色
        roles = get_roles_by_tenant(db, ctx.tenant_id, page, page_size)
    
    return {
        "items": roles,
        "total": len(roles),
        "page": page,
        "page_size": page_size,
        "total_pages": (len(roles) // page_size) + (1 if len(roles) % page_size > 0 else 0)
    }


def get_role_detail(db: Session, role_id: int) -> Role:
    """获取角色详情"""
    role = get_role_by_id(db, role_id)
    if not role:
        raise NotFoundException("角色不存在")
    return role


def create_custom_role(db: Session, data: RoleCreate, ctx: RequestContext) -> Role:
    """创建自定义角色"""
    if ctx.is_super_admin:
        tenant_id = data.tenant_id
    else:
        tenant_id = ctx.tenant_id
    
    role = Role(
        tenant_id=tenant_id,
        name=data.name,
        code=data.code,
        description=data.description,
        is_system=False,
        is_platform=ctx.is_super_admin
    )
    return create_role(db, role)


def update_custom_role(db: Session, role_id: int, data: RoleUpdate, ctx: RequestContext) -> Role:
    """更新自定义角色"""
    role = get_role_detail(db, role_id)
    
    if role.is_system:
        raise BadRequestException("系统内置角色不可修改")
    
    if not ctx.is_super_admin and role.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能修改本租户的角色")
    
    if data.name:
        role.name = data.name
    if data.description:
        role.description = data.description
    if data.status:
        role.status = data.status
    
    return update_role(db, role)


def assign_permissions_to_role(db: Session, role_id: int, permission_ids: List[int], ctx: RequestContext):
    """为角色分配权限"""
    role = get_role_detail(db, role_id)
    
    if role.is_system:
        raise BadRequestException("系统内置角色权限不可修改")
    
    if not ctx.is_super_admin and role.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能修改本租户的角色权限")
    
    # 清除原有权限
    clear_role_permissions(db, role_id)
    
    # 分配新权限
    for perm_id in permission_ids:
        perm = get_permission_by_id(db, perm_id)
        if perm:
            assign_permission_to_role(db, role_id, perm_id)


def get_permission_list(db: Session) -> List[Permission]:
    """获取权限列表"""
    return get_all_permissions(db)


def get_menu_permissions_for_user(db: Session, ctx: RequestContext) -> List[dict]:
    """获取用户的菜单权限"""
    if ctx.is_super_admin:
        # 超级管理员拥有所有菜单
        menu_perms = get_menu_permissions(db)
    else:
        # 普通用户根据权限过滤
        menu_perms = []
        all_perms = get_menu_permissions(db)
        for perm in all_perms:
            if perm.code in ctx.permissions:
                menu_perms.append(perm)
    
    # 构建菜单树
    return build_menu_tree(menu_perms)


def build_menu_tree(permissions: List[Permission]) -> List[dict]:
    """构建菜单树"""
    # 转换为字典格式
    menu_dicts = []
    for perm in permissions:
        menu_dicts.append({
            "id": perm.id,
            "code": perm.code,
            "name": perm.name,
            "path": perm.path,
            "icon": perm.icon,
            "sort_order": perm.sort_order,
            "parent_id": perm.parent_id,
            "children": []
        })
    
    # 找出根节点
    roots = [m for m in menu_dicts if m["parent_id"] is None]
    roots.sort(key=lambda x: x["sort_order"])
    
    # 为每个根节点构建子树
    for root in roots:
        root["children"] = build_children(menu_dicts, root["id"])
    
    return roots


def build_children(menu_dicts: List[dict], parent_id: int) -> List[dict]:
    """递归构建子菜单"""
    children = [m for m in menu_dicts if m["parent_id"] == parent_id]
    children.sort(key=lambda x: x["sort_order"])
    for child in children:
        child["children"] = build_children(menu_dicts, child["id"])
    return children