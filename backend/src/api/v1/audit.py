"""Audit log endpoints — admin only."""

import uuid
from datetime import date, datetime
from typing import Annotated

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_db, require_role
from src.domain.models.system import AuditLog

router = APIRouter()

AdminUser = Annotated[dict, Depends(require_role("admin"))]
DbSession = Annotated[AsyncSession, Depends(get_db)]


# ── Schemas ─────────────────────────────────────────────────────────

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    user_role: str
    action: str
    resource_type: str
    resource_id: str | None
    details: dict
    ip_address: str | None
    created_at: datetime


class PaginatedAuditLogs(BaseModel):
    items: list[AuditLogResponse]
    total: int
    page: int
    per_page: int


# ── Endpoints ───────────────────────────────────────────────────────

@router.get("/audit", response_model=PaginatedAuditLogs)
async def get_audit_log(
    db: DbSession,
    user: AdminUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
    user_id: uuid.UUID | None = None,
    action: str | None = Query(None, pattern=r"^(POST|PATCH|PUT|DELETE)$"),
    resource_type: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
):
    """Audit-Log abrufen (nur Admin).

    Unterstützt Filterung nach user_id, action, resource_type und Datum.
    """
    query = select(AuditLog)

    # Filter
    if user_id:
        query = query.where(AuditLog.user_id == user_id)
    if action:
        query = query.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type.ilike(f"%{resource_type}%"))
    if date_from:
        query = query.where(AuditLog.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.where(AuditLog.created_at <= datetime.combine(date_to, datetime.max.time()))

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar_one()

    # Paginate (neueste zuerst)
    query = query.order_by(AuditLog.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    result = await db.execute(query)
    logs = list(result.scalars().all())

    return PaginatedAuditLogs(
        items=[AuditLogResponse.model_validate(log) for log in logs],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/audit/{log_id}", response_model=AuditLogResponse)
async def get_audit_entry(
    log_id: uuid.UUID,
    db: DbSession,
    user: AdminUser,
):
    """Einzelnen Audit-Eintrag abrufen (nur Admin)."""
    result = await db.execute(select(AuditLog).where(AuditLog.id == log_id))
    entry = result.scalar_one_or_none()
    if entry is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Audit-Eintrag nicht gefunden")
    return AuditLogResponse.model_validate(entry)
