"""WebSocket: live alarm stream — broadcasts new alarms to all connected clients."""

import json
import logging
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("pdms.ws.alarms")

router = APIRouter()

# In-memory connection store (in Produktion: Redis/Valkey PubSub)
_alarm_connections: list[WebSocket] = []


@router.websocket("/ws/alarms")
async def alarm_stream(websocket: WebSocket):
    """WebSocket-Endpoint: Echtzeit-Alarm-Stream.

    Clients verbinden sich und erhalten alle neuen Alarme sofort.
    Optional: Client sendet JSON mit patient_id zum Filtern.
    """
    await websocket.accept()
    _alarm_connections.append(websocket)
    client = websocket.client
    logger.info(f"🔌 Alarm-WS verbunden: {client}")

    try:
        while True:
            # Client kann Filter senden (z.B. {"patient_id": "..."})
            # oder einfach keepalive-Pings
            data = await websocket.receive_text()
            # Ping/Pong für Keepalive
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        logger.info(f"🔌 Alarm-WS getrennt: {client}")
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
