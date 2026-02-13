"""Nursing Diagnosis API endpoints — Pflegediagnosen (NANDA-I)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.nursing_diagnosis import (
    NursingDiagnosisCreate,
    NursingDiagnosisResponse,
    NursingDiagnosisUpdate,
    PaginatedNursingDiagnoses,
)
from src.domain.services.nursing_diagnosis_service import (
    create_nursing_diagnosis,
    delete_nursing_diagnosis,
    get_nursing_diagnosis,
    list_nursing_diagnoses,
    update_nursing_diagnosis,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
NurseOrAdmin = Annotated[dict, Depends(require_role("pflege", "arzt", "admin"))]


@router.get("/patients/{patient_id}/nursing-diagnoses", response_model=PaginatedNursingDiagnoses)
async def list_diagnoses(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    status: str | None = Query(None, pattern=r"^(active|resolved|inactive)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Pflegediagnosen eines Patienten auflisten."""
    return await list_nursing_diagnoses(db, patient_id, status=status, page=page, per_page=per_page)


@router.get("/nursing-diagnoses/{diagnosis_id}", response_model=NursingDiagnosisResponse)
async def get_diagnosis(diagnosis_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Einzelne Pflegediagnose laden."""
    diagnosis = await get_nursing_diagnosis(db, diagnosis_id)
    if not diagnosis:
        raise HTTPException(404, "Pflegediagnose nicht gefunden")
    return diagnosis


@router.post("/nursing-diagnoses", response_model=NursingDiagnosisResponse, status_code=201)
async def create_diagnosis(data: NursingDiagnosisCreate, db: DbSession, user: NurseOrAdmin):
    """Neue Pflegediagnose erstellen."""
    diagnosed_by = uuid.UUID(user["sub"]) if user.get("sub") else None
    return await create_nursing_diagnosis(db, data, diagnosed_by=diagnosed_by)


@router.patch("/nursing-diagnoses/{diagnosis_id}", response_model=NursingDiagnosisResponse)
async def update_diagnosis(diagnosis_id: uuid.UUID, data: NursingDiagnosisUpdate, db: DbSession, user: NurseOrAdmin):
    """Pflegediagnose aktualisieren (inkl. Evaluation/Statuswechsel)."""
    diagnosis = await update_nursing_diagnosis(db, diagnosis_id, data)
    if not diagnosis:
        raise HTTPException(404, "Pflegediagnose nicht gefunden")
    return diagnosis


@router.delete("/nursing-diagnoses/{diagnosis_id}", status_code=204)
async def delete_diagnosis(diagnosis_id: uuid.UUID, db: DbSession, user: NurseOrAdmin):
    """Pflegediagnose löschen."""
    deleted = await delete_nursing_diagnosis(db, diagnosis_id)
    if not deleted:
        raise HTTPException(404, "Pflegediagnose nicht gefunden")
