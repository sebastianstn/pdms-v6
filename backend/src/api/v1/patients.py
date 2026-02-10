"""Patient API endpoints — CRUD + search + Valkey caching."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.schemas.patient import PaginatedPatients, PatientCreate, PatientResponse, PatientUpdate
from src.domain.services.patient_service import (
    create_patient,
    get_patient,
    list_patients,
    soft_delete_patient,
    update_patient,
)
from src.infrastructure.valkey import (
    CacheKeys,
    TTL_PATIENT,
    TTL_PATIENT_LIST,
    get_cached,
    invalidate,
    set_cached,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/patients", response_model=PaginatedPatients)
async def list_patients_endpoint(
    db: DbSession,
    user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
):
    """Patientenliste mit Suche und Pagination."""
    # Check cache
    cache_key = CacheKeys.patient_list(page, per_page, search)
    cached = await get_cached(cache_key)
    if cached is not None:
        return PaginatedPatients(**cached)

    patients, total = await list_patients(db, page=page, per_page=per_page, search=search)
    result = PaginatedPatients(
        items=[PatientResponse.model_validate(p) for p in patients],
        total=total,
        page=page,
        per_page=per_page,
    )
    await set_cached(cache_key, result.model_dump(), ttl=TTL_PATIENT_LIST)
    return result


@router.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Einzelnen Patient abrufen."""
    # Check cache
    cache_key = CacheKeys.patient(str(patient_id))
    cached = await get_cached(cache_key)
    if cached is not None:
        return PatientResponse(**cached)

    patient = await get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")
    result = PatientResponse.model_validate(patient)
    await set_cached(cache_key, result.model_dump(), ttl=TTL_PATIENT)
    return result


@router.post("/patients", response_model=PatientResponse, status_code=201)
async def create_patient_endpoint(
    data: PatientCreate,
    db: DbSession,
    user: CurrentUser,
):
    """Neuen Patient anlegen."""
    patient = await create_patient(db, data)
    result = PatientResponse.model_validate(patient)
    # Invalidate list caches
    await invalidate(CacheKeys.PATIENT_LIST_ALL)
    return result


@router.patch("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient_endpoint(
    patient_id: uuid.UUID,
    data: PatientUpdate,
    db: DbSession,
    user: CurrentUser,
):
    """Patient aktualisieren (partial update)."""
    patient = await update_patient(db, patient_id, data)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")
    result = PatientResponse.model_validate(patient)
    # Invalidate this patient + list caches
    await invalidate(CacheKeys.patient(str(patient_id)), CacheKeys.PATIENT_LIST_ALL)
    return result


@router.delete("/patients/{patient_id}", status_code=204)
async def delete_patient_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Patient soft-delete (Daten bleiben für Audit erhalten)."""
    deleted = await soft_delete_patient(db, patient_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")
    # Invalidate this patient + list caches
    await invalidate(CacheKeys.patient(str(patient_id)), CacheKeys.PATIENT_LIST_ALL)
