"""Fluid Balance API endpoints — CRUD, summary (24h balance), meta."""

import uuid
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.fluid_balance import (
    CATEGORY_LABELS,
    DIRECTION_LABELS,
    INTAKE_CATEGORIES,
    OUTPUT_CATEGORIES,
    ROUTE_LABELS,
    FluidBalanceSummary,
    FluidEntryCreate,
    FluidEntryResponse,
    FluidEntryUpdate,
    PaginatedFluidEntries,
)
from src.domain.services.fluid_balance_service import (
    create_fluid_entry,
    delete_fluid_entry,
    get_fluid_balance_summary,
    get_fluid_entry,
    list_fluid_entries,
    update_fluid_entry,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
NurseOrDoctorOrAdmin = Annotated[dict, Depends(require_role("pflege", "arzt", "admin"))]


# ─── Meta ───────────────────────────────────────────────────────

@router.get("/fluid-balance/meta", response_model=dict)
async def fluid_meta():
    """Return category labels, direction labels, routes."""
    return {
        "direction_labels": DIRECTION_LABELS,
        "category_labels": CATEGORY_LABELS,
        "intake_categories": INTAKE_CATEGORIES,
        "output_categories": OUTPUT_CATEGORIES,
        "route_labels": ROUTE_LABELS,
    }


# ─── List ───────────────────────────────────────────────────────

@router.get("/patients/{patient_id}/fluid-balance", response_model=PaginatedFluidEntries)
async def list_entries(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    direction: str | None = Query(None, pattern=r"^(intake|output)$"),
    category: str | None = Query(None),
    since: datetime | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    return await list_fluid_entries(
        db, patient_id,
        direction=direction, category=category, since=since,
        page=page, per_page=per_page,
    )


# ─── 24h Balance Summary ───────────────────────────────────────

@router.get("/patients/{patient_id}/fluid-balance/summary", response_model=FluidBalanceSummary)
async def summary(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    hours: int = Query(24, ge=1, le=168),
):
    return await get_fluid_balance_summary(db, patient_id, hours=hours)


# ─── Detail ─────────────────────────────────────────────────────

@router.get("/fluid-balance/{entry_id}", response_model=FluidEntryResponse)
async def get_entry(entry_id: uuid.UUID, db: DbSession, user: CurrentUser):
    entry = await get_fluid_entry(db, entry_id)
    if not entry:
        raise HTTPException(404, "Fluid entry not found")
    return entry


# ─── Create ─────────────────────────────────────────────────────

@router.post("/fluid-balance", response_model=FluidEntryResponse, status_code=201)
async def create_entry(data: FluidEntryCreate, db: DbSession, user: NurseOrDoctorOrAdmin):
    return await create_fluid_entry(db, data, recorded_by=user.get("sub"))


# ─── Update ─────────────────────────────────────────────────────

@router.patch("/fluid-balance/{entry_id}", response_model=FluidEntryResponse)
async def update_entry(entry_id: uuid.UUID, data: FluidEntryUpdate, db: DbSession, user: NurseOrDoctorOrAdmin):
    entry = await update_fluid_entry(db, entry_id, data)
    if not entry:
        raise HTTPException(404, "Fluid entry not found")
    return entry


# ─── Delete ─────────────────────────────────────────────────────

@router.delete("/fluid-balance/{entry_id}", status_code=204)
async def delete_entry(entry_id: uuid.UUID, db: DbSession, user: NurseOrDoctorOrAdmin):
    ok = await delete_fluid_entry(db, entry_id)
    if not ok:
        raise HTTPException(404, "Fluid entry not found")
