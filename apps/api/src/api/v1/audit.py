"""Audit log endpoints — admin only."""

from fastapi import APIRouter, Depends

from src.infrastructure.keycloak import require_role

router = APIRouter()


@router.get("/audit")
async def get_audit_log(user: dict = Depends(require_role("admin"))):
    """Audit-Log abrufen (nur Admin)."""
    # TODO: query audit_logs table with filters
    return {"message": "Audit-Log — TODO: implement", "user": user.get("preferred_username")}
