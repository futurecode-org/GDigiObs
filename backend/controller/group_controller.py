"""群组管理控制器"""
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from schema.group import (
    GroupCreate, GroupUpdate, GroupResponse, GroupMemberCreate,
    GroupWithMembersResponse, FriendApplicationCreate,
    FriendApplicationResponse, FriendWithUserInfoResponse,
    GroupAnnouncementCreate, GroupJoinApplicationCreate, GroupDifyAppCreate,
    GroupInvitationCreate, MuteMemberRequest
)
from core.response import ApiResponse
from core.dependencies import get_current_user
from service.group_service import (
    create_group_service, get_groups, get_group_detail,
    add_group_members_service, remove_group_member_service,
    leave_group_service, update_group_service, set_group_admin,
    transfer_group_owner, dissolve_group_service, get_friends_service, apply_friend_service,
    get_friend_applications_service, accept_friend_application_service,
    reject_friend_application_service, delete_friend_service,
    create_group_announcement_service, get_group_announcements_service,
    update_group_announcement_service, deactivate_group_announcement_service,
    apply_group_join_service, get_group_join_applications_service,
    get_user_group_join_applications_service, accept_group_join_application_service,
    reject_group_join_application_service, invite_to_group_service,
    get_user_group_invitations_service, accept_group_invitation_service,
    reject_group_invitation_service, mute_group_member_service,
    unmute_group_member_service, add_group_dify_app_service,
    remove_group_dify_app_service
)
from service.notification_service import send_notification_service
from dao.user_dao import get_user_by_id
from dao.conversation_dao import get_or_create_group_conversation, add_user_to_group_conversation

from model.user import User
from core.ws_manager import ws_manager


group_router = APIRouter(prefix="/groups", tags=["群组管理 Group"])


# ============== 群组管理 ==============

@group_router.post("", summary="创建群组")
def create_group(
    data: GroupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建群组
    
    - 创建者自动成为群主
    - 默认最大成员数为500
    """
    result = create_group_service(
        db, current_user, data.name, data.description, data.max_members
    )
    
    # 创建群组会话
    get_or_create_group_conversation(db, result["id"], current_user.tenant_id, current_user.id)
    
    return ApiResponse.success(data=result)


@group_router.get("", summary="获取群组列表")
def list_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户所在的所有群组
    """
    result = get_groups(db, current_user)
    return ApiResponse.success(data=result)


# 注意：/invitations 路由必须在 /{group_id} 之前定义，否则会被误匹配
@group_router.get("/invitations", summary="获取收到的群邀请")
def list_invitations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户收到的群邀请列表
    """
    result = get_user_group_invitations_service(db, current_user)
    return ApiResponse.success(data=result)


@group_router.post("/invitations/{invitation_id}/accept", summary="接受群邀请")
def accept_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    接受群邀请
    """
    accept_group_invitation_service(db, current_user, invitation_id)
    return ApiResponse.success(message="已接受群邀请")


@group_router.post("/invitations/{invitation_id}/reject", summary="拒绝群邀请")
def reject_invitation(
    invitation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    拒绝群邀请
    """
    reject_group_invitation_service(db, current_user, invitation_id)
    return ApiResponse.success(message="已拒绝群邀请")


# join-applications 路由也必须在 /{group_id} 之前
@group_router.get("/join-applications", summary="获取我的入群申请")
def list_my_join_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户的入群申请列表
    """
    result = get_user_group_join_applications_service(db, current_user)
    return ApiResponse.success(data=result)


@group_router.get("/{group_id}", summary="获取群组详情")
def get_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取群组详情
    
    - 包含成员列表
    - 包含当前用户角色
    """
    result = get_group_detail(db, current_user, group_id)
    return ApiResponse.success(data=result)


@group_router.post("/{group_id}/members", summary="添加群成员")
def add_members(
    group_id: int,
    data: GroupMemberCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    添加群成员
    
    - 只有群主和管理员可添加
    - 不能超过群人数上限
    """
    add_group_members_service(db, current_user, group_id, data.user_ids)
    return ApiResponse.success(message="成员已添加")


@group_router.post("/{group_id}/dify-apps", summary="添加 Dify 数字员工到群聊")
def add_dify_app_member(
    group_id: int,
    data: GroupDifyAppCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    添加已开启“用作数字员工”的 Dify App 到群聊。

    - 只有群主和管理员可添加
    - 无需入群申请，添加后可在群聊中通过 @名称 调用
    """
    result = add_group_dify_app_service(db, current_user, group_id, data.dify_app_id)
    return ApiResponse.success(message="数字员工已加入群聊", data=result)


@group_router.delete("/{group_id}/dify-apps/{dify_app_id}", summary="移除群聊 Dify 数字员工")
def remove_dify_app_member(
    group_id: int,
    dify_app_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    从群聊移除 Dify 数字员工。

    - 只有群主和管理员可移除
    - 移除后不可再通过 @名称 调用
    """
    remove_group_dify_app_service(db, current_user, group_id, dify_app_id)
    return ApiResponse.success(message="数字员工已移除")


@group_router.delete("/{group_id}/members/{user_id}", summary="移除群成员")
def remove_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    移除群成员
    
    - 只有群主和管理员可移除
    - 不能移除群主
    - 管理员不能移除其他管理员（除非群主操作）
    """
    remove_group_member_service(db, current_user, group_id, user_id)
    return ApiResponse.success(message="成员已移除")


@group_router.post("/{group_id}/leave", summary="退出群组")
def leave_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    退出群组
    
    - 群主不能退出，只能解散群组
    """
    leave_group_service(db, current_user, group_id)
    return ApiResponse.success(message="已退出群组")


@group_router.put("/{group_id}", summary="更新群组信息")
def update_group(
    group_id: int,
    data: GroupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新群组信息
    
    - 群主可修改所有信息
    - 管理员可修改部分信息
    """
    result = update_group_service(db, current_user, group_id, **data.model_dump(exclude_unset=True))
    return ApiResponse.success(data=result)


@group_router.put("/{group_id}/members/{user_id}/admin", summary="设置管理员")
def set_admin(
    group_id: int,
    user_id: int,
    is_admin: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    设置/取消群管理员
    
    - 只有群主能设置管理员
    - 不能设置群主自己
    """
    set_group_admin(db, current_user, group_id, user_id, is_admin)
    return ApiResponse.success(message="管理员设置已更新")


@group_router.post("/{group_id}/transfer-owner", summary="转让群主")
def transfer_owner(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    转让群主
    
    - 只有群主能转让群主
    - 目标用户必须是群成员
    """
    transfer_group_owner(db, current_user, group_id, user_id)
    return ApiResponse.success(message="群主转让成功")


@group_router.delete("/{group_id}", summary="解散群组")
def dissolve_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    解散群组
    
    - 只有群主能解散群组
    - 解散后所有成员将被移除
    """
    dissolve_group_service(db, current_user, group_id)
    return ApiResponse.success(message="群组已解散")


# ============== 群公告管理 ==============

@group_router.post("/{group_id}/announcements", summary="发布群公告")
def create_announcement(
    group_id: int,
    data: GroupAnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    发布群公告
    
    - 只有群主和管理员可以发布
    """
    result = create_group_announcement_service(db, current_user, group_id, data.content)
    return ApiResponse.success(data=result)


@group_router.get("/{group_id}/announcements", summary="获取群公告列表")
def list_announcements(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取群公告列表
    
    - 只有群成员可以查看
    """
    result = get_group_announcements_service(db, current_user, group_id)
    return ApiResponse.success(data=result)


@group_router.put("/announcements/{announcement_id}", summary="更新群公告")
def update_announcement(
    announcement_id: int,
    data: GroupAnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新群公告
    
    - 只有群主和管理员可以更新
    """
    update_group_announcement_service(db, current_user, announcement_id, data.content)
    return ApiResponse.success(message="公告已更新")


@group_router.delete("/announcements/{announcement_id}", summary="停用群公告")
def deactivate_announcement(
    announcement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    停用群公告
    
    - 只有群主和管理员可以停用
    """
    deactivate_group_announcement_service(db, current_user, announcement_id)
    return ApiResponse.success(message="公告已停用")


# ============== 入群申请管理 ==============

@group_router.post("/{group_id}/join-apply", summary="申请入群")
def apply_join(
    group_id: int,
    data: GroupJoinApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    申请入群
    
    - 非邀请制群组可申请入群
    - 已在群内或有待处理申请时不可重复申请
    """
    apply_group_join_service(db, current_user, group_id, data.message)
    return ApiResponse.success(message="入群申请已提交")


@group_router.get("/{group_id}/join-applications", summary="获取群的入群申请")
def list_join_applications(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取群的入群申请列表
    
    - 只有群主和管理员可以查看
    """
    result = get_group_join_applications_service(db, current_user, group_id)
    return ApiResponse.success(data=result)


@group_router.post("/join-applications/{application_id}/accept", summary="接受入群申请")
def accept_join_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    接受入群申请
    
    - 只有群主和管理员可以处理
    """
    accept_group_join_application_service(db, current_user, application_id)
    return ApiResponse.success(message="已接受入群申请")


@group_router.post("/join-applications/{application_id}/reject", summary="拒绝入群申请")
def reject_join_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    拒绝入群申请
    
    - 只有群主和管理员可以处理
    """
    reject_group_join_application_service(db, current_user, application_id)
    return ApiResponse.success(message="已拒绝入群申请")


# ============== 群邀请管理 ==============

@group_router.post("/{group_id}/invite", summary="邀请用户进群")
def invite_user(
    group_id: int,
    data: GroupInvitationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """
    邀请用户进群
    
    - 群成员可邀请（取决于群组设置）
    - 支持跨租户邀请（外部用户和内部员工可以加入同一群）
    """
    results = []
    for invitee_id in data.invitee_ids:
        result = invite_to_group_service(db, current_user, group_id, invitee_id, data.message)
        
        invitee = get_user_by_id(db, invitee_id)
        group = get_group_by_id(db, group_id)
        
        send_notification_service(
            db,
            invitee.tenant_id or 0,
            invitee_id,
            "group_invitation",
            "群邀请",
            f"{current_user.username} 邀请您加入群组「{group.name}」",
            {
                "invitation_id": result["id"],
                "group_id": group_id,
                "group_name": group.name,
                "inviter_id": current_user.id,
                "inviter_username": current_user.username
            }
        )
        
        if background_tasks:
            background_tasks.add_task(
                ws_manager.send_personal_message,
                invitee_id,
                "group.invitation.new",
                {
                    "invitation_id": result["id"],
                    "group_id": group_id,
                    "group_name": group.name,
                    "inviter_id": current_user.id,
                    "inviter_username": current_user.username,
                    "message": data.message
                }
            )
        
        results.append(result)
    return ApiResponse.success(data=results)


# ============== 群禁言管理 ==============

@group_router.post("/{group_id}/mute", summary="禁言群成员")
def mute_member(
    group_id: int,
    data: MuteMemberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    禁言群成员
    
    - 只有群主和管理员可以禁言
    - 不能禁言群主
    - 管理员不能禁言其他管理员（除非群主操作）
    """
    for user_id in data.user_ids:
        mute_group_member_service(db, current_user, group_id, user_id, data.mute_hours)
    return ApiResponse.success(message="成员已被禁言")


@group_router.post("/{group_id}/members/{user_id}/unmute", summary="解除群成员禁言")
def unmute_member(
    group_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    解除群成员禁言
    
    - 只有群主和管理员可以解除禁言
    """
    unmute_group_member_service(db, current_user, group_id, user_id)
    return ApiResponse.success(message="已解除禁言")


# ============== 好友管理 ==============

friend_router = APIRouter(prefix="/friends", tags=["好友管理 Friend"])


@friend_router.get("", summary="获取好友列表")
def list_friends(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取好友列表
    """
    result = get_friends_service(db, current_user)
    return ApiResponse.success(data=result)


@friend_router.post("/apply", summary="申请添加好友")
def apply_friend(
    data: FriendApplicationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    background_tasks: BackgroundTasks = None
):
    """
    申请添加好友
    
    - 外部用户和内部员工可互加好友，但必须双方同意
    - 如果双方同时发送申请，自动建立好友关系
    """
    application = apply_friend_service(db, current_user, data.to_user_id, data.message)
    
    # 获取被添加方信息
    to_user = get_user_by_id(db, data.to_user_id)
    
    # 创建数据库通知（保证不在线时也能收到）
    send_notification_service(
        db, 
        to_user.tenant_id or 0, 
        data.to_user_id,
        "friend_application",
        "好友申请",
        f"{current_user.username} 请求添加您为好友",
        {
            "application_id": application.id, 
            "from_user_id": current_user.id, 
            "from_username": current_user.username,
            "from_nickname": current_user.nickname or current_user.username,
            "from_role": current_user.user_type or "",
            "from_company": "",
            "message": data.message or ""
        }
    )
    
    # 通过WebSocket推送好友申请通知
    if background_tasks:
        background_tasks.add_task(
            ws_manager.send_personal_message,
            data.to_user_id,
            "friend.application.new",
            {"from_user_id": current_user.id, "from_username": current_user.username, "message": data.message}
        )
    
    return ApiResponse.success(message="好友申请已发送")


@friend_router.get("/applications", summary="获取好友申请列表")
def list_applications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取收到的好友申请列表
    """
    result = get_friend_applications_service(db, current_user)
    return ApiResponse.success(data=result)


@friend_router.post("/applications/{application_id}/accept", summary="接受好友申请")
def accept_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    接受好友申请
    """
    accept_friend_application_service(db, current_user, application_id)
    return ApiResponse.success(message="好友申请已接受")


@friend_router.post("/applications/{application_id}/reject", summary="拒绝好友申请")
def reject_application(
    application_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    拒绝好友申请
    """
    reject_friend_application_service(db, current_user, application_id)
    return ApiResponse.success(message="好友申请已拒绝")


@friend_router.delete("/{friend_user_id}", summary="删除好友")
def delete_friend(
    friend_user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    删除好友关系
    """
    delete_friend_service(db, current_user, friend_user_id)
    return ApiResponse.success(message="好友已删除")
