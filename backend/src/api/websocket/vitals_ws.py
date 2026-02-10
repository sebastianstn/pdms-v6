"""WebSocket: live vitals stream per patient — for remote monitoring devices.

Endpoint: ws://host/ws/vitals/{patient_id}
Clients connect and receive vitals data as JSON messages.
Nurses / dashboards can monitor multiple patients simultaneously.
"""

import json
import logging
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger("pdms.ws.vitals")

router = APIRouter()

# In-memory connection store: patient_id → list of WebSockets
_vitals_connections: dict[str, list[WebSocket]] = {}


@router.websocket("/ws/vitals/{patient_id}")
async def vitals_stream(websocket: WebSocket, patient_id: str):
    """WebSocket-Endpoint: Live-Vitalwerte-Stream per Patient.

    Remote-Monitoring-Geräte oder das Backend senden neue Messwerte,
    die an alle verbundenen Clients für diesen Patienten gestreamt werden.
    """
    await websocket.accept()

    if patient_id not in _vitals_connections:
        _vitals_connections[patient_id] = []
    _vitals_connections[patient_id].append(websocket)
    client = websocket.client
    logger.info("🔌 Vitals-WS verbunden: patient=%s client=%s", patient_id, client)

    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
                continue

            # Client can push vitals data (from device gateway)
            try:
                payload = json.loads(data)
                # Re-broadcast to all other clients watching this patient
                await broadcast_vitals(patient_id, payload, exclude=websocket)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "Invalid JSON"}))

    except WebSocketDisconnect:
        logger.info("🔌 Vitals-WS getrennt: patient=%s client=%s", patient_id, client)
    finally:
        if patient_id in _vitals_connections:
            conns = _vitals_connections[patient_id]
            if websocket in conns:
                conns.remove(websocket)
            if not conns:
                del _vitals_connections[patient_id]


async def broadcast_vitals(
    patient_id: str,
    event: dict[str, Any],
    exclude: WebSocket | None = None,
) -> None:
    """Send vitals data to all connected WebSocket clients for a patient."""
    conns = _vitals_connections.get(patient_id, [])
    if not conns:
        return

    message = json.dumps(event)
    disconnected: list[WebSocket] = []

    for ws in conns:
        if ws is exclude:
            continue
        try:
            await ws.send_text(message)
        except Exception:
            disconnected.append(ws)

    for ws in disconnected:
        if ws in conns:
            conns.remove(ws)

    active = len(conns) - (1 if exclude else 0)
    if active > 0:
        logger.debug("📡 Vitals broadcast patient=%s → %d client(s)", patient_id, active)
