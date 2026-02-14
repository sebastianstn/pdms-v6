"""RBAC-Guard — Dependency zur Durchsetzung der DB-basierten Zugriffsberechtigungen."""

import logging
import time

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.infrastructure.database import get_db
from src.infrastructure.keycloak import get_current_user

logger = logging.getLogger("pdms.rbac")

# ─── In-Memory-Cache für RBAC-Matrix ──────────────────────────────
_rbac_cache: dict[str, dict[str, str]] | None = None
_rbac_cache_time: float = 0
RBAC_CACHE_TTL = 30  # Sekunden


async def _get_matrix_cached(db: AsyncSession) -> dict[str, dict[str, str]]:
    """Liefert die RBAC-Matrix aus dem Cache oder der Datenbank."""
    global _rbac_cache, _rbac_cache_time
    now = time.time()
    if _rbac_cache is not None and (now - _rbac_cache_time) < RBAC_CACHE_TTL:
        return _rbac_cache

    from src.domain.services.rbac_service import RbacPermissionService

    _rbac_cache = await RbacPermissionService.get_matrix(db)
    _rbac_cache_time = now
    logger.debug("RBAC-Matrix aus DB geladen (%d Ressourcen)", len(_rbac_cache))
    return _rbac_cache


def invalidate_rbac_cache() -> None:
    """Invalidiert den RBAC-Cache (nach Permission-Änderungen aufrufen)."""
    global _rbac_cache
    _rbac_cache = None
    logger.info("RBAC-Cache invalidiert")


async def get_user_permissions(
    user: dict, db: AsyncSession
) -> dict[str, str]:
    """Berechnet die effektiven Berechtigungen des Users (höchste Stufe pro Ressource)."""
    user_roles = user.get("realm_access", {}).get("roles", [])
    matrix = await _get_matrix_cached(db)

    # Für jede Ressource die höchste Berechtigung über alle Rollen ermitteln
    ACCESS_ORDER = {"—": 0, "R": 1, "RW": 2}
    ORDER_ACCESS = {0: "—", 1: "R", 2: "RW"}

    permissions: dict[str, str] = {}
    for resource, role_map in matrix.items():
        max_level = 0
        for role in user_roles:
            access = role_map.get(role, "—")
            level = ACCESS_ORDER.get(access, 0)
            if level > max_level:
                max_level = level
        permissions[resource] = ORDER_ACCESS[max_level]

    return permissions


def require_rbac(resource: str):
    """Dependency-Factory: Prüft RBAC-Berechtigung für eine Ressource.

    - GET/HEAD/OPTIONS → erfordert mindestens 'R'
    - POST/PUT/PATCH/DELETE → erfordert 'RW'
    """

    async def _guard(
        request: Request,
        user: dict = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        method = request.method
        required = "RW" if method in ("POST", "PUT", "PATCH", "DELETE") else "R"

        user_roles = user.get("realm_access", {}).get("roles", [])
        matrix = await _get_matrix_cached(db)
        resource_perms = matrix.get(resource, {})

        # Prüfe ob mindestens eine Rolle ausreichenden Zugriff hat
        for role in user_roles:
            access = resource_perms.get(role, "—")
            if required == "R" and access in ("R", "RW"):
                return user
            if required == "RW" and access == "RW":
                return user

        logger.warning(
            "RBAC verweigert: User=%s, Rollen=%s, Ressource=%s, Benötigt=%s",
            user.get("preferred_username", "?"),
            user_roles,
            resource,
            required,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Keine Berechtigung für '{resource}' ({required}). "
            f"Bitte Administrator kontaktieren.",
        )

    return Depends(_guard)
