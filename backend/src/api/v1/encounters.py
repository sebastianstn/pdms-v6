"""Encounter API endpoints — admission, discharge, transfer, CRUD."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.encounter import (
    EncounterCreate,
    EncounterDischarge,
    EncounterResponse,
    EncounterTransfer,
    EncounterUpdate,
    PaginatedEncounters,
    ENCOUNTER_TYPE_LABELS,
    ENCOUNTER_STATUS_LABELS,
)
from src.domain.services.encounter_service import (
    admit_patient,
    cancel_encounter,
    discharge_patient,
    get_active_encounter,
    get_encounter,
    list_encounters,
    transfer_patient,
    update_encounter,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
DoctorOrAdmin = Annotated[dict, Depends(require_role("arzt", "admin"))]


# ─── Meta ──────────────────────────────────────────────────────


@router.get("/encounters/meta", response_model=dict)
async def get_encounter_meta(user: CurrentUser):
    """Encounter-Typen und Status-Labels abrufen."""
    return {
        "encounter_types": ENCOUNTER_TYPE_LABELS,
        "encounter_statuses": ENCOUNTER_STATUS_LABELS,
    }


# ─── List ──────────────────────────────────────────────────────


@router.get(
    "/patients/{patient_id}/encounters",
    response_model=PaginatedEncounters,
)
async def list_patient_encounters(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Alle Encounters eines Patienten — paginiert, filterbar nach Status."""
    return await list_encounters(db, patient_id, status=status, page=page, per_page=per_page)


# ─── Active Encounter ─────────────────────────────────────────


@router.get(
    "/patients/{patient_id}/encounters/active",
    response_model=EncounterResponse | None,
)
async def get_patient_active_encounter(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Aktiven Encounter eines Patienten abrufen (oder null)."""
    return await get_active_encounter(db, patient_id)


# ─── Read ──────────────────────────────────────────────────────


@router.get(
    "/encounters/{encounter_id}",
    response_model=EncounterResponse,
)
async def get_encounter_endpoint(
    encounter_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Einzelnen Encounter abrufen."""
    enc = await get_encounter(db, encounter_id)
    if not enc:
        raise HTTPException(404, "Encounter nicht gefunden")
    return enc


# ─── Admit (Aufnahme) ─────────────────────────────────────────


@router.post(
    "/encounters/admit",
    response_model=EncounterResponse,
    status_code=201,
)
async def admit_patient_endpoint(
    data: EncounterCreate,
    db: DbSession,
    user: DoctorOrAdmin,
):
    """Patienten aufnehmen — neuen Encounter erstellen."""
    try:
        return await admit_patient(db, data)
    except ValueError as exc:
        raise HTTPException(409, str(exc))


# ─── Update ────────────────────────────────────────────────────


@router.patch(
    "/encounters/{encounter_id}",
    response_model=EncounterResponse,
)
async def update_encounter_endpoint(
    encounter_id: uuid.UUID,
    data: EncounterUpdate,
    db: DbSession,
    user: DoctorOrAdmin,
):
    """Encounter-Daten aktualisieren."""
    try:
        enc = await update_encounter(db, encounter_id, data)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not enc:
        raise HTTPException(404, "Encounter nicht gefunden")
    return enc


# ─── Discharge (Entlassung) ───────────────────────────────────


@router.post(
    "/encounters/{encounter_id}/discharge",
    response_model=EncounterResponse,
)
async def discharge_patient_endpoint(
    encounter_id: uuid.UUID,
    body: EncounterDischarge,
    db: DbSession,
    user: DoctorOrAdmin,
):
    """Patienten entlassen — Encounter abschliessen."""
    try:
        enc = await discharge_patient(db, encounter_id, discharge_reason=body.discharge_reason)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not enc:
        raise HTTPException(404, "Encounter nicht gefunden")
    return enc


# ─── Transfer (Verlegung) ─────────────────────────────────────


@router.post(
    "/encounters/{encounter_id}/transfer",
    response_model=EncounterResponse,
)
async def transfer_patient_endpoint(
    encounter_id: uuid.UUID,
    body: EncounterTransfer,
    db: DbSession,
    user: DoctorOrAdmin,
):
    """Station/Bett wechseln (Verlegung)."""
    try:
        enc = await transfer_patient(db, encounter_id, ward=body.ward, bed=body.bed)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not enc:
        raise HTTPException(404, "Encounter nicht gefunden")
    return enc


# ─── Cancel ────────────────────────────────────────────────────


@router.post(
    "/encounters/{encounter_id}/cancel",
    response_model=EncounterResponse,
)
async def cancel_encounter_endpoint(
    encounter_id: uuid.UUID,
    db: DbSession,
    user: DoctorOrAdmin,
):
    """Encounter abbrechen (Fehlaufnahme etc.)."""
    try:
        enc = await cancel_encounter(db, encounter_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not enc:
        raise HTTPException(404, "Encounter nicht gefunden")
    return enc
