"""Shift Handover API endpoints — Schichtübergabe (SBAR)."""

import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.shift_handover import (
    PaginatedShiftHandovers,
    ShiftHandoverAcknowledge,
    ShiftHandoverCreate,
    ShiftHandoverResponse,
)
from src.domain.services.shift_handover_service import (
    acknowledge_handover,
    create_shift_handover,
    delete_shift_handover,
    get_shift_handover,
    list_shift_handovers,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
NurseOrAdmin = Annotated[dict, Depends(require_role("pflege", "arzt", "admin"))]


@router.get("/patients/{patient_id}/shift-handovers", response_model=PaginatedShiftHandovers)
async def list_handovers(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    shift_type: str | None = Query(None, pattern=r"^(early|late|night)$"),
    handover_date: date | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Schichtübergaben eines Patienten auflisten."""
    return await list_shift_handovers(
        db, patient_id, shift_type=shift_type, handover_date=handover_date, page=page, per_page=per_page,
    )


@router.get("/shift-handovers/{handover_id}", response_model=ShiftHandoverResponse)
async def get_handover(handover_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Einzelne Schichtübergabe laden."""
    handover = await get_shift_handover(db, handover_id)
    if not handover:
        raise HTTPException(404, "Schichtübergabe nicht gefunden")
    return handover


@router.post("/shift-handovers", response_model=ShiftHandoverResponse, status_code=201)
async def create_handover(data: ShiftHandoverCreate, db: DbSession, user: NurseOrAdmin):
    """Neue Schichtübergabe erstellen (SBAR-Format)."""
    handed_over_by = uuid.UUID(user["sub"]) if user.get("sub") else None
    return await create_shift_handover(db, data, handed_over_by=handed_over_by)


@router.post("/shift-handovers/{handover_id}/acknowledge", response_model=ShiftHandoverResponse)
async def acknowledge(
    handover_id: uuid.UUID,
    body: ShiftHandoverAcknowledge,
    db: DbSession,
    user: NurseOrAdmin,
):
    """Schichtübergabe quittieren."""
    received_by = uuid.UUID(user["sub"]) if user.get("sub") else None
    if not received_by:
        raise HTTPException(400, "User-ID nicht verfügbar")
    try:
        handover = await acknowledge_handover(db, handover_id, received_by)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not handover:
        raise HTTPException(404, "Schichtübergabe nicht gefunden")
    return handover


@router.delete("/shift-handovers/{handover_id}", status_code=204)
async def delete_handover(handover_id: uuid.UUID, db: DbSession, user: NurseOrAdmin):
    """Schichtübergabe löschen (nur wenn noch nicht quittiert)."""
    try:
        deleted = await delete_shift_handover(db, handover_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not deleted:
        raise HTTPException(404, "Schichtübergabe nicht gefunden")
