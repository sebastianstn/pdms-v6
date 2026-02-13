"""WebSocket: live alarm stream — broadcasts new alarms to all connected clients."""

import json
import logging
from typing import Any

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from src.api.websocket.ws_auth import authenticate_websocket

logger = logging.getLogger("pdms.ws.alarms")

router = APIRouter()

# In-memory connection store (in Produktion: Redis/Valkey PubSub)
_alarm_connections: list[WebSocket] = []


@router.websocket("/ws/alarms")
async def alarm_stream(websocket: WebSocket, token: str | None = Query(None)):
    """WebSocket-Endpoint: Echtzeit-Alarm-Stream.

    Authentifizierung via Query-Parameter: ws://host/ws/alarms?token=<JWT>
    In Development ohne Token: Dev-User wird verwendet.
    """
    user = await authenticate_websocket(websocket, token)
    if user is None:
        return  # Connection was rejected

    _alarm_connections.append(websocket)
    client = websocket.client
    logger.info("🔌 Alarm-WS verbunden: %s (user=%s)", client, user.get("preferred_username"))

    try:
        while True:
            # Client kann Filter senden (z.B. {"patient_id": "..."})
            # oder einfach keepalive-Pings
            data = await websocket.receive_text()
            # Ping/Pong für Keepalive
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        logger.info("🔌 Alarm-WS getrennt: %s", client)
    finally:
        if websocket in _alarm_connections:
            _alarm_connections.remove(websocket)


async def broadcast_alarm(event: dict[str, Any]) -> None:
    """Sendet ein Alarm-Event an alle verbundenen WebSocket-Clients."""
    if not _alarm_connections:
        return

    message = json.dumps(event)
    disconnected: list[WebSocket] = []

    for ws in _alarm_connections:
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.append(ws)

    # Tote Verbindungen aufräumen
    for ws in disconnected:
        if ws in _alarm_connections:
            _alarm_connections.remove(ws)

    if _alarm_connections:
        logger.debug(f"📡 Alarm broadcast an {len(_alarm_connections)} Client(s)")
