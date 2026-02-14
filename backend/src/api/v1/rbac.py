"""RBAC-Permissions Router — Zugriffsberechtigungen verwalten (nur Admin)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_db, require_role
from src.domain.schemas.rbac import (
    RbacMatrixResponse,
    RbacMatrixRow,
    RbacPermissionUpdate,
)
from src.domain.services.rbac_service import RESOURCES, ROLES, RbacPermissionService
from src.infrastructure.rbac_guard import get_user_permissions, invalidate_rbac_cache

router = APIRouter(prefix="/rbac", tags=["RBAC"])


@router.get("/matrix", response_model=RbacMatrixResponse)
async def get_rbac_matrix(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_role("admin", "arzt", "pflege", "fage")),
):
    """Liefert die vollständige RBAC-Matrix (alle Rollen dürfen lesen)."""
    matrix = await RbacPermissionService.get_matrix(db)

    rows = []
    for resource in RESOURCES:
        perms = matrix.get(resource, {})
        rows.append(RbacMatrixRow(
            resource=resource,
            arzt=perms.get("arzt", "—"),
            pflege=perms.get("pflege", "—"),
            fage=perms.get("fage", "—"),
            admin=perms.get("admin", "—"),
        ))

    return RbacMatrixResponse(
        roles=ROLES,
        resources=RESOURCES,
        matrix=rows,
    )


@router.put("/permission")
async def update_permission(
    data: RbacPermissionUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_role("admin")),
):
    """Ändert die Berechtigung für eine Rolle/Ressource-Kombination (nur Admin)."""
    if data.role not in ROLES:
        raise HTTPException(status_code=400, detail=f"Ungültige Rolle: {data.role}")
    if data.resource not in RESOURCES:
        raise HTTPException(status_code=400, detail=f"Ungültige Ressource: {data.resource}")

    updated_by = user.get("preferred_username", user.get("sub", "unknown"))

    perm = await RbacPermissionService.update_permission(
        db=db,
        role=data.role,
        resource=data.resource,
        access=data.access,
        updated_by=updated_by,
    )

    # Cache invalidieren damit Änderungen sofort wirksam werden
    invalidate_rbac_cache()

    return {
        "status": "ok",
        "role": perm.role,
        "resource": perm.resource,
        "access": perm.access,
        "updated_by": perm.updated_by,
    }


@router.get("/user-permissions")
async def get_my_permissions(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_role("admin", "arzt", "pflege", "fage")),
):
    """Liefert die effektiven Berechtigungen des aktuellen Users."""
    permissions = await get_user_permissions(user, db)
    return {
        "username": user.get("preferred_username", "unknown"),
        "roles": user.get("realm_access", {}).get("roles", []),
        "permissions": permissions,
    }


@router.post("/seed")
async def seed_defaults(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(require_role("admin")),
):
    """Seedet die Standard-Berechtigungen (nur wenn Tabelle leer ist)."""
    updated_by = user.get("preferred_username", user.get("sub", "system"))
    await RbacPermissionService.seed_defaults(db, updated_by=updated_by)
    return {"status": "ok", "message": "Standardberechtigungen geseedet."}
