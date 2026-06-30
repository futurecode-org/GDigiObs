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
    get_user_friend_applications, accept_friend_application, reject_friend_application,
    create_group_announcement, get_group_announcements, get_group_announcement,
    update_group_announcement, deactivate_group_announcement,
    create_group_join_application, get_group_join_applications, get_user_group_join_applications,
    get_group_join_application, accept_group_join_application, reject_group_join_application,
    create_group_invitation, get_group_invitations, get_user_group_invitations,
    get_group_invitation, accept_group_invitation, reject_group_invitation,
    mute_group_member, unmute_group_member, is_group_member_muted
)
from model.group import FriendApplication
from dao.user_dao import get_user_by_id
from core.exceptions import NotFoundException, ForbiddenException, BadRequestException
from model.user import User
from service.notification_service import send_notification_service
from model.group import Group, GroupJoinApplication, GroupInvitation
from core.ws_manager import ws_manager

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
            "description": group.description,
            "max_members": group.max_members,
            "member_count": member_count,
            "status": group.status,
            "created_by": group.owner_id,
            "created_at": group.created_at.isoformat() if group.created_at else None,
            "updated_at": group.updated_at.isoformat() if group.updated_at else None
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
            "id": member.id,
            "group_id": member.group_id,
            "user_id": user.id,
            "username": user.username,
            "nickname": user.nickname,
            "avatar_file_id": user.avatar_file_id,
            "role": member.role,
            "joined_at": member.joined_at.isoformat() if member.joined_at else None,
            "muted_until": member.muted_until.isoformat() if member.muted_until else None
        })
    
    # 获取当前用户角色
    current_member = get_group_member(db, group_id, current_user.id)
    role = current_member.role if current_member else None
    
    return {
        "id": group.id,
        "name": group.name,
        "avatar_file_id": group.avatar_file_id,
        "description": group.description,
        "max_members": group.max_members,
        "member_count": len(members),
        "status": group.status,
        "created_by": group.owner_id,
        "members": member_info,
        "created_at": group.created_at.isoformat() if group.created_at else None,
        "updated_at": group.updated_at.isoformat() if group.updated_at else None
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


def apply_friend_service(db: Session, current_user: User, to_user_id: int, message: str = None) -> FriendApplication:
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
    return application


def get_friend_applications_service(db: Session, current_user: User) -> List[Dict]:
    """获取好友申请列表"""
    applications = get_user_friend_applications(db, current_user.id)
    
    result = []
    for app in applications:
        from_user = get_user_by_id(db, app.from_user_id)
        result.append({
            "id": app.id,
            "from_user_id": app.from_user_id,
            "to_user_id": app.to_user_id,
            "message": app.message,
            "status": app.status,
            "from_user": {
                "id": from_user.id,
                "username": from_user.username,
                "nickname": from_user.nickname,
                "avatar_file_id": from_user.avatar_file_id
            },
            "from_nickname": from_user.nickname or from_user.username,
            "from_username": from_user.username,
            "from_role": from_user.user_type or "",
            "from_company": "",
            "type": "friend",
            "created_at": app.created_at,
            "updated_at": app.created_at
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


# 群公告服务
def create_group_announcement_service(db: Session, current_user: User, group_id: int, content: str):
    """创建群公告"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    current_member = get_group_member(db, group_id, current_user.id)
    if not current_member or current_member.role not in ["owner", "admin"]:
        raise ForbiddenException("只有群主和管理员可以发布公告")
    
    announcement = create_group_announcement(db, group_id, content, current_user.id)
    logger.info(f"创建群公告: group_id={group_id}, creator_id={current_user.id}")
    return {
        "id": announcement.id,
        "content": announcement.content,
        "creator_id": announcement.creator_id,
        "created_at": announcement.created_at
    }


def get_group_announcements_service(db: Session, current_user: User, group_id: int) -> List[Dict]:
    """获取群公告列表"""
    if not is_group_member(db, group_id, current_user.id):
        raise ForbiddenException("无权访问此群组")
    
    announcements = get_group_announcements(db, group_id)
    result = []
    for announcement in announcements:
        creator = get_user_by_id(db, announcement.creator_id)
        result.append({
            "id": announcement.id,
            "content": announcement.content,
            "status": announcement.status,
            "creator": {
                "id": creator.id,
                "username": creator.username,
                "nickname": creator.nickname
            },
            "created_at": announcement.created_at.isoformat() if announcement.created_at else None
        })
    return result


def update_group_announcement_service(db: Session, current_user: User, announcement_id: int, content: str):
    """更新群公告"""
    announcement = get_group_announcement(db, announcement_id)
    if not announcement:
        raise NotFoundException("公告不存在")
    
    current_member = get_group_member(db, announcement.group_id, current_user.id)
    if not current_member or current_member.role not in ["owner", "admin"]:
        raise ForbiddenException("只有群主和管理员可以更新公告")
    
    success = update_group_announcement(db, announcement_id, content)
    if not success:
        raise NotFoundException("公告不存在")
    
    logger.info(f"更新群公告: announcement_id={announcement_id}")


def deactivate_group_announcement_service(db: Session, current_user: User, announcement_id: int):
    """停用群公告"""
    announcement = get_group_announcement(db, announcement_id)
    if not announcement:
        raise NotFoundException("公告不存在")
    
    current_member = get_group_member(db, announcement.group_id, current_user.id)
    if not current_member or current_member.role not in ["owner", "admin"]:
        raise ForbiddenException("只有群主和管理员可以停用公告")
    
    success = deactivate_group_announcement(db, announcement_id)
    if not success:
        raise NotFoundException("公告不存在")
    
    logger.info(f"停用群公告: announcement_id={announcement_id}")


# 入群申请服务
def apply_group_join_service(db: Session, current_user: User, group_id: int, message: str = None):
    """申请入群"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    if group.status != "normal":
        raise ForbiddenException("群组状态异常")
    
    if is_group_member(db, group_id, current_user.id):
        raise BadRequestException("已是群成员")
    
    if group.join_mode == "invite_only":
        raise ForbiddenException("该群组只允许邀请入群")
    
    existing = db.query(GroupJoinApplication).filter(
        GroupJoinApplication.group_id == group_id,
        GroupJoinApplication.user_id == current_user.id,
        GroupJoinApplication.status == "pending"
    ).first()
    if existing:
        raise BadRequestException("已有待处理的入群申请")
    
    create_group_join_application(db, group_id, current_user.id, message)
    logger.info(f"申请入群: user_id={current_user.id}, group_id={group_id}")


def get_group_join_applications_service(db: Session, current_user: User, group_id: int) -> List[Dict]:
    """获取群的入群申请列表"""
    current_member = get_group_member(db, group_id, current_user.id)
    if not current_member or current_member.role not in ["owner", "admin"]:
        raise ForbiddenException("只有群主和管理员可以查看入群申请")
    
    applications = get_group_join_applications(db, group_id, "pending")
    result = []
    for app in applications:
        user = get_user_by_id(db, app.user_id)
        result.append({
            "id": app.id,
            "user": {
                "id": user.id,
                "username": user.username,
                "nickname": user.nickname,
                "avatar_file_id": user.avatar_file_id
            },
            "message": app.message,
            "created_at": app.created_at
        })
    return result


def get_user_group_join_applications_service(db: Session, current_user: User) -> List[Dict]:
    """获取用户的入群申请列表"""
    applications = get_user_group_join_applications(db, current_user.id)
    result = []
    for app in applications:
        group = get_group_by_id(db, app.group_id)
        if group:
            result.append({
                "id": app.id,
                "group": {
                    "id": group.id,
                    "name": group.name,
                    "avatar_file_id": group.avatar_file_id
                },
                "message": app.message,
                "status": app.status,
                "created_at": app.created_at,
                "handled_at": app.handled_at
            })
    return result


def accept_group_join_application_service(db: Session, current_user: User, application_id: int):
    """接受入群申请"""
    application = get_group_join_application(db, application_id)
    if not application:
        raise NotFoundException("申请不存在")
    
    current_member = get_group_member(db, application.group_id, current_user.id)
    if not current_member or current_member.role not in ["owner", "admin"]:
        raise ForbiddenException("只有群主和管理员可以处理入群申请")
    
    success = accept_group_join_application(db, application_id, current_user.id)
    if not success:
        raise BadRequestException("申请状态异常")
    
    logger.info(f"接受入群申请: application_id={application_id}")


def reject_group_join_application_service(db: Session, current_user: User, application_id: int):
    """拒绝入群申请"""
    application = get_group_join_application(db, application_id)
    if not application:
        raise NotFoundException("申请不存在")
    
    current_member = get_group_member(db, application.group_id, current_user.id)
    if not current_member or current_member.role not in ["owner", "admin"]:
        raise ForbiddenException("只有群主和管理员可以处理入群申请")
    
    success = reject_group_join_application(db, application_id, current_user.id)
    if not success:
        raise BadRequestException("申请状态异常")
    
    logger.info(f"拒绝入群申请: application_id={application_id}")


# 群邀请服务
def invite_to_group_service(db: Session, current_user: User, group_id: int, invitee_id: int, message: str = None):
    """邀请用户进群"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    current_member = get_group_member(db, group_id, current_user.id)
    if not current_member:
        raise ForbiddenException("不是群成员")
    
    if current_member.role not in ["owner", "admin"] and not group.allow_member_invite:
        raise ForbiddenException("群组不允许成员邀请")
    
    invitee = get_user_by_id(db, invitee_id)
    if not invitee:
        raise NotFoundException("被邀请用户不存在")
    
    if is_group_member(db, group_id, invitee_id):
        raise BadRequestException("已是群成员")
    
    existing = db.query(GroupInvitation).filter(
        GroupInvitation.group_id == group_id,
        GroupInvitation.invitee_id == invitee_id,
        GroupInvitation.status == "pending"
    ).first()
    if existing:
        raise BadRequestException("已有待处理的邀请")
    
    invitation = create_group_invitation(db, group_id, current_user.id, invitee_id, message)
    logger.info(f"邀请进群: inviter_id={current_user.id}, invitee_id={invitee_id}, group_id={group_id}")
    
    return {
        "id": invitation.id,
        "expires_at": invitation.expires_at
    }


def get_user_group_invitations_service(db: Session, current_user: User) -> List[Dict]:
    """获取用户收到的群邀请"""
    invitations = get_user_group_invitations(db, current_user.id)
    result = []
    for invite in invitations:
        if not invite:
            continue
        group = get_group_by_id(db, invite.group_id)
        inviter = get_user_by_id(db, invite.inviter_id)
        if group and inviter:
            result.append({
                "id": invite.id,
                "tenant_id": group.tenant_id or 0,
                "group_id": invite.group_id,
                "inviter_id": invite.inviter_id,
                "invitee_id": invite.invitee_id,
                "message": invite.message or "",
                "status": invite.status or "pending",
                "expires_at": invite.expires_at.isoformat() if invite.expires_at else None,
                "accepted_at": invite.accepted_at.isoformat() if invite.accepted_at else None,
                "created_at": invite.created_at.isoformat() if invite.created_at else None,
                "group_name": group.name or "",
                "inviter_name": (inviter.nickname or inviter.username) if inviter else ""
            })
    return result


def accept_group_invitation_service(db: Session, current_user: User, invitation_id: int):
    """接受群邀请"""
    success = accept_group_invitation(db, invitation_id, current_user.id)
    if not success:
        raise BadRequestException("邀请不存在或已过期")
    
    logger.info(f"接受群邀请: user_id={current_user.id}, invitation_id={invitation_id}")


def reject_group_invitation_service(db: Session, current_user: User, invitation_id: int):
    """拒绝群邀请"""
    success = reject_group_invitation(db, invitation_id, current_user.id)
    if not success:
        raise NotFoundException("邀请不存在")
    
    logger.info(f"拒绝群邀请: user_id={current_user.id}, invitation_id={invitation_id}")


# 群禁言服务
def mute_group_member_service(db: Session, current_user: User, group_id: int, user_id: int, mute_hours: int):
    """禁言群成员"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    current_member = get_group_member(db, group_id, current_user.id)
    if not current_member or current_member.role not in ["owner", "admin"]:
        raise ForbiddenException("只有群主和管理员可以禁言成员")
    
    target_member = get_group_member(db, group_id, user_id)
    if not target_member:
        raise NotFoundException("成员不存在")
    
    if target_member.role == "owner":
        raise ForbiddenException("不能禁言群主")
    
    success = mute_group_member(db, group_id, user_id, mute_hours)
    if not success:
        raise NotFoundException("成员不存在")
    
    logger.info(f"禁言群成员: group_id={group_id}, user_id={user_id}, mute_hours={mute_hours}")


def unmute_group_member_service(db: Session, current_user: User, group_id: int, user_id: int):
    """解除群成员禁言"""
    group = get_group_by_id(db, group_id)
    if not group:
        raise NotFoundException("群组不存在")
    
    current_member = get_group_member(db, group_id, current_user.id)
    if not current_member or current_member.role not in ["owner", "admin"]:
        raise ForbiddenException("只有群主和管理员可以解除禁言")
    
    success = unmute_group_member(db, group_id, user_id)
    if not success:
        raise NotFoundException("成员不存在")
    
    logger.info(f"解除群成员禁言: group_id={group_id}, user_id={user_id}")