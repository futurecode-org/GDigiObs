from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import json
import logging

from core.ws_manager import ws_manager
from core.dependencies import get_user_from_token

logger = logging.getLogger(__name__)

ws_router = APIRouter(prefix="/ws", tags=["WebSocket"])


@ws_router.websocket("/im")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    logger.info(f"WebSocket连接请求，token={token[:20]}...")
    user = await get_user_from_token(token)
    if not user:
        logger.warning("WebSocket连接失败：用户验证失败")
        await websocket.close(code=1008)
        return
    
    logger.info(f"用户 {user.id} ({user.username}) 建立WebSocket连接")
    await ws_manager.connect(websocket, user.id)
    
    try:
        while True:
            data = await websocket.receive_text()
            logger.info(f"收到WebSocket消息: {data[:100]}")
            # 处理心跳消息，忽略非事件消息
            try:
                msg = json.loads(data)
                if msg.get("type") == "heartbeat":
                    logger.info(f"收到用户 {user.id} 心跳")
                    continue
            except:
                pass
    except WebSocketDisconnect as e:
        logger.info(f"用户 {user.id} 断开WebSocket连接，code={e.code}")
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket异常: {e}")
        ws_manager.disconnect(websocket)