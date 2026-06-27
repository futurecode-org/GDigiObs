"""群组管理业务逻辑层"""
import logging
from sqlalchemy.orm import Session
from typing import List, Dict, Optional
from datetime import datetime

from dao.group_dao import (
    create_group, get_group_by_id, get_user_groups, get_group_members,
    is_group_member, get_group_member, add_group_member, remove_group_member,
    leave_group, update_group_member_role, update_group_info, dissolve_group,
    get_friend_relation, get_user_friends, create_friend_relation,
    delete_friend_relation, create_friend_application, get_friend_application,
    get_user_friend_applications, accept_friend_application, reject_friend_application
)
from dao.user_dao import get_user_by_id
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from model.user import User
from model.group import Group

logger = logging.getLogger(__name__)


def create_group_service(db: Session, current_user: User, name: str, 
                         description: str = None, max_members: int = 500) -> Dict:
    """创建群组"""
    group = create_group(
        db, current_user.tenant_id, name, current_user.id, description, max_members
    )
    
    logger.info(f"用户创建群组: user_id={current_user.id}, group_id={group.id}")
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "owner_id": group.owner_id,
        "max_members": group.max_members,
        "created_at": group.created_at
    }


def get_groups(db: Session, current_user: User) -> List[Dict]:
    """获取用户群组列表"""
    groups = get_user_groups(db, current_user.id, current_user.tenant_id)
    
    result = []
    for group in groups:
        members = get_group_members(db, group.id)
        member_count = len(members)
        
        # 获取当前用户角色
        current_member = get_group_member(db, group.id, current_user.id)
        role = current_member.role if current_member else None
        
        result.append({
            "id": group.id,
            "name": group.name,
            "avatar_file_id": group.avatar_file_id,
            "member_count": member_count,
            "owner_id": group.owner_id,
            "role": role,
            "status": group.status
        })
    
    return result


def get_group_detail(db: Session, current_user: User, group_id: int) -> Dict:
    """获取群组详情"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    # 检查租户
    if group.tenant_id != current_user.tenant_id:
        raise ForbiddenException("无权访问此群组")
    
    # 获取成员信息
    members = get_group_members(db, group_id)
    member_info = []
    for member in members:
        user = get_user_by_id(db, member.user_id)
        member_info.append({
            "user_id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "avatar_file_id": user.avatar_file_id,
            "role": member.role,
            "joined_at": member.joined_at
        })
    
    # 获取当前用户角色
    current_member = get_group_member(db, group_id, current_user.id)
    role = current_member.role if current_member else None
    
    return {
        "group": {
            "id": group.id,
            "name": group.name,
            "avatar_file_id": group.avatar_file_id,
            "description": group.description,
            "owner_id": group.owner_id,
            "max_members": group.max_members,
            "join_mode": group.join_mode,
            "allow_member_invite": group.allow_member_invite
        },
        "members": member_info,
        "member_count": len(members),
        "my_role": role
    }


def add_group_members_service(db: Session, current_user: User, group_id: int, 
                               user_ids: List[int]):
    """添加群成员"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    # 检查权限：群主和管理员可添加成员
    current_member = get_group_member(db, group_id, current_user.id)
    if not current_member or current_member.role not in ["owner", "admin"]:
        raise ForbiddenException("无权添加群成员")
    
    # 检查群人数限制
    current_count = len(get_group_members(db, group_id))
    if current_count + len(user_ids) > group.max_members:
        raise BadRequestException(f"群人数已达上限，最多还可添加 {group.max_members - current_count} 人")
    
    # 添加成员
    for user_id in user_ids:
        if not is_group_member(db, group_id, user_id):
            user = get_user_by_id(db, user_id)
            if user and user.tenant_id == group.tenant_id:
                add_group_member(db, group_id, user_id)
    
    logger.info(f"添加群成员: group_id={group_id}, user_ids={user_ids}")


def remove_group_member_service(db: Session, current_user: User, group_id: int, user_id: int):
    """移除群成员"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    # 检查权限：群主和管理员可移除成员
    current_member = get_group_member(db, group_id, current_user.id)
    if not current_member or current_member.role not in ["owner", "admin"]:
        raise ForbiddenException("无权移除群成员")
    
    # 不能移除群主
    target_member = get_group_member(db, group_id, user_id)
    if target_member and target_member.role == "owner":
        raise ForbiddenException("不能移除群主")
    
    success = remove_group_member(db, group_id, user_id)
    if not success:
        raise NotFoundException("成员不存在")
    
    logger.info(f"移除群成员: group_id={group_id}, user_id={user_id}")


def leave_group_service(db: Session, current_user: User, group_id: int):
    """退出群组"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    success = leave_group(db, group_id, current_user.id)
    if not success:
        raise BadRequestException("无法退出群组（可能是群主）")
    
    logger.info(f"用户退出群组: user_id={current_user.id}, group_id={group_id}")


def update_group_service(db: Session, current_user: User, group_id: int, **kwargs):
    """更新群组信息"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    # 检查权限：群主可更新所有信息，管理员可更新部分信息
    current_member = get_group_member(db, group_id, current_user.id)
    if not current_member:
        raise ForbiddenException("无权更新群组信息")
    
    # 群主才能修改的关键信息
    owner_only_fields = ["max_members", "join_mode", "allow_member_invite"]
    if any(field in kwargs for field in owner_only_fields):
        if current_member.role != "owner":
            raise ForbiddenException("只有群主才能修改这些信息")
    
    group = update_group_info(db, group_id, **kwargs)
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "updated_at": group.updated_at
    }


def set_group_admin(db: Session, current_user: User, group_id: int, user_id: int, is_admin: bool):
    """设置/取消群管理员"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    # 只有群主能设置管理员
    current_member = get_group_member(db, group_id, current_user.id)
    if not current_member or current_member.role != "owner":
        raise ForbiddenException("只有群主才能设置管理员")
    
    role = "admin" if is_admin else "member"
    success = update_group_member_role(db, group_id, user_id, role)
    if not success:
        raise NotFoundException("成员不存在")


def dissolve_group_service(db: Session, current_user: User, group_id: int):
    """解散群组"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    # 只有群主能解散群组
    current_member = get_group_member(db, group_id, current_user.id)
    if not current_member or current_member.role != "owner":
        raise ForbiddenException("只有群主才能解散群组")
    
    dissolve_group(db, group_id)
    logger.info(f"解散群组: group_id={group_id}")


# 好友管理服务
def get_friends_service(db: Session, current_user: User) -> List[Dict]:
    """获取好友列表"""
    friends = get_user_friends(db, current_user.id)
    
    result = []
    for friend_rel in friends:
        friend_user = get_user_by_id(db, friend_rel.friend_user_id)
        if friend_user:
            result.append({
                "friend_relation": {
                    "id": friend_rel.id,
                    "remark": friend_rel.remark,
                    "group_name": friend_rel.group_name,
                    "created_at": friend_rel.created_at
                },
                "friend_user": {
                    "id": friend_user.id,
                    "username": friend_user.username,
                    "nickname": friend_user.nickname,
                    "avatar_file_id": friend_user.avatar_file_id,
                    "status": friend_user.status
                }
            })
    
    return result


def apply_friend_service(db: Session, current_user: User, to_user_id: int, message: str = None):
    """申请添加好友"""
    target_user = get_user_by_id(db, to_user_id)
    if not target_user:
        raise NotFoundException("目标用户不存在")
    
    # 检查是否已是好友
    existing = get_friend_relation(db, current_user.id, to_user_id)
    if existing:
        raise BadRequestException("已经是好友")
    
    # 检查是否已有待处理的申请
    pending = db.query(FriendApplication).filter(
        FriendApplication.from_user_id == current_user.id,
        FriendApplication.to_user_id == to_user_id,
        FriendApplication.status == "pending"
    ).first()
    
    if pending:
        raise BadRequestException("已有待处理的申请")
    
    application = create_friend_application(db, current_user.id, to_user_id, message)
    logger.info(f"申请添加好友: from={current_user.id}, to={to_user_id}")


def get_friend_applications_service(db: Session, current_user: User) -> List[Dict]:
    """获取好友申请列表"""
    applications = get_user_friend_applications(db, current_user.id)
    
    result = []
    for app in applications:
        from_user = get_user_by_id(db, app.from_user_id)
        result.append({
            "id": app.id,
            "from_user": {
                "id": from_user.id,
                "username": from_user.username,
                "nickname": from_user.nickname,
                "avatar_file_id": from_user.avatar_file_id
            },
            "message": app.message,
            "created_at": app.created_at
        })
    
    return result


def accept_friend_application_service(db: Session, current_user: User, application_id: int):
    """接受好友申请"""
    success = accept_friend_application(db, application_id, current_user.id)
    if not success:
        raise NotFoundException("申请不存在")
    
    logger.info(f"接受好友申请: user_id={current_user.id}, application_id={application_id}")


def reject_friend_application_service(db: Session, current_user: User, application_id: int):
    """拒绝好友申请"""
    success = reject_friend_application(db, application_id, current_user.id)
    if not success:
        raise NotFoundException("申请不存在")


def delete_friend_service(db: Session, current_user: User, friend_user_id: int):
    """删除好友"""
    success = delete_friend_relation(db, current_user.id, friend_user_id)
    if not success:
        raise NotFoundException("好友关系不存在")
    
    logger.info(f"删除好友: user_id={current_user.id}, friend_id={friend_user_id}")