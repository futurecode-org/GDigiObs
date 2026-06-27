"""
数据库模型统一导入
"""
# 基础模型
from model.base import BaseModelMixin, TimestampMixin

# 核心模型
from model.tenant import Tenant
from model.user import User, UserType, UserStatus
from model.role import Role, RoleCode
from model.permission import Permission, PermissionType, PermissionCode
from model.user_role import UserRole
from model.role_permission import RolePermission
from model.refresh_token import RefreshTokenModel

# 组织架构模型
from model.organization import Organization, Department, Position, UserOrganization

# IM与群组模型
from model.conversation import Conversation, ConversationMember, Message
from model.group import Group, GroupMember, FriendRelation, FriendApplication

# 数据采集模型
from model.collect import CollectPlatform, CollectTask, CollectedItem, CollectLog

# 知识库模型
from model.knowledge import KnowledgeBase, KnowledgeFile, KnowledgeChunk

# AI能力模型
from model.model_config import ModelConfig
from model.skill import Skill

# 数字员工模型
from model.agent import DigitalAgent, AgentRun

# 工作流模型
from model.workflow import Workflow, WorkflowRun, WorkflowNodeLog

# 系统支持模型
from model.file import FileAsset
from model.notification import Notification
from model.log import OperationLog, AuditLog, AskRecord, AskSqlLog


__all__ = [
    # 基础模型
    "BaseModelMixin", "TimestampMixin",
    
    # 核心模型
    "Tenant", "User", "UserType", "UserStatus",
    "Role", "RoleCode", "Permission", "PermissionType", "PermissionCode",
    "UserRole", "RolePermission", "RefreshTokenModel",
    
    # 组织架构模型
    "Organization", "Department", "Position", "UserOrganization",
    
    # IM与群组模型
    "Conversation", "ConversationMember", "Message",
    "Group", "GroupMember", "FriendRelation", "FriendApplication",
    
    # 数据采集模型
    "CollectPlatform", "CollectTask", "CollectedItem", "CollectLog",
    
    # 知识库模型
    "KnowledgeBase", "KnowledgeFile", "KnowledgeChunk",
    
    # AI能力模型
    "ModelConfig", "Skill",
    
    # 数字员工模型
    "DigitalAgent", "AgentRun",
    
    # 工作流模型
    "Workflow", "WorkflowRun", "WorkflowNodeLog",
    
    # 系统支持模型
    "FileAsset", "Notification",
    "OperationLog", "AuditLog", "AskRecord", "AskSqlLog",
]