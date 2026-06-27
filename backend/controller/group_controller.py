"""群组管理控制器"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from schema.group import (
    GroupCreate, GroupUpdate, GroupResponse, GroupMemberCreate,
    GroupWithMembersResponse, FriendApplicationCreate,
    FriendApplicationResponse, FriendWithUserInfoResponse
)
from core.response import ApiResponse
from core.dependencies import get_current_user
from service.group_service import (
    create_group_service, get_groups, get_group_detail,
    add_group_members_service, remove_group_member_service,
    leave_group_service, update_group_service, set_group_admin,
    dissolve_group_service, get_friends_service, apply_friend_service,
    get_friend_applications_service, accept_friend_application_service,
    reject_friend_application_service, delete_friend_service
)

from model.user import User


group_router = APIRouter(prefix="/groups", tags=["群组管理 Group"])


# 群组管理
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
    """
    set_group_admin(db, current_user, group_id, user_id, is_admin)
    return ApiResponse.success(message="管理员设置已更新")


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


# 好友管理
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
    current_user: User = Depends(get_current_user)
):
    """
    申请添加好友
    """
    apply_friend_service(db, current_user, data.to_user_id, data.message)
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