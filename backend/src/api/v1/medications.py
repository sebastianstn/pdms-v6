"""Medication API endpoints — prescriptions + administration tracking."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.medication import (
    AdministrationCreate,
    AdministrationResponse,
    MedicationCreate,
    MedicationResponse,
    MedicationUpdate,
    PaginatedMedications,
)
from src.domain.services.medication_service import (
    create_medication,
    discontinue_medication,
    get_medication,
    list_administrations,
    list_medications,
    record_administration,
    update_medication,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


# ─── Medication (Verordnung) Endpoints ─────────────────────────

@router.get("/patients/{patient_id}/medications", response_model=PaginatedMedications)
async def list_medications_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    status: str | None = Query(None, pattern=r"^(active|paused|discontinued|completed)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Medikamente eines Patienten auflisten (optional nach Status gefiltert)."""
    meds, total = await list_medications(db, patient_id, status_filter=status, page=page, per_page=per_page)
    return PaginatedMedications(
        items=[MedicationResponse.model_validate(m) for m in meds],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/medications/{medication_id}", response_model=MedicationResponse)
async def get_medication_endpoint(
    medication_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Einzelne Medikamentenverordnung abrufen."""
    med = await get_medication(db, medication_id)
    if med is None:
        raise HTTPException(status_code=404, detail="Medikament nicht gefunden")
    return MedicationResponse.model_validate(med)


@router.post("/medications", response_model=MedicationResponse, status_code=201)
async def create_medication_endpoint(
    data: MedicationCreate,
    db: DbSession,
    user: Annotated[dict, Depends(require_role("arzt", "admin"))],
):
    """Neues Medikament verordnen (nur Arzt/Admin)."""
    user_id = uuid.UUID(user.get("sub", "00000000-0000-0000-0000-000000000000"))
    med = await create_medication(db, data, prescribed_by=user_id)
    return MedicationResponse.model_validate(med)


@router.patch("/medications/{medication_id}", response_model=MedicationResponse)
async def update_medication_endpoint(
    medication_id: uuid.UUID,
    data: MedicationUpdate,
    db: DbSession,
    user: Annotated[dict, Depends(require_role("arzt", "admin"))],
):
    """Medikament aktualisieren (Dosis, Status, etc.) — nur Arzt/Admin."""
    med = await update_medication(db, medication_id, data)
    if med is None:
        raise HTTPException(status_code=404, detail="Medikament nicht gefunden")
    return MedicationResponse.model_validate(med)


@router.patch("/medications/{medication_id}/discontinue", response_model=MedicationResponse)
async def discontinue_medication_endpoint(
    medication_id: uuid.UUID,
    db: DbSession,
    user: Annotated[dict, Depends(require_role("arzt", "admin"))],
    reason: str | None = Query(None),
):
    """Medikament absetzen — nur Arzt/Admin."""
    med = await discontinue_medication(db, medication_id, reason=reason)
    if med is None:
        raise HTTPException(status_code=404, detail="Medikament nicht gefunden")
    return MedicationResponse.model_validate(med)


# ─── MedicationAdministration (Verabreichung) Endpoints ────────

@router.post("/medications/{medication_id}/administrations", response_model=AdministrationResponse, status_code=201)
async def record_administration_endpoint(
    medication_id: uuid.UUID,
    data: AdministrationCreate,
    db: DbSession,
    user: CurrentUser,
):
    """Medikamenten-Verabreichung dokumentieren (Pflege/Arzt)."""
    # Sicherheitscheck: medication_id im Path muss zur Payload passen
    if data.medication_id != medication_id:
        raise HTTPException(status_code=400, detail="medication_id stimmt nicht überein")

    user_id = uuid.UUID(user.get("sub", "00000000-0000-0000-0000-000000000000"))
    admin = await record_administration(db, data, administered_by=user_id)
    return AdministrationResponse.model_validate(admin)


@router.get("/medications/{medication_id}/administrations", response_model=list[AdministrationResponse])
async def list_administrations_endpoint(
    medication_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Verabreichungshistorie eines Medikaments abrufen."""
    admins, _ = await list_administrations(db, medication_id, page=page, per_page=per_page)
    return [AdministrationResponse.model_validate(a) for a in admins]