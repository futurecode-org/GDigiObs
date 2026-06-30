"""群组管理数据访问层"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc
from typing import List, Optional
from datetime import datetime, timedelta

from model.group import Group, GroupMember, FriendRelation, FriendApplication, GroupAnnouncement, GroupJoinApplication, GroupInvitation
from model.user import User


def create_group(db: Session, tenant_id: int, name: str, owner_id: int, 
                 description: str = None, max_members: int = 500) -> Group:
    """创建群组"""
    group = Group(
        tenant_id=tenant_id,
        name=name,
        owner_id=owner_id,
        description=description,
        max_members=max_members
    )
    db.add(group)
    db.flush()
    
    # 添加群主为成员
    member = GroupMember(
        group_id=group.id,
        user_id=owner_id,
        role="owner",
        joined_at=datetime.now()
    )
    db.add(member)
    db.commit()
    
    return group


def get_group_by_id(db: Session, group_id: int) -> Optional[Group]:
    """获取群组详情"""
    return db.query(Group).filter(Group.id == group_id).first()


def get_user_groups(db: Session, user_id: int, tenant_id: int) -> List[Group]:
    """获取用户所在的所有群组"""
    groups = db.query(Group).join(GroupMember).filter(
        Group.tenant_id == tenant_id,
        GroupMember.user_id == user_id,
        GroupMember.status == "normal"
    ).all()
    return groups


def get_group_members(db: Session, group_id: int) -> List[GroupMember]:
    """获取群成员列表"""
    return db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.status == "normal"
    ).all()


def is_group_member(db: Session, group_id: int, user_id: int) -> bool:
    """检查用户是否是群成员"""
    member = db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id,
        GroupMember.status == "normal"
    ).first()
    return member is not None


def get_group_member(db: Session, group_id: int, user_id: int) -> Optional[GroupMember]:
    """获取用户在群中的成员信息"""
    return db.query(GroupMember).filter(
        GroupMember.group_id == group_id,
        GroupMember.user_id == user_id
    ).first()


def add_group_member(db: Session, group_id: int, user_id: int, role: str = "member") -> GroupMember:
    """添加群成员"""
    # 检查群人数限制
    group = get_group_by_id(db, group_id)
    if not group:
        return None
    
    current_count = len(get_group_members(db, group_id))
    if current_count >= group.max_members:
        return None
    
    member = GroupMember(
        group_id=group_id,
        user_id=user_id,
        role=role,
        joined_at=datetime.now()
    )
    db.add(member)
    db.commit()
    return member


def remove_group_member(db: Session, group_id: int, user_id: int) -> bool:
    """移除群成员"""
    member = get_group_member(db, group_id, user_id)
    if not member:
        return False
    
    member.status = "removed"
    db.commit()
    return True


def leave_group(db: Session, group_id: int, user_id: int) -> bool:
    """退出群组"""
    member = get_group_member(db, group_id, user_id)
    if not member:
        return False
    
    # 群主不能退出
    if member.role == "owner":
        return False
    
    member.status = "left"
    db.commit()
    return True


def update_group_member_role(db: Session, group_id: int, user_id: int, role: str) -> bool:
    """更新群成员角色"""
    member = get_group_member(db, group_id, user_id)
    if not member:
        return False
    
    member.role = role
    db.commit()
    return True


def update_group_info(db: Session, group_id: int, **kwargs) -> Group:
    """更新群组信息"""
    group = get_group_by_id(db, group_id)
    if not group:
        return None
    
    for key, value in kwargs.items():
        if hasattr(group, key):
            setattr(group, key, value)
    
    db.commit()
    return group


def dissolve_group(db: Session, group_id: int) -> bool:
    """解散群组"""
    group = get_group_by_id(db, group_id)
    if not group:
        return False
    
    group.status = "dissolved"
    # 更新所有成员状态
    members = get_group_members(db, group_id)
    for member in members:
        member.status = "removed"
    
    db.commit()
    return True


# 好友关系管理
def get_friend_relation(db: Session, user_id: int, friend_user_id: int) -> Optional[FriendRelation]:
    """获取好友关系"""
    return db.query(FriendRelation).filter(
        FriendRelation.user_id == user_id,
        FriendRelation.friend_user_id == friend_user_id,
        FriendRelation.status == "normal"
    ).first()


def get_user_friends(db: Session, user_id: int) -> List[FriendRelation]:
    """获取用户好友列表"""
    return db.query(FriendRelation).filter(
        FriendRelation.user_id == user_id,
        FriendRelation.status == "normal"
    ).all()


def create_friend_relation(db: Session, tenant_id: int, user_id: int, 
                           friend_user_id: int, remark: str = None) -> FriendRelation:
    """创建好友关系"""
    relation = FriendRelation(
        tenant_id=tenant_id,
        user_id=user_id,
        friend_user_id=friend_user_id,
        remark=remark
    )
    db.add(relation)
    db.commit()
    return relation


def delete_friend_relation(db: Session, user_id: int, friend_user_id: int) -> bool:
    """删除好友关系"""
    relation = get_friend_relation(db, user_id, friend_user_id)
    if not relation:
        return False
    
    relation.status = "deleted"
    # 同时删除对方的关系
    reverse = get_friend_relation(db, friend_user_id, user_id)
    if reverse:
        reverse.status = "deleted"
    
    db.commit()
    return True


# 好友申请管理
def create_friend_application(db: Session, from_user_id: int, to_user_id: int, 
                               message: str = None) -> FriendApplication:
    """创建好友申请"""
    application = FriendApplication(
        from_user_id=from_user_id,
        to_user_id=to_user_id,
        message=message
    )
    db.add(application)
    db.commit()
    return application


def get_friend_application(db: Session, application_id: int) -> Optional[FriendApplication]:
    """获取好友申请详情"""
    return db.query(FriendApplication).filter(
        FriendApplication.id == application_id
    ).first()


def get_user_friend_applications(db: Session, user_id: int) -> List[FriendApplication]:
    """获取用户收到的好友申请"""
    return db.query(FriendApplication).filter(
        FriendApplication.to_user_id == user_id,
        FriendApplication.status == "pending"
    ).order_by(desc(FriendApplication.created_at)).all()


def accept_friend_application(db: Session, application_id: int, user_id: int) -> bool:
    """接受好友申请"""
    application = get_friend_application(db, application_id)
    if not application or application.to_user_id != user_id:
        return False
    
    application.status = "accepted"
    application.handled_at = datetime.now()
    
    # 创建好友关系
    # 获取申请人租户ID
    from_user = db.query(User).filter(User.id == application.from_user_id).first()
    create_friend_relation(db, from_user.tenant_id, application.from_user_id, application.to_user_id)
    create_friend_relation(db, from_user.tenant_id, application.to_user_id, application.from_user_id)
    
    db.commit()
    return True


def reject_friend_application(db: Session, application_id: int, user_id: int) -> bool:
    """拒绝好友申请"""
    application = get_friend_application(db, application_id)
    if not application or application.to_user_id != user_id:
        return False
    
    application.status = "rejected"
    application.handled_at = datetime.now()
    db.commit()
    return True


# 群公告管理
def create_group_announcement(db: Session, group_id: int, content: str, creator_id: int) -> GroupAnnouncement:
    """创建群公告"""
    announcement = GroupAnnouncement(
        group_id=group_id,
        content=content,
        creator_id=creator_id
    )
    db.add(announcement)
    db.commit()
    return announcement


def get_group_announcements(db: Session, group_id: int) -> List[GroupAnnouncement]:
    """获取群公告列表"""
    return db.query(GroupAnnouncement).filter(
        GroupAnnouncement.group_id == group_id,
        GroupAnnouncement.status == "active"
    ).order_by(desc(GroupAnnouncement.created_at)).all()


def get_group_announcement(db: Session, announcement_id: int) -> Optional[GroupAnnouncement]:
    """获取群公告详情"""
    return db.query(GroupAnnouncement).filter(
        GroupAnnouncement.id == announcement_id
    ).first()


def update_group_announcement(db: Session, announcement_id: int, content: str) -> bool:
    """更新群公告"""
    announcement = get_group_announcement(db, announcement_id)
    if not announcement:
        return False
    
    announcement.content = content
    db.commit()
    return True


def deactivate_group_announcement(db: Session, announcement_id: int) -> bool:
    """停用群公告"""
    announcement = get_group_announcement(db, announcement_id)
    if not announcement:
        return False
    
    announcement.status = "inactive"
    db.commit()
    return True


# 入群申请管理
def create_group_join_application(db: Session, group_id: int, user_id: int, message: str = None) -> GroupJoinApplication:
    """创建入群申请"""
    application = GroupJoinApplication(
        group_id=group_id,
        user_id=user_id,
        message=message
    )
    db.add(application)
    db.commit()
    return application


def get_group_join_applications(db: Session, group_id: int, status: str = None) -> List[GroupJoinApplication]:
    """获取群的入群申请列表"""
    query = db.query(GroupJoinApplication).filter(
        GroupJoinApplication.group_id == group_id
    )
    if status:
        query = query.filter(GroupJoinApplication.status == status)
    return query.order_by(desc(GroupJoinApplication.created_at)).all()


def get_user_group_join_applications(db: Session, user_id: int) -> List[GroupJoinApplication]:
    """获取用户的入群申请列表"""
    return db.query(GroupJoinApplication).filter(
        GroupJoinApplication.user_id == user_id
    ).order_by(desc(GroupJoinApplication.created_at)).all()


def get_group_join_application(db: Session, application_id: int) -> Optional[GroupJoinApplication]:
    """获取入群申请详情"""
    return db.query(GroupJoinApplication).filter(
        GroupJoinApplication.id == application_id
    ).first()


def accept_group_join_application(db: Session, application_id: int, handled_by: int) -> bool:
    """接受入群申请"""
    application = get_group_join_application(db, application_id)
    if not application or application.status != "pending":
        return False
    
    application.status = "accepted"
    application.handled_by = handled_by
    application.handled_at = datetime.now()
    
    add_group_member(db, application.group_id, application.user_id)
    
    db.commit()
    return True


def reject_group_join_application(db: Session, application_id: int, handled_by: int) -> bool:
    """拒绝入群申请"""
    application = get_group_join_application(db, application_id)
    if not application or application.status != "pending":
        return False
    
    application.status = "rejected"
    application.handled_by = handled_by
    application.handled_at = datetime.now()
    db.commit()
    return True


# 群邀请管理
def create_group_invitation(db: Session, group_id: int, inviter_id: int, invitee_id: int, 
                            message: str = None, expires_in_hours: int = 24) -> GroupInvitation:
    """创建群邀请"""
    invitation = GroupInvitation(
        group_id=group_id,
        inviter_id=inviter_id,
        invitee_id=invitee_id,
        message=message,
        expires_at=datetime.now().replace(microsecond=0) + timedelta(hours=expires_in_hours)
    )
    db.add(invitation)
    db.commit()
    return invitation


def get_group_invitations(db: Session, group_id: int) -> List[GroupInvitation]:
    """获取群的邀请列表"""
    return db.query(GroupInvitation).filter(
        GroupInvitation.group_id == group_id
    ).order_by(desc(GroupInvitation.created_at)).all()


def get_user_group_invitations(db: Session, user_id: int) -> List[GroupInvitation]:
    """获取用户收到的群邀请"""
    now = datetime.now()
    return db.query(GroupInvitation).filter(
        GroupInvitation.invitee_id == user_id,
        GroupInvitation.status == "pending",
        or_(GroupInvitation.expires_at.is_(None), GroupInvitation.expires_at > now)
    ).order_by(desc(GroupInvitation.created_at)).all()


def get_group_invitation(db: Session, invitation_id: int) -> Optional[GroupInvitation]:
    """获取群邀请详情"""
    return db.query(GroupInvitation).filter(
        GroupInvitation.id == invitation_id
    ).first()


def accept_group_invitation(db: Session, invitation_id: int, user_id: int) -> bool:
    """接受群邀请"""
    invitation = get_group_invitation(db, invitation_id)
    if not invitation or invitation.status != "pending" or invitation.invitee_id != user_id:
        return False
    
    now = datetime.now()
    if invitation.expires_at and invitation.expires_at <= now:
        invitation.status = "expired"
        db.commit()
        return False
    
    invitation.status = "accepted"
    invitation.accepted_at = now
    
    add_group_member(db, invitation.group_id, user_id)
    
    # 将用户添加到群组会话
    from dao.conversation_dao import add_user_to_group_conversation
    add_user_to_group_conversation(db, invitation.group_id, user_id)
    
    db.commit()
    return True


def reject_group_invitation(db: Session, invitation_id: int, user_id: int) -> bool:
    """拒绝群邀请"""
    invitation = get_group_invitation(db, invitation_id)
    if not invitation or invitation.status != "pending" or invitation.invitee_id != user_id:
        return False
    
    invitation.status = "rejected"
    db.commit()
    return True


def expire_group_invitation(db: Session, invitation_id: int) -> bool:
    """过期群邀请"""
    invitation = get_group_invitation(db, invitation_id)
    if not invitation:
        return False
    
    invitation.status = "expired"
    db.commit()
    return True


# 群禁言管理
def mute_group_member(db: Session, group_id: int, user_id: int, mute_hours: int) -> bool:
    """禁言群成员"""
    member = get_group_member(db, group_id, user_id)
    if not member:
        return False
    
    member.muted_until = datetime.now() + timedelta(hours=mute_hours)
    db.commit()
    return True


def unmute_group_member(db: Session, group_id: int, user_id: int) -> bool:
    """解除群成员禁言"""
    member = get_group_member(db, group_id, user_id)
    if not member:
        return False
    
    member.muted_until = None
    db.commit()
    return True


def is_group_member_muted(db: Session, group_id: int, user_id: int) -> bool:
    """检查群成员是否被禁言"""
    member = get_group_member(db, group_id, user_id)
    if not member or not member.muted_until:
        return False
    
    return member.muted_until > datetime.now()