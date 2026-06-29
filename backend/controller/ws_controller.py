from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from core.ws_manager import ws_manager
from core.dependencies import get_user_from_token

ws_router = APIRouter(prefix="/ws", tags=["WebSocket"])


@ws_router.websocket("/im")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    user = await get_user_from_token(token)
    if not user:
        await websocket.close(code=1008)
        return
    
    await ws_manager.connect(websocket, user.id)
    
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)