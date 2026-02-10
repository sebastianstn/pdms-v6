"""Lab Results API endpoints — CRUD, batch, trend, summary."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.lab import (
    ANALYTE_LABELS,
    ANALYTES,
    FLAG_LABELS,
    INTERPRETATION_LABELS,
    LAB_CATEGORY_LABELS,
    LabResultBatchCreate,
    LabResultCreate,
    LabResultResponse,
    LabResultUpdate,
    LabSummaryResponse,
    LabTrendResponse,
    PaginatedLabResults,
)
from src.domain.services.lab_service import (
    create_lab_result,
    create_lab_results_batch,
    delete_lab_result,
    get_lab_result,
    get_lab_summary,
    get_lab_trend,
    list_lab_results,
    update_lab_result,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
DoctorOrAdmin = Annotated[dict, Depends(require_role("arzt", "admin"))]


# ─── Meta ───────────────────────────────────────────────────────

@router.get("/lab-results/meta", response_model=dict)
async def lab_meta():
    """Return analyte catalogue, category labels, flags, etc."""
    return {
        "analytes": ANALYTES,
        "analyte_labels": ANALYTE_LABELS,
        "category_labels": LAB_CATEGORY_LABELS,
        "flag_labels": FLAG_LABELS,
        "interpretation_labels": INTERPRETATION_LABELS,
    }


# ─── List ───────────────────────────────────────────────────────

@router.get("/patients/{patient_id}/lab-results", response_model=PaginatedLabResults)
async def list_results(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    analyte: str | None = Query(None),
    category: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    return await list_lab_results(db, patient_id, analyte=analyte, category=category, page=page, per_page=per_page)


# ─── Summary (latest per analyte) ──────────────────────────────

@router.get("/patients/{patient_id}/lab-results/summary", response_model=LabSummaryResponse)
async def summary(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    items = await get_lab_summary(db, patient_id)
    return {"items": items}


# ─── Trend (one analyte over time) ─────────────────────────────

@router.get("/patients/{patient_id}/lab-results/trend/{analyte}", response_model=LabTrendResponse)
async def trend(
    patient_id: uuid.UUID,
    analyte: str,
    db: DbSession,
    user: CurrentUser,
    limit: int = Query(20, ge=1, le=100),
):
    return await get_lab_trend(db, patient_id, analyte, limit=limit)


# ─── Detail ─────────────────────────────────────────────────────

@router.get("/lab-results/{result_id}", response_model=LabResultResponse)
async def get_result(result_id: uuid.UUID, db: DbSession, user: CurrentUser):
    result = await get_lab_result(db, result_id)
    if not result:
        raise HTTPException(404, "Lab result not found")
    return result


# ─── Create single ──────────────────────────────────────────────

@router.post("/lab-results", response_model=LabResultResponse, status_code=201)
async def create_result(data: LabResultCreate, db: DbSession, user: DoctorOrAdmin):
    return await create_lab_result(db, data, ordered_by=user.get("sub"))


# ─── Batch create ──────────────────────────────────────────────

@router.post("/lab-results/batch", response_model=list[LabResultResponse], status_code=201)
async def create_batch(data: LabResultBatchCreate, db: DbSession, user: DoctorOrAdmin):
    return await create_lab_results_batch(
        db,
        data.patient_id,
        data.results,
        encounter_id=data.encounter_id,
        order_number=data.order_number,
        collected_at=data.collected_at,
        sample_type=data.sample_type,
        ordered_by=user.get("sub"),
    )


# ─── Update ─────────────────────────────────────────────────────

@router.patch("/lab-results/{result_id}", response_model=LabResultResponse)
async def update_result(result_id: uuid.UUID, data: LabResultUpdate, db: DbSession, user: DoctorOrAdmin):
    result = await update_lab_result(db, result_id, data)
    if not result:
        raise HTTPException(404, "Lab result not found")
    return result


# ─── Delete ─────────────────────────────────────────────────────

@router.delete("/lab-results/{result_id}", status_code=204)
async def delete_result(result_id: uuid.UUID, db: DbSession, user: DoctorOrAdmin):
    ok = await delete_lab_result(db, result_id)
    if not ok:
        raise HTTPException(404, "Lab result not found")
