import json
import logging
from typing import Dict, List, Optional
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
        self.connection_user_map: Dict[str, int] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        self.connection_user_map[id(websocket)] = user_id
        logger.info(f"用户 {user_id} 建立WebSocket连接")

    def disconnect(self, websocket: WebSocket):
        user_id = self.connection_user_map.get(id(websocket))
        if user_id and user_id in self.active_connections:
            self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
            del self.connection_user_map[id(websocket)]
            logger.info(f"用户 {user_id} 断开WebSocket连接")

    async def send_personal_message(self, user_id: int, event: str, data: dict):
        message = json.dumps({"event": event, "data": data})
        if user_id in self.active_connections:
            for websocket in self.active_connections[user_id]:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    logger.error(f"发送消息给用户 {user_id} 失败: {e}")

    async def send_message_to_users(self, user_ids: List[int], event: str, data: dict):
        for user_id in user_ids:
            await self.send_personal_message(user_id, event, data)

    async def broadcast(self, event: str, data: dict):
        message = json.dumps({"event": event, "data": data})
        for user_id, connections in self.active_connections.items():
            for websocket in connections:
                try:
                    await websocket.send_text(message)
                except Exception as e:
                    logger.error(f"广播消息失败: {e}")


ws_manager = ConnectionManager()


async def broadcast_message_new(conversation_id: int, message_id: int, recipient_user_ids: List[int]):
    await ws_manager.send_message_to_users(
        recipient_user_ids,
        "message.new",
        {"conversation_id": conversation_id, "message_id": message_id}
    )


async def broadcast_message_recalled(message_id: int, recipient_user_ids: List[int]):
    await ws_manager.send_message_to_users(
        recipient_user_ids,
        "message.recalled",
        {"message_id": message_id}
    )


async def broadcast_message_read(conversation_id: int, user_id: int, recipient_user_ids: List[int]):
    await ws_manager.send_message_to_users(
        recipient_user_ids,
        "message.read",
        {"conversation_id": conversation_id, "user_id": user_id}
    )


async def broadcast_conversation_updated(conversation_id: int, recipient_user_ids: List[int]):
    await ws_manager.send_message_to_users(
        recipient_user_ids,
        "conversation.updated",
        {"conversation_id": conversation_id}
    )


async def broadcast_notification_new(notification_id: int, recipient_user_ids: List[int]):
    await ws_manager.send_message_to_users(
        recipient_user_ids,
        "notification.new",
        {"notification_id": notification_id}
    )


async def broadcast_agent_run_updated(agent_run_id: int, recipient_user_ids: List[int]):
    await ws_manager.send_message_to_users(
        recipient_user_ids,
        "agent.run.updated",
        {"agent_run_id": agent_run_id}
    )


async def broadcast_workflow_run_updated(workflow_run_id: int, recipient_user_ids: List[int]):
    await ws_manager.send_message_to_users(
        recipient_user_ids,
        "workflow.run.updated",
        {"workflow_run_id": workflow_run_id}
    )