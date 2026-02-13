"""
AI Orchestrator Client – Für serverseitige Aufrufe aus dem PDMS-Backend.

Beispiel:
    from src.infrastructure.ai_client import ai_client

    result = await ai_client.ask("Analysiere die Vitalzeichen", provider="auto")
    print(result["result"])
"""

import os
import logging

import httpx

logger = logging.getLogger(__name__)

AI_ORCHESTRATOR_URL = os.getenv("AI_ORCHESTRATOR_URL", "http://ai-orchestrator:8081")


class AIClient:
    """Async HTTP-Client für den AI Orchestrator."""

    def __init__(self, base_url: str = AI_ORCHESTRATOR_URL) -> None:
        self.base_url = base_url.rstrip("/")

    async def ask(
        self,
        task: str,
        provider: str = "auto",
        session_id: str | None = None,
        validate_with_claude: bool = False,
        timeout: float = 120.0,
    ) -> dict:
        """
        Stellt eine Frage an den AI Orchestrator.

        Args:
            task: Die Aufgabe / Frage.
            provider: auto, gemini, claude, deepseek, biogpt, ensemble.
            session_id: Optional – Session-ID für Konversations-Memory.
            validate_with_claude: Claude-Validierung aktivieren.
            timeout: Request-Timeout in Sekunden.

        Returns:
            Dict mit status, result, provider, agents_used, session_id, duration_ms.
        """
        payload = {
            "task": task,
            "provider": provider,
            "validate_with_claude": validate_with_claude,
        }
        if session_id:
            payload["session_id"] = session_id

        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                f"{self.base_url}/ask",
                json=payload,
            )
            response.raise_for_status()
            return response.json()

    async def health(self) -> dict:
        """Prüft den Health-Status des AI Orchestrators."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{self.base_url}/health")
            response.raise_for_status()
            return response.json()

    async def create_session(self) -> str:
        """Erstellt eine neue Konversations-Session."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.post(f"{self.base_url}/sessions")
            response.raise_for_status()
            return response.json()["session_id"]

    async def get_session(self, session_id: str) -> dict:
        """Gibt die Konversationshistorie einer Session zurück."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{self.base_url}/sessions/{session_id}")
            response.raise_for_status()
            return response.json()

    async def delete_session(self, session_id: str) -> None:
        """Löscht eine Konversations-Session."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.delete(
                f"{self.base_url}/sessions/{session_id}"
            )
            response.raise_for_status()


# Globale Instanz – importierbar als `from src.infrastructure.ai_client import ai_client`
ai_client = AIClient()
