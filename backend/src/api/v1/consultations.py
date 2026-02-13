"""Consultation API endpoints — Konsilien anfragen und beantworten."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.consultation import (
    ConsultationCreate,
    ConsultationResponse,
    ConsultationUpdate,
    PaginatedConsultations,
)
from src.domain.services.consultation_service import (
    cancel_consultation,
    create_consultation,
    get_consultation,
    list_consultations,
    respond_to_consultation,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
DoctorOrAdmin = Annotated[dict, Depends(require_role("arzt", "admin"))]


@router.get("/patients/{patient_id}/consultations", response_model=PaginatedConsultations)
async def list_consults(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    status: str | None = Query(None, pattern=r"^(requested|accepted|completed|cancelled)$"),
    specialty: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Konsilien eines Patienten auflisten."""
    return await list_consultations(db, patient_id, status=status, specialty=specialty, page=page, per_page=per_page)


@router.get("/consultations/{consultation_id}", response_model=ConsultationResponse)
async def get_consult(consultation_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Einzelnes Konsil laden."""
    consultation = await get_consultation(db, consultation_id)
    if not consultation:
        raise HTTPException(404, "Konsil nicht gefunden")
    return consultation


@router.post("/consultations", response_model=ConsultationResponse, status_code=201)
async def create_consult(data: ConsultationCreate, db: DbSession, user: DoctorOrAdmin):
    """Neues Konsil anfragen."""
    requested_by = uuid.UUID(user["sub"]) if user.get("sub") else None
    return await create_consultation(db, data, requested_by=requested_by)


@router.patch("/consultations/{consultation_id}", response_model=ConsultationResponse)
async def respond_consult(consultation_id: uuid.UUID, data: ConsultationUpdate, db: DbSession, user: DoctorOrAdmin):
    """Konsil beantworten oder aktualisieren."""
    consultant_id = uuid.UUID(user["sub"]) if user.get("sub") else None
    try:
        consultation = await respond_to_consultation(db, consultation_id, data, consultant_id=consultant_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not consultation:
        raise HTTPException(404, "Konsil nicht gefunden")
    return consultation


@router.post("/consultations/{consultation_id}/cancel", response_model=ConsultationResponse)
async def cancel_consult(consultation_id: uuid.UUID, db: DbSession, user: DoctorOrAdmin):
    """Konsil stornieren."""
    try:
        consultation = await cancel_consultation(db, consultation_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not consultation:
        raise HTTPException(404, "Konsil nicht gefunden")
    return consultation
