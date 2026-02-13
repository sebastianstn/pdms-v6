"""WebSocket authentication helper — JWT validation via query parameter.

WebSockets cannot send Authorization headers from browsers,
so we authenticate via a query parameter: ?token=<JWT>

Usage:
    @router.websocket("/ws/example")
    async def ws_endpoint(websocket: WebSocket, token: str | None = Query(None)):
        user = await authenticate_websocket(websocket, token)
        if user is None:
            return  # rejected
        # ... proceed with authenticated user
"""

import logging
from typing import Any

from fastapi import WebSocket
from jose import JWTError, jwt

from src.config import settings

logger = logging.getLogger("pdms.ws.auth")

# Dev user for development mode (matches keycloak.py)
_WS_DEV_USER: dict[str, Any] = {
    "sub": "00000000-0000-4000-a000-000000000001",
    "preferred_username": "dev-admin",
    "email": "dev@pdms.local",
    "name": "Dev Admin",
    "realm_access": {"roles": ["admin", "arzt", "pflege"]},
}


async def authenticate_websocket(
    websocket: WebSocket,
    token: str | None,
) -> dict[str, Any] | None:
    """Validate JWT token for WebSocket connections.

    Args:
        websocket: The WebSocket connection to accept or reject.
        token: JWT token from query parameter.

    Returns:
        User payload dict if authenticated, None if rejected (connection closed).
    """
    # Development mode: allow without token
    if token is None and settings.environment == "development":
        logger.warning("⚠️  WebSocket auth bypass active (dev mode)")
        await websocket.accept()
        return _WS_DEV_USER

    if token is None:
        await websocket.close(code=4001, reason="Token fehlt")
        return None

    try:
        # Fetch JWKS for validation
        from src.infrastructure.keycloak import _get_jwks

        jwks = await _get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=settings.keycloak_client_id,
            issuer=f"{settings.keycloak_url}/realms/{settings.keycloak_realm}",
        )
        await websocket.accept()
        logger.info(
            "WebSocket authenticated: user=%s",
            payload.get("preferred_username", "unknown"),
        )
        return payload

    except JWTError as e:
        logger.warning("WebSocket JWT invalid: %s", e)
        await websocket.close(code=4003, reason=f"Token ungültig: {e}")
        return None
    except Exception as e:
        logger.error("WebSocket auth error: %s", e)
        await websocket.close(code=4500, reason="Authentifizierung fehlgeschlagen")
        return None
