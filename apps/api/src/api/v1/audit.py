"""Audit log endpoints — admin only."""

from typing import Annotated

from fastapi import APIRouter, Depends

from src.infrastructure.keycloak import require_role

router = APIRouter()


AdminUser = Annotated[dict, Depends(require_role("admin"))]


@router.get("/audit")
async def get_audit_log(user: AdminUser):
    """Audit-Log abrufen (nur Admin)."""
    # TODO: query audit_logs table with filters
    return {"message": "Audit-Log — TODO: implement", "user": user.get("preferred_username")}
