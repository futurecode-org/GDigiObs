"""RBAC权限管理业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import Dict, List

from dao.rbac_dao import (
    get_role_by_id, get_roles_by_tenant, get_all_roles, create_role, update_role, soft_delete_role,
    get_permission_by_id, get_all_permissions, get_menu_permissions, get_permissions_by_type,
    assign_permission_to_role, clear_role_permissions, get_role_permissions,
    get_user_roles, get_role_by_code
)
from model.role import Role, RoleCode
from model.permission import Permission, PermissionType
from schema.rbac import RoleCreate, RoleUpdate
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from core.dependencies import RequestContext

logger = logging.getLogger(__name__)


# ============== 角色管理 ==============

def get_role_list(db: Session, ctx: RequestContext, page: int = 1, page_size: int = 20) -> Dict:
    """获取角色列表
    
    - 超级管理员可以看到所有角色
    - 租户管理员只能看到自己租户的角色和平台角色
    """
    if ctx.is_super_admin:
        # 超级管理员可以看到所有角色
        roles = get_all_roles(db)
    else:
        # 普通管理员只能看到自己租户的角色和平台角色
        roles = get_roles_by_tenant(db, ctx.tenant_id, page, page_size)
        # 同时获取平台角色
        platform_roles = db.query(Role).filter(
            Role.is_platform == True,
            Role.deleted_at.is_(None)
        ).all()
        # 合并去重
        role_ids = {r.id for r in roles}
        for pr in platform_roles:
            if pr.id not in role_ids:
                roles.append(pr)
    
    total = len(roles)
    # 分页处理
    start = (page - 1) * page_size
    end = start + page_size
    paginated_roles = roles[start:end]
    
    return {
        "items": paginated_roles,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total // page_size) + (1 if total % page_size > 0 else 0)
    }


def get_role_detail(db: Session, role_id: int, ctx: RequestContext) -> Role:
    """获取角色详情"""
    role = get_role_by_id(db, role_id)
    if not role:
        raise NotFoundException("角色不存在")
    
    # 权限检查
    if not ctx.is_super_admin:
        if role.tenant_id != ctx.tenant_id and not role.is_platform:
            raise ForbiddenException("无权查看该角色")
    
    return role


def create_custom_role(db: Session, data: RoleCreate, ctx: RequestContext) -> Role:
    """创建自定义角色"""
    if ctx.is_super_admin:
        tenant_id = data.tenant_id
        is_platform = data.tenant_id is None
    else:
        tenant_id = ctx.tenant_id
        is_platform = False
    
    # 检查角色编码是否已存在
    existing = get_role_by_code(db, data.code)
    if existing:
        raise BadRequestException("角色编码已存在")
    
    role = Role(
        tenant_id=tenant_id,
        name=data.name,
        code=data.code,
        description=data.description,
        is_system=False,
        is_platform=is_platform,
        status="enabled"
    )
    return create_role(db, role)


def update_custom_role(db: Session, role_id: int, data: RoleUpdate, ctx: RequestContext) -> Role:
    """更新自定义角色"""
    role = get_role_detail(db, role_id, ctx)
    
    if role.is_system:
        raise BadRequestException("系统内置角色不可修改")
    
    if not ctx.is_super_admin and role.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能修改本租户的角色")
    
    update_data = {}
    if data.name is not None:
        update_data["name"] = data.name
    if data.description is not None:
        update_data["description"] = data.description
    if data.status is not None:
        update_data["status"] = data.status
    
    return update_role(db, role, **update_data)


def delete_custom_role(db: Session, role_id: int, ctx: RequestContext):
    """删除自定义角色"""
    role = get_role_detail(db, role_id, ctx)
    
    if role.is_system:
        raise BadRequestException("系统内置角色不可删除")
    
    if not ctx.is_super_admin and role.tenant_id != ctx.tenant_id:
        raise ForbiddenException("只能删除本租户的角色")
    
    # 检查是否有关联用户
    users = get_user_roles(db, role_id)
    # 注意：这里get_user_roles是获取用户的角色，不是获取角色的用户
    # 需要重新查询
    from model.user_role import UserRole
    user_count = db.query(UserRole).filter(UserRole.role_id == role_id).count()
    if user_count > 0:
        raise BadRequestException(f"该角色还有 {user_count} 个用户关联，无法删除")
    
    soft_delete_role(db, role_id)
    logger.info(f"角色已删除: role_id={role_id}")


def assign_permissions_to_role(db: Session, role_id: int, permission_ids: List[int], ctx: RequestContext):
    """为角色分配权限"""
    role = get_role_detail(db, role_id, ctx)
    
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
    
    logger.info(f"为角色分配权限: role_id={role_id}, permission_ids={permission_ids}")


def get_role_permission_ids(db: Session, role_id: int, ctx: RequestContext) -> List[int]:
    """获取角色的权限ID列表"""
    role = get_role_detail(db, role_id, ctx)
    permissions = get_role_permissions(db, role_id)
    return [p.id for p in permissions]


def get_role_users(db: Session, role_id: int, ctx: RequestContext) -> List[dict]:
    """获取角色的关联用户"""
    role = get_role_detail(db, role_id, ctx)
    
    from model.user_role import UserRole
    from model.user import User
    
    user_roles = db.query(UserRole).filter(UserRole.role_id == role_id).all()
    user_ids = [ur.user_id for ur in user_roles]
    
    if not user_ids:
        return []
    
    users = db.query(User).filter(User.id.in_(user_ids), User.deleted_at.is_(None)).all()
    return [{
        "id": u.id,
        "username": u.username,
        "nickname": u.nickname,
        "status": u.status
    } for u in users]


# ============== 权限管理 ==============

def get_permission_list(db: Session, ctx: RequestContext) -> List[Permission]:
    """获取权限列表"""
    return get_all_permissions(db)


def get_permission_tree(db: Session, ctx: RequestContext) -> List[dict]:
    """获取权限树（按类型分组）"""
    permissions = get_all_permissions(db)
    
    perm_dicts = []
    for perm in permissions:
        perm_dicts.append({
            "id": perm.id,
            "code": perm.code,
            "name": perm.name,
            "type": perm.type,
            "parent_id": perm.parent_id,
            "path": perm.path,
            "method": perm.method,
            "icon": perm.icon,
            "sort_order": perm.sort_order,
            "description": perm.description,
            "status": perm.status,
            "children": []
        })
    
    # 构建树
    roots = [p for p in perm_dicts if p["parent_id"] is None]
    roots.sort(key=lambda x: x["sort_order"])
    for root in roots:
        root["children"] = _build_perm_children(perm_dicts, root["id"])
    
    return roots


def _build_perm_children(perm_dicts: List[dict], parent_id: int) -> List[dict]:
    """递归构建权限子树"""
    children = [p for p in perm_dicts if p["parent_id"] == parent_id]
    children.sort(key=lambda x: x["sort_order"])
    for child in children:
        child["children"] = _build_perm_children(perm_dicts, child["id"])
    return children


def get_menu_permissions_for_user(db: Session, ctx: RequestContext) -> List[dict]:
    """获取用户的菜单权限（树形）"""
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


def get_button_permissions_for_user(db: Session, ctx: RequestContext) -> List[str]:
    """获取用户的按钮权限编码列表"""
    if ctx.is_super_admin:
        # 超级管理员拥有所有按钮权限
        perms = get_permissions_by_type(db, PermissionType.BUTTON)
        return [p.code for p in perms]
    return [p for p in ctx.permissions if ":" in p]  # 按钮权限通常包含冒号


def get_data_scope_permissions(db: Session, ctx: RequestContext) -> List[dict]:
    """获取数据权限范围"""
    # 数据权限类型
    data_scopes = [
        {"code": "all_platform", "name": "全平台", "description": "平台超级管理员可用"},
        {"code": "current_tenant", "name": "本租户", "description": "租户管理员可用"},
        {"code": "current_department", "name": "本部门", "description": "部门负责人或授权角色可用"},
        {"code": "current_department_and_children", "name": "本部门及下级", "description": "管理型角色可用"},
        {"code": "self", "name": "仅本人", "description": "普通用户默认"},
        {"code": "custom", "name": "自定义", "description": "指定部门、用户、数据集或标签"},
    ]
    return data_scopes
