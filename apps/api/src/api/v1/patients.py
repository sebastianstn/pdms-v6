"""Patient API endpoints — CRUD + search."""

import uuid

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

router = APIRouter()


@router.get("/patients", response_model=PaginatedPatients)
async def list_patients_endpoint(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Patientenliste mit Suche und Pagination."""
    patients, total = await list_patients(db, page=page, per_page=per_page, search=search)
    return PaginatedPatients(
        items=[PatientResponse.model_validate(p) for p in patients],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient_endpoint(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Einzelnen Patient abrufen."""
    patient = await get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")
    return PatientResponse.model_validate(patient)


@router.post("/patients", response_model=PatientResponse, status_code=201)
async def create_patient_endpoint(
    data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Neuen Patient anlegen."""
    patient = await create_patient(db, data)
    return PatientResponse.model_validate(patient)


@router.patch("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient_endpoint(
    patient_id: uuid.UUID,
    data: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Patient aktualisieren (partial update)."""
    patient = await update_patient(db, patient_id, data)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")
    return PatientResponse.model_validate(patient)


@router.delete("/patients/{patient_id}", status_code=204)
async def delete_patient_endpoint(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Patient soft-delete (Daten bleiben für Audit erhalten)."""
    deleted = await soft_delete_patient(db, patient_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Patient nicht gefunden")
