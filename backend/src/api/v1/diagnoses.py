"""Diagnosis API endpoints — CRUD für medizinische Diagnosen (ICD-10)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.diagnosis import (
    DiagnosisCreate,
    DiagnosisResponse,
    DiagnosisUpdate,
    PaginatedDiagnoses,
)
from src.domain.services.diagnosis_service import (
    create_diagnosis,
    delete_diagnosis,
    get_diagnosis,
    list_diagnoses,
    update_diagnosis,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
DoctorOrAdmin = Annotated[dict, Depends(require_role("arzt", "admin"))]


@router.get("/patients/{patient_id}/diagnoses", response_model=PaginatedDiagnoses)
async def list_patient_diagnoses(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    status: str | None = Query(None, pattern=r"^(active|resolved|ruled_out|recurrence)$"),
    diagnosis_type: str | None = Query(None, pattern=r"^(haupt|neben|verdacht)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Alle Diagnosen eines Patienten auflisten."""
    return await list_diagnoses(
        db, patient_id, status=status, diagnosis_type=diagnosis_type, page=page, per_page=per_page,
    )


@router.get("/diagnoses/{diagnosis_id}", response_model=DiagnosisResponse)
async def get_single_diagnosis(diagnosis_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Einzelne Diagnose laden."""
    diagnosis = await get_diagnosis(db, diagnosis_id)
    if not diagnosis:
        raise HTTPException(404, "Diagnose nicht gefunden")
    return diagnosis


@router.post("/diagnoses", response_model=DiagnosisResponse, status_code=201)
async def create_new_diagnosis(data: DiagnosisCreate, db: DbSession, user: DoctorOrAdmin):
    """Neue Diagnose erfassen (nur Arzt/Admin)."""
    diagnosed_by = uuid.UUID(user["sub"]) if user.get("sub") else None
    return await create_diagnosis(db, data, diagnosed_by=diagnosed_by)


@router.patch("/diagnoses/{diagnosis_id}", response_model=DiagnosisResponse)
async def update_existing_diagnosis(
    diagnosis_id: uuid.UUID, data: DiagnosisUpdate, db: DbSession, user: DoctorOrAdmin,
):
    """Diagnose aktualisieren (nur Arzt/Admin)."""
    diagnosis = await update_diagnosis(db, diagnosis_id, data)
    if not diagnosis:
        raise HTTPException(404, "Diagnose nicht gefunden")
    return diagnosis


@router.delete("/diagnoses/{diagnosis_id}", status_code=204)
async def delete_existing_diagnosis(diagnosis_id: uuid.UUID, db: DbSession, user: DoctorOrAdmin):
    """Diagnose löschen (nur Arzt/Admin)."""
    deleted = await delete_diagnosis(db, diagnosis_id)
    if not deleted:
        raise HTTPException(404, "Diagnose nicht gefunden")
