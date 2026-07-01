import logging
from typing import Optional, List
from sqlalchemy.orm import Session
from model.role import Role
from model.permission import Permission
from model.user_role import UserRole
from model.role_permission import RolePermission
from datetime import datetime

logger = logging.getLogger(__name__)


# Role DAO
def get_role_by_id(db: Session, role_id: int) -> Optional[Role]:
    """根据ID查询角色"""
    return db.query(Role).filter(Role.id == role_id, Role.deleted_at.is_(None)).first()


def get_role_by_code(db: Session, code: str) -> Optional[Role]:
    """根据编码查询角色"""
    return db.query(Role).filter(Role.code == code, Role.deleted_at.is_(None)).first()


def get_roles_by_tenant(db: Session, tenant_id: Optional[int], page: int = 1, page_size: int = 20) -> List[Role]:
    """查询租户下的角色列表"""
    query = db.query(Role).filter(Role.deleted_at.is_(None))
    if tenant_id:
        query = query.filter(Role.tenant_id == tenant_id)
    else:
        query = query.filter(Role.is_platform == True)  # 平台角色
    return query.offset((page - 1) * page_size).limit(page_size).all()


def get_all_roles(db: Session) -> List[Role]:
    """查询所有角色"""
    return db.query(Role).filter(Role.deleted_at.is_(None)).all()


def create_role(db: Session, role: Role) -> Role:
    """创建角色"""
    try:
        db.add(role)
        db.commit()
        db.refresh(role)
        return role
    except Exception as e:
        db.rollback()
        logger.error(f"创建角色失败: {e}")
        raise


def update_role(db: Session, role: Role, **kwargs) -> Role:
    """更新角色"""
    try:
        for key, value in kwargs.items():
            setattr(role, key, value)
        role.updated_at = datetime.now()
        db.commit()
        db.refresh(role)
        return role
    except Exception as e:
        db.rollback()
        logger.error(f"更新角色失败: {e}")
        raise


def soft_delete_role(db: Session, role_id: int) -> bool:
    """软删除角色"""
    try:
        role = get_role_by_id(db, role_id)
        if role and not role.is_system:
            role.deleted_at = datetime.now()
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"软删除角色失败: {e}")
        raise


# Permission DAO
def get_permission_by_id(db: Session, permission_id: int) -> Optional[Permission]:
    """根据ID查询权限"""
    return db.query(Permission).filter(Permission.id == permission_id).first()


def get_permission_by_code(db: Session, code: str) -> Optional[Permission]:
    """根据编码查询权限"""
    return db.query(Permission).filter(Permission.code == code).first()


def get_all_permissions(db: Session) -> List[Permission]:
    """查询所有权限"""
    return db.query(Permission).all()


def get_permissions_by_type(db: Session, permission_type: str) -> List[Permission]:
    """根据类型查询权限"""
    return db.query(Permission).filter(Permission.type == permission_type).all()


def get_menu_permissions(db: Session) -> List[Permission]:
    """查询菜单权限"""
    return get_permissions_by_type(db, "menu")


def create_permission(db: Session, permission: Permission) -> Permission:
    """创建权限"""
    try:
        db.add(permission)
        db.commit()
        db.refresh(permission)
        return permission
    except Exception as e:
        db.rollback()
        logger.error(f"创建权限失败: {e}")
        raise


# UserRole DAO
def get_user_roles(db: Session, user_id: int) -> List[Role]:
    """获取用户的角色列表"""
    user_roles = db.query(UserRole).filter(UserRole.user_id == user_id).all()
    role_ids = [ur.role_id for ur in user_roles]
    if not role_ids:
        return []
    return db.query(Role).filter(Role.id.in_(role_ids), Role.deleted_at.is_(None)).all()


def assign_role_to_user(db: Session, user_id: int, role_id: int) -> UserRole:
    """为用户分配角色"""
    try:
        # 检查是否已分配
        existing = db.query(UserRole).filter(
            UserRole.user_id == user_id,
            UserRole.role_id == role_id
        ).first()
        if existing:
            return existing
        
        user_role = UserRole(user_id=user_id, role_id=role_id)
        db.add(user_role)
        db.commit()
        db.refresh(user_role)
        return user_role
    except Exception as e:
        db.rollback()
        logger.error(f"分配角色失败: {e}")
        raise


def remove_role_from_user(db: Session, user_id: int, role_id: int) -> bool:
    """移除用户角色"""
    try:
        user_role = db.query(UserRole).filter(
            UserRole.user_id == user_id,
            UserRole.role_id == role_id
        ).first()
        if user_role:
            db.delete(user_role)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"移除角色失败: {e}")
        raise


def clear_user_roles(db: Session, user_id: int) -> bool:
    """清除用户的所有角色"""
    try:
        db.query(UserRole).filter(UserRole.user_id == user_id).delete()
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"清除用户角色失败: {e}")
        raise


# RolePermission DAO
def get_role_permissions(db: Session, role_id: int) -> List[Permission]:
    """获取角色的权限列表"""
    role_perms = db.query(RolePermission).filter(RolePermission.role_id == role_id).all()
    perm_ids = [rp.permission_id for rp in role_perms]
    if not perm_ids:
        return []
    return db.query(Permission).filter(Permission.id.in_(perm_ids)).all()


def assign_permission_to_role(db: Session, role_id: int, permission_id: int) -> RolePermission:
    """为角色分配权限"""
    try:
        existing = db.query(RolePermission).filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id
        ).first()
        if existing:
            return existing
        
        role_perm = RolePermission(role_id=role_id, permission_id=permission_id)
        db.add(role_perm)
        db.commit()
        db.refresh(role_perm)
        return role_perm
    except Exception as e:
        db.rollback()
        logger.error(f"分配权限失败: {e}")
        raise


def remove_permission_from_role(db: Session, role_id: int, permission_id: int) -> bool:
    """移除角色权限"""
    try:
        role_perm = db.query(RolePermission).filter(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id
        ).first()
        if role_perm:
            db.delete(role_perm)
            db.commit()
            return True
        return False
    except Exception as e:
        db.rollback()
        logger.error(f"移除权限失败: {e}")
        raise


def clear_role_permissions(db: Session, role_id: int) -> bool:
    """清除角色的所有权限"""
    try:
        db.query(RolePermission).filter(RolePermission.role_id == role_id).delete()
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"清除角色权限失败: {e}")
        raise


# 初始化系统默认角色和权限
def init_system_roles_and_permissions(db: Session):
    """初始化系统默认角色和权限"""
    # 创建系统角色
    system_roles = [
        Role(name="超级管理员", code="super_admin", is_system=True, is_platform=True, description="平台超级管理员"),
        Role(name="租户管理员", code="tenant_admin", is_system=True, description="租户管理员"),
        Role(name="管理员", code="admin", is_system=True, description="普通管理员"),
        Role(name="用户", code="user", is_system=True, description="普通用户"),
        Role(name="外部用户", code="external_user", is_system=True, description="外部注册用户"),
    ]
    
    for role in system_roles:
        existing = get_role_by_code(db, role.code)
        if not existing:
            create_role(db, role)
    
    # 创建基础权限
    basic_permissions = [
        # 用户管理
        Permission(code="user:view", name="查看用户", type="button"),
        Permission(code="user:create", name="创建用户", type="button"),
        Permission(code="user:update", name="编辑用户", type="button"),
        Permission(code="user:disable", name="禁用用户", type="button"),
        Permission(code="user:ban", name="封禁用户", type="button"),
        Permission(code="user:assign_role", name="分配角色", type="button"),
        
        # 租户管理
        Permission(code="tenant:view", name="查看租户", type="button"),
        Permission(code="tenant:create", name="创建租户", type="button"),
        Permission(code="tenant:update", name="编辑租户", type="button"),
        Permission(code="tenant:disable", name="停用租户", type="button"),
        
        # 角色管理
        Permission(code="role:view", name="查看角色", type="button"),
        Permission(code="role:create", name="创建角色", type="button"),
        Permission(code="role:update", name="编辑角色", type="button"),
        Permission(code="role:delete", name="删除角色", type="button"),
        
        # 智能问数
        Permission(code="ask:query", name="发起问数", type="button"),
        Permission(code="ask:view_history", name="查看问数历史", type="button"),
        Permission(code="ask:export", name="导出问数结果", type="button"),
        Permission(code="ask:system:query", name="系统问数", type="button"),
        
        # 模型管理
        Permission(code="model:view", name="查看模型", type="button"),
        Permission(code="model:create", name="创建模型", type="button"),
        Permission(code="model:test", name="测试模型", type="button"),
        
        # 数字员工
        Permission(code="agent:view", name="查看数字员工", type="button"),
        Permission(code="agent:create", name="创建数字员工", type="button"),
        Permission(code="agent:run", name="执行数字员工", type="button"),

        # 审计风控
        Permission(code="audit:view", name="查看审计记录", type="button"),
        Permission(code="audit:review", name="人工复核审计", type="button"),
        Permission(code="audit:sensitive:manage", name="管理敏感词库", type="button"),
        Permission(code="audit:alert:manage", name="管理告警规则", type="button"),
        Permission(code="audit:alert:view", name="查看告警记录", type="button"),
        Permission(code="user:mute", name="禁言用户", type="button"),
    ]

    for perm in basic_permissions:
        existing = get_permission_by_code(db, perm.code)
        if not existing:
            create_permission(db, perm)

    # 为系统角色分配权限
    role_permission_map = {
        "super_admin": [p.code for p in basic_permissions],
        "tenant_admin": [
            "user:view", "user:create", "user:update", "user:disable", "user:ban", "user:assign_role", "user:mute",
            "role:view", "role:create", "role:update", "role:delete",
            "ask:query", "ask:view_history", "ask:export",
            "model:view", "model:create", "model:test",
            "agent:view", "agent:create", "agent:run",
            "audit:view", "audit:review", "audit:sensitive:manage", "audit:alert:manage", "audit:alert:view",
        ],
        "admin": [
            "user:view", "user:create", "user:update", "user:disable", "user:ban", "user:mute",
            "role:view",
            "ask:query", "ask:view_history",
            "model:view", "model:test",
            "agent:view", "agent:run",
            "audit:view", "audit:review", "audit:sensitive:manage", "audit:alert:manage", "audit:alert:view",
        ],
    }

    for role_code, perm_codes in role_permission_map.items():
        role = get_role_by_code(db, role_code)
        if not role:
            continue
        for perm_code in perm_codes:
            perm = get_permission_by_code(db, perm_code)
            if perm:
                assign_permission_to_role(db, role.id, perm.id)

    logger.info("系统角色和权限初始化完成")