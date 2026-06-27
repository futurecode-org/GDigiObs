from sqlalchemy import Column, Integer, String, Text
from database.session import Base
from model.base import BaseModelMixin


class Permission(Base, BaseModelMixin):
    """权限表"""
    __tablename__ = "permissions"
    
    code = Column(String(100), nullable=False, unique=True, index=True, comment="权限编码")
    name = Column(String(100), nullable=False, comment="权限名称")
    type = Column(String(20), nullable=False, comment="权限类型: menu/button/api/data")
    parent_id = Column(Integer, nullable=True, comment="父级权限ID")
    path = Column(String(255), nullable=True, comment="菜单路径或API路径")
    method = Column(String(20), nullable=True, comment="API方法: GET/POST/PUT/DELETE")
    icon = Column(String(100), nullable=True, comment="菜单图标")
    sort_order = Column(Integer, default=0, comment="排序序号")
    description = Column(Text, nullable=True, comment="权限描述")
    status = Column(String(20), default="enabled", comment="状态: enabled/disabled")


# 权限类型
class PermissionType:
    MENU = "menu"
    BUTTON = "button"
    API = "api"
    DATA = "data"


# 预置权限编码
class PermissionCode:
    # 用户管理
    USER_VIEW = "user:view"
    USER_CREATE = "user:create"
    USER_UPDATE = "user:update"
    USER_DISABLE = "user:disable"
    USER_BAN = "user:ban"
    USER_ASSIGN_ROLE = "user:assign_role"
    
    # 租户管理
    TENANT_VIEW = "tenant:view"
    TENANT_CREATE = "tenant:create"
    TENANT_UPDATE = "tenant:update"
    TENANT_DISABLE = "tenant:disable"
    
    # 角色管理
    ROLE_VIEW = "role:view"
    ROLE_CREATE = "role:create"
    ROLE_UPDATE = "role:update"
    ROLE_DELETE = "role:delete"
    
    # 权限管理
    PERMISSION_VIEW = "permission:view"
    PERMISSION_ASSIGN = "permission:assign"
    
    # 数据采集
    COLLECT_PLATFORM_VIEW = "collect:platform:view"
    COLLECT_PLATFORM_CREATE = "collect:platform:create"
    COLLECT_TASK_VIEW = "collect:task:view"
    COLLECT_TASK_CREATE = "collect:task:create"
    COLLECT_TASK_RUN = "collect:task:run"
    COLLECT_ITEM_VIEW = "collect:item:view"
    
    # 智能问数
    ASK_QUERY = "ask:query"
    ASK_SQL_PREVIEW = "ask:sql_preview"
    ASK_VIEW_HISTORY = "ask:view_history"
    ASK_EXPORT = "ask:export"
    ASK_SYSTEM_QUERY = "ask:system:query"
    
    # 聊天审计
    AUDIT_MESSAGE_VIEW = "audit:message:view"
    AUDIT_MESSAGE_REVIEW = "audit:message:review"
    AUDIT_MESSAGE_BLOCK = "audit:message:block"
    
    # 模型管理
    MODEL_VIEW = "model:view"
    MODEL_CREATE = "model:create"
    MODEL_TEST = "model:test"
    
    # 技能管理
    SKILL_VIEW = "skill:view"
    SKILL_CREATE = "skill:create"
    SKILL_TEST = "skill:test"
    SKILL_APPROVE = "skill:approve"
    
    # 数字员工
    AGENT_VIEW = "agent:view"
    AGENT_CREATE = "agent:create"
    AGENT_RUN = "agent:run"
    
    # 工作流
    WORKFLOW_VIEW = "workflow:view"
    WORKFLOW_CREATE = "workflow:create"
    WORKFLOW_RUN = "workflow:run"