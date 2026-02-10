"""Nursing API endpoints — entries + assessments."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.nursing import (
    NursingAssessmentCreate,
    NursingAssessmentResponse,
    NursingEntryCreate,
    NursingEntryResponse,
    NursingEntryUpdate,
    PaginatedAssessments,
    PaginatedNursingEntries,
)
from src.domain.services.nursing_service import (
    create_assessment,
    create_nursing_entry,
    delete_nursing_entry,
    get_assessment,
    get_assessment_definitions,
    get_latest_assessments,
    get_nursing_entry,
    list_assessments,
    list_nursing_entries,
    update_nursing_entry,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
NurseOrAdmin = Annotated[dict, Depends(require_role("pflege", "arzt", "admin"))]


# ─── Nursing Entry Endpoints ──────────────────────────────────

@router.get("/patients/{patient_id}/nursing-entries", response_model=PaginatedNursingEntries)
async def list_entries_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    category: str | None = Query(None, pattern=r"^(observation|intervention|assessment|handover|wound_care|mobility|nutrition|elimination|communication)$"),
    handover_only: bool = Query(False),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Pflegeeinträge eines Patienten (optional nach Kategorie / Übergabe gefiltert)."""
    entries, total = await list_nursing_entries(
        db, patient_id, category=category, handover_only=handover_only, page=page, per_page=per_page,
    )
    return PaginatedNursingEntries(
        items=[NursingEntryResponse.model_validate(e) for e in entries],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/nursing-entries/{entry_id}", response_model=NursingEntryResponse)
async def get_entry_endpoint(
    entry_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Einzelnen Pflegeeintrag abrufen."""
    entry = await get_nursing_entry(db, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Pflegeeintrag nicht gefunden")
    return NursingEntryResponse.model_validate(entry)


@router.post("/nursing-entries", response_model=NursingEntryResponse, status_code=201)
async def create_entry_endpoint(
    data: NursingEntryCreate,
    db: DbSession,
    user: NurseOrAdmin,
):
    """Neuen Pflegeeintrag erstellen (Pflege/Arzt/Admin)."""
    user_id = uuid.UUID(user.get("sub", "00000000-0000-0000-0000-000000000000"))
    entry = await create_nursing_entry(db, data, recorded_by=user_id)
    return NursingEntryResponse.model_validate(entry)


@router.patch("/nursing-entries/{entry_id}", response_model=NursingEntryResponse)
async def update_entry_endpoint(
    entry_id: uuid.UUID,
    data: NursingEntryUpdate,
    db: DbSession,
    user: NurseOrAdmin,
):
    """Pflegeeintrag aktualisieren (Pflege/Arzt/Admin)."""
    entry = await update_nursing_entry(db, entry_id, data)
    if entry is None:
        raise HTTPException(status_code=404, detail="Pflegeeintrag nicht gefunden")
    return NursingEntryResponse.model_validate(entry)


@router.delete("/nursing-entries/{entry_id}", status_code=204)
async def delete_entry_endpoint(
    entry_id: uuid.UUID,
    db: DbSession,
    user: NurseOrAdmin,
):
    """Pflegeeintrag löschen (Pflege/Arzt/Admin)."""
    deleted = await delete_nursing_entry(db, entry_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Pflegeeintrag nicht gefunden")


# ─── Assessment Endpoints ─────────────────────────────────────

@router.get("/assessments/definitions")
async def get_definitions_endpoint(user: CurrentUser):
    """Assessment-Definitionen (Barthel, Norton, Braden, etc.) abrufen."""
    return get_assessment_definitions()


@router.get("/patients/{patient_id}/assessments", response_model=PaginatedAssessments)
async def list_assessments_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    assessment_type: str | None = Query(None, pattern=r"^(barthel|norton|braden|pain|fall_risk|nutrition)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Assessments eines Patienten auflisten (optional nach Typ)."""
    assessments, total = await list_assessments(
        db, patient_id, assessment_type=assessment_type, page=page, per_page=per_page,
    )
    return PaginatedAssessments(
        items=[NursingAssessmentResponse.model_validate(a) for a in assessments],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/patients/{patient_id}/assessments/latest")
async def get_latest_assessments_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Jeweils letztes Assessment pro Typ für einen Patienten."""
    latest = await get_latest_assessments(db, patient_id)
    return {
        atype: NursingAssessmentResponse.model_validate(assessment)
        for atype, assessment in latest.items()
    }


@router.get("/assessments/{assessment_id}", response_model=NursingAssessmentResponse)
async def get_assessment_endpoint(
    assessment_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Einzelnes Assessment abrufen."""
    assessment = await get_assessment(db, assessment_id)
    if assessment is None:
        raise HTTPException(status_code=404, detail="Assessment nicht gefunden")
    return NursingAssessmentResponse.model_validate(assessment)


@router.post("/assessments", response_model=NursingAssessmentResponse, status_code=201)
async def create_assessment_endpoint(
    data: NursingAssessmentCreate,
    db: DbSession,
    user: NurseOrAdmin,
):
    """Neues Pflege-Assessment erfassen (Pflege/Arzt/Admin)."""
    user_id = uuid.UUID(user.get("sub", "00000000-0000-0000-0000-000000000000"))
    assessment = await create_assessment(db, data, assessed_by=user_id)
    return NursingAssessmentResponse.model_validate(assessment)
