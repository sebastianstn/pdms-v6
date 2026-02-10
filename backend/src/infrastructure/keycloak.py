"""Keycloak JWT validation and role extraction."""

import logging
import time
from typing import Annotated, Any

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from src.config import settings

logger = logging.getLogger("pdms.auth")

security = HTTPBearer(auto_error=settings.environment != "development")

Credentials = Annotated[HTTPAuthorizationCredentials | None, Depends(security)]

_jwks_cache: dict[str, Any] | None = None
_jwks_fetched_at: float = 0
JWKS_CACHE_TTL = 3600  # Re-fetch JWKS every hour

# Dev user returned when no token is provided in development mode
_DEV_USER: dict[str, Any] = {
    "sub": "dev-user-0000-0000-000000000000",
    "preferred_username": "dev-admin",
    "email": "dev@pdms.local",
    "name": "Dev Admin",
    "realm_access": {"roles": ["admin", "arzt", "pflege"]},
}


async def _get_jwks() -> dict[str, Any]:
    """Fetch Keycloak JWKS (cached with TTL)."""
    global _jwks_cache, _jwks_fetched_at
    now = time.time()
    if _jwks_cache is None or (now - _jwks_fetched_at) > JWKS_CACHE_TTL:
        url = f"{settings.keycloak_url}/realms/{settings.keycloak_realm}/protocol/openid-connect/certs"
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                _jwks_cache = resp.json()
                _jwks_fetched_at = now
        except Exception as exc:
            if _jwks_cache is not None:
                logger.warning("JWKS refresh failed, using cached keys: %s", exc)
            else:
                raise
    return _jwks_cache


async def get_current_user(
    credentials: Credentials,
    request: Request,
) -> dict[str, Any]:
    """Validate JWT and return user payload. In development mode, return a dev user if no token."""
    # Dev bypass: no token in development → return mock user
    if credentials is None:
        if settings.environment == "development":
            logger.debug("Auth bypass: returning dev user (no token)")
            request.state.user_id = _DEV_USER["sub"]
            request.state.user_role = "admin"
            return _DEV_USER
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token fehlt",
        )

    token = credentials.credentials
    try:
        jwks = await _get_jwks()
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["RS256"],
            audience=settings.keycloak_client_id,
            issuer=f"{settings.keycloak_url}/realms/{settings.keycloak_realm}",
        )
        # Store user info in request state for AuditMiddleware
        request.state.user_id = payload.get("sub")
        request.state.user_role = (
            payload.get("realm_access", {}).get("roles", ["user"])[0]
            if payload.get("realm_access", {}).get("roles")
            else "user"
        )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token ungültig: {e}",
        ) from e


CurrentUser = Annotated[dict[str, Any], Depends(get_current_user)]


def require_role(*roles: str):
    """Dependency: require user to have one of the given roles."""
    async def _check(user: CurrentUser):
        user_roles = user.get("realm_access", {}).get("roles", [])
        if not any(r in user_roles for r in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Rolle erforderlich: {', '.join(roles)}",
            )
        return user
    return _check
