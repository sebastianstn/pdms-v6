"""
PDMS API v1 — AI-Endpunkte.

Leitet Anfragen vom PDMS-Frontend an den AI Orchestrator weiter.
Authentifizierung und Audit-Logging erfolgen hier im Backend.
"""

import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from src.infrastructure.ai_client import ai_client

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/ai", tags=["AI"])


class AIAskRequest(BaseModel):
    task: str = Field(..., min_length=1, description="Die Aufgabe/Frage an die KI")
    provider: str = Field(default="auto", description="LLM-Provider")
    session_id: str | None = Field(default=None, description="Session-ID für Memory")
    validate_with_claude: bool = Field(default=False)


class AIAskResponse(BaseModel):
    status: str
    result: str
    agents_used: list[str]
    provider: str
    validation: str | None = None
    session_id: str | None = None
    duration_ms: int


@router.post("/ask", response_model=AIAskResponse)
async def ask_ai(request: AIAskRequest):
    """
    Stellt eine Frage an den AI Orchestrator.

    Der Aufruf wird über das Backend geroutet, damit:
    - Authentifizierung (Keycloak JWT) geprüft wird
    - Audit-Logging erfolgt
    - Rate-Limiting angewendet werden kann
    """
    try:
        result = await ai_client.ask(
            task=request.task,
            provider=request.provider,
            session_id=request.session_id,
            validate_with_claude=request.validate_with_claude,
        )
        return AIAskResponse(**result)
    except Exception as e:
        logger.error("AI Orchestrator Fehler: %s", e)
        raise HTTPException(status_code=502, detail=f"AI Orchestrator Fehler: {e}")


@router.get("/health")
async def ai_health():
    """Prüft den Health-Status des AI Orchestrators."""
    try:
        return await ai_client.health()
    except Exception as e:
        return {"status": "offline", "error": str(e)}


@router.post("/sessions")
async def create_ai_session():
    """Erstellt eine neue KI-Konversations-Session."""
    try:
        session_id = await ai_client.create_session()
        return {"session_id": session_id, "status": "created"}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.delete("/sessions/{session_id}")
async def delete_ai_session(session_id: str):
    """Löscht eine KI-Konversations-Session."""
    try:
        await ai_client.delete_session(session_id)
        return {"session_id": session_id, "status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
