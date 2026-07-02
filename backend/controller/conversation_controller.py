"""会话管理控制器"""
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from database.session import get_db
from schema.conversation import (
    ConversationCreate, ConversationResponse, ConversationMemberResponse,
    MessageCreate, MessageResponse, ConversationWithMembersResponse
)
from core.response import ApiResponse
from core.dependencies import get_current_user
from service.conversation_service import (
    create_direct_conversation, get_conversations, get_conversation_detail,
    send_message, get_messages, mark_as_read, recall_message_service,
    update_conversation_settings, process_dify_employee_replies
)
from core.ws_manager import broadcast_message_new, broadcast_message_recalled, broadcast_message_read, broadcast_conversation_updated

from model.user import User


conversation_router = APIRouter(prefix="/conversations", tags=["会话管理 Conversation"])


@conversation_router.post("", summary="创建会话")
def create_conversation(
    data: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    创建单聊会话
    
    - 如果会话已存在，返回现有会话
    - 如果会话不存在，创建新会话
    """
    result = create_direct_conversation(db, current_user, data.target_user_id)
    return ApiResponse.success(data=result)


@conversation_router.get("", summary="获取会话列表")
def list_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取用户的所有会话列表
    
    - 按最近消息时间排序
    - 包含未读消息数
    """
    result = get_conversations(db, current_user)
    return ApiResponse.success(data=result)


@conversation_router.get("/{conversation_id}", summary="获取会话详情")
def get_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取会话详情
    
    - 包含成员信息
    - 包含当前用户未读数
    """
    result = get_conversation_detail(db, current_user, conversation_id)
    return ApiResponse.success(data=result)


@conversation_router.post("/{conversation_id}/messages", summary="发送消息")
async def send_message_endpoint(
    conversation_id: int,
    data: MessageCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    发送消息
    
    - 支持文本、图片、文件等多种消息类型
    - 消息审计将在后台异步进行
    """
    result = send_message(
        db, current_user, conversation_id,
        data.message_type, data.content, data.file_id
    )
    
    # 被拦截的高风险消息不广播
    if result.get("audit_status") != "blocked":
        # 通过BackgroundTasks异步推送WebSocket消息
        recipient_user_ids = result.pop("recipient_user_ids", [])
        # 构建完整的消息数据用于WebSocket推送
        message_data = {
            "id": result["id"],
            "conversation_id": conversation_id,
            "sender_id": current_user.id,
            "sender_type": result.get("sender_type", "user"),
            "sender_display_name": result.get("sender_display_name"),
            "sender_name": current_user.nickname or current_user.username,
            "message_type": result["message_type"],
            "content": result["content"],
            "file_id": result.get("file_id"),
            "created_at": result["created_at"].isoformat() if result["created_at"] else None,
            "recalled_at": None,
            "recalled": False
        }
        background_tasks.add_task(
            broadcast_message_new, conversation_id, message_data, recipient_user_ids
        )
        background_tasks.add_task(
            broadcast_conversation_updated, conversation_id, recipient_user_ids
        )
        if data.message_type == "text" and data.content:
            background_tasks.add_task(
                process_dify_employee_replies,
                db,
                current_user,
                conversation_id,
                data.content,
                recipient_user_ids,
            )
    
    return ApiResponse.success(data=result)


@conversation_router.get("/{conversation_id}/messages", summary="获取消息列表")
def get_messages_endpoint(
    conversation_id: int,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    获取会话消息列表
    
    - 按时间倒序排列
    - 支持分页
    """
    result = get_messages(db, current_user, conversation_id, page, page_size)
    return ApiResponse.success(data=result)


@conversation_router.post("/{conversation_id}/read", summary="标记已读")
def mark_read(
    conversation_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    标记会话消息为已读
    
    - 清除未读计数
    - 更新最后已读消息ID
    """
    result = mark_as_read(db, current_user, conversation_id)
    
    # 通过BackgroundTasks异步推送WebSocket消息
    background_tasks.add_task(
        broadcast_message_read, conversation_id, result["user_id"], result["recipient_user_ids"]
    )
    
    return ApiResponse.success(message="已标记为已读")


@conversation_router.post("/messages/{message_id}/recall", summary="撤回消息")
def recall_message_endpoint(
    message_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    撤回消息
    
    - 只能撤回自己发送的消息
    - 撤回时间限制为2分钟
    """
    result = recall_message_service(db, current_user, message_id)
    
    # 通过BackgroundTasks异步推送WebSocket消息
    background_tasks.add_task(
        broadcast_message_recalled, result["message_id"], result["recipient_user_ids"]
    )
    
    return ApiResponse.success(message="消息已撤回")


@conversation_router.put("/{conversation_id}/settings", summary="更新会话设置")
def update_settings(
    conversation_id: int,
    pinned: bool = None,
    muted: bool = None,
    hidden: bool = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    更新会话设置
    
    - pinned: 置顶会话
    - muted: 免打扰
    - hidden: 隐藏会话
    """
    update_conversation_settings(db, current_user, conversation_id, pinned, muted, hidden)
    return ApiResponse.success(message="设置已更新")
