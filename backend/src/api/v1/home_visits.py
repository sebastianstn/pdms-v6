"""Home-visit API endpoints — CRUD, status transitions, today's overview."""

import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.schemas.home_spital import (
    HOME_VISIT_STATUS_LABELS,
    PATIENT_CONDITION_LABELS,
    HomeVisitCreate,
    HomeVisitResponse,
    HomeVisitUpdate,
    PaginatedHomeVisits,
)
from src.domain.services.home_visit_service import (
    arrive,
    complete_visit,
    create_home_visit,
    delete_home_visit,
    get_home_visit,
    list_home_visits,
    list_today_home_visits,
    start_travel,
    update_home_visit,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


# ─── Meta ──────────────────────────────────────────────────────


@router.get("/home-visits/meta")
async def home_visit_meta(user: CurrentUser):
    return {
        "statuses": HOME_VISIT_STATUS_LABELS,
        "patient_conditions": PATIENT_CONDITION_LABELS,
    }


# ─── Today's visits (cross-patient) ───────────────────────────


@router.get("/home-visits/today", response_model=list[HomeVisitResponse])
async def today_home_visits(
    db: DbSession,
    user: CurrentUser,
    target_date: date | None = None,
):
    """Alle Hausbesuche heute — für Dashboard-Übersicht."""
    rows = await list_today_home_visits(db, target_date=target_date)
    return [HomeVisitResponse.model_validate(v) for v in rows]


# ─── List (per patient) ───────────────────────────────────────


@router.get("/patients/{patient_id}/home-visits", response_model=PaginatedHomeVisits)
async def list_patient_home_visits(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    from_date: date | None = None,
    to_date: date | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    items, total = await list_home_visits(
        db, patient_id,
        from_date=from_date, to_date=to_date, status=status,
        page=page, per_page=per_page,
    )
    return PaginatedHomeVisits(
        items=[HomeVisitResponse.model_validate(v) for v in items],
        total=total, page=page, per_page=per_page,
    )


# ─── Detail ────────────────────────────────────────────────────


@router.get("/home-visits/{visit_id}", response_model=HomeVisitResponse)
async def get_home_visit_endpoint(visit_id: uuid.UUID, db: DbSession, user: CurrentUser):
    visit = await get_home_visit(db, visit_id)
    if not visit:
        raise HTTPException(404, "Hausbesuch nicht gefunden")
    return HomeVisitResponse.model_validate(visit)


# ─── Create ────────────────────────────────────────────────────


@router.post("/home-visits", response_model=HomeVisitResponse, status_code=201)
async def create_home_visit_endpoint(data: HomeVisitCreate, db: DbSession, user: CurrentUser):
    visit = await create_home_visit(db, data)
    return HomeVisitResponse.model_validate(visit)


# ─── Update ────────────────────────────────────────────────────


@router.patch("/home-visits/{visit_id}", response_model=HomeVisitResponse)
async def update_home_visit_endpoint(
    visit_id: uuid.UUID,
    data: HomeVisitUpdate,
    db: DbSession,
    user: CurrentUser,
):
    visit = await update_home_visit(db, visit_id, data)
    if not visit:
        raise HTTPException(404, "Hausbesuch nicht gefunden")
    return HomeVisitResponse.model_validate(visit)


# ─── Status transitions ───────────────────────────────────────


@router.post("/home-visits/{visit_id}/start-travel", response_model=HomeVisitResponse)
async def start_travel_endpoint(visit_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Pfleger ist unterwegs zum Patienten."""
    visit = await start_travel(db, visit_id)
    if not visit:
        raise HTTPException(404, "Hausbesuch nicht gefunden")
    return HomeVisitResponse.model_validate(visit)


@router.post("/home-visits/{visit_id}/arrive", response_model=HomeVisitResponse)
async def arrive_endpoint(visit_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Pfleger ist beim Patienten angekommen."""
    visit = await arrive(db, visit_id)
    if not visit:
        raise HTTPException(404, "Hausbesuch nicht gefunden")
    return HomeVisitResponse.model_validate(visit)


@router.post("/home-visits/{visit_id}/complete", response_model=HomeVisitResponse)
async def complete_visit_endpoint(
    visit_id: uuid.UUID,
    data: HomeVisitUpdate,
    db: DbSession,
    user: CurrentUser,
):
    """Hausbesuch abschliessen mit Dokumentation."""
    visit = await complete_visit(db, visit_id, data)
    if not visit:
        raise HTTPException(404, "Hausbesuch nicht gefunden")
    return HomeVisitResponse.model_validate(visit)


# ─── Delete ────────────────────────────────────────────────────


@router.delete("/home-visits/{visit_id}", status_code=204)
async def delete_home_visit_endpoint(visit_id: uuid.UUID, db: DbSession, user: CurrentUser):
    deleted = await delete_home_visit(db, visit_id)
    if not deleted:
        raise HTTPException(404, "Hausbesuch nicht gefunden")
