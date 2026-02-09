"""Keycloak JWT validation and role extraction."""

from typing import Annotated, Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from src.config import settings

security = HTTPBearer()

Credentials = Annotated[HTTPAuthorizationCredentials, Depends(security)]

_jwks_cache: dict[str, Any] | None = None


async def _get_jwks() -> dict[str, Any]:
    """Fetch Keycloak JWKS (cached)."""
    global _jwks_cache
    if _jwks_cache is None:
        url = f"{settings.keycloak_url}/realms/{settings.keycloak_realm}/protocol/openid-connect/certs"
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            resp.raise_for_status()
            _jwks_cache = resp.json()
    return _jwks_cache


async def get_current_user(credentials: Credentials) -> dict[str, Any]:
    """Validate JWT and return user payload."""
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
