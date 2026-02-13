"""Teleconsult API endpoints — CRUD, start/end session, SOAP documentation."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.schemas.home_spital import (
    TELECONSULT_STATUS_LABELS,
    TeleconsultCreate,
    TeleconsultResponse,
    TeleconsultUpdate,
    PaginatedTeleconsults,
)
from src.domain.services.teleconsult_service import (
    create_teleconsult,
    delete_teleconsult,
    end_teleconsult,
    get_teleconsult,
    list_teleconsults,
    list_today_teleconsults,
    start_teleconsult,
    update_teleconsult,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/teleconsults/meta")
async def teleconsult_meta(user: CurrentUser):
    return {"statuses": TELECONSULT_STATUS_LABELS}


@router.get("/teleconsults/today")
async def today_teleconsults(db: DbSession, user: CurrentUser):
    """Heutige Teleconsults — Anzahl und Status-Aufschlüsselung fürs Dashboard."""
    items, total = await list_today_teleconsults(db)
    completed = sum(1 for tc in items if tc.status == "completed")
    active = sum(1 for tc in items if tc.status == "active")
    scheduled = sum(1 for tc in items if tc.status in ("scheduled", "waiting"))
    return {
        "total": total,
        "completed": completed,
        "active": active,
        "scheduled": scheduled,
        "items": [TeleconsultResponse.model_validate(tc) for tc in items],
    }


@router.get("/patients/{patient_id}/teleconsults", response_model=PaginatedTeleconsults)
async def list_patient_teleconsults(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    status: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    items, total = await list_teleconsults(db, patient_id, status=status, page=page, per_page=per_page)
    return PaginatedTeleconsults(
        items=[TeleconsultResponse.model_validate(tc) for tc in items],
        total=total, page=page, per_page=per_page,
    )


@router.get("/teleconsults/{tc_id}", response_model=TeleconsultResponse)
async def get_teleconsult_endpoint(tc_id: uuid.UUID, db: DbSession, user: CurrentUser):
    tc = await get_teleconsult(db, tc_id)
    if not tc:
        raise HTTPException(404, "Teleconsult nicht gefunden")
    return TeleconsultResponse.model_validate(tc)


@router.post("/teleconsults", response_model=TeleconsultResponse, status_code=201)
async def create_teleconsult_endpoint(data: TeleconsultCreate, db: DbSession, user: CurrentUser):
    tc = await create_teleconsult(db, data)
    return TeleconsultResponse.model_validate(tc)


@router.patch("/teleconsults/{tc_id}", response_model=TeleconsultResponse)
async def update_teleconsult_endpoint(
    tc_id: uuid.UUID,
    data: TeleconsultUpdate,
    db: DbSession,
    user: CurrentUser,
):
    tc = await update_teleconsult(db, tc_id, data)
    if not tc:
        raise HTTPException(404, "Teleconsult nicht gefunden")
    return TeleconsultResponse.model_validate(tc)


@router.post("/teleconsults/{tc_id}/start", response_model=TeleconsultResponse)
async def start_teleconsult_endpoint(tc_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Video-Session starten."""
    tc = await start_teleconsult(db, tc_id)
    if not tc:
        raise HTTPException(404, "Teleconsult nicht gefunden")
    return TeleconsultResponse.model_validate(tc)


@router.post("/teleconsults/{tc_id}/end", response_model=TeleconsultResponse)
async def end_teleconsult_endpoint(tc_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Video-Session beenden und Dauer berechnen."""
    tc = await end_teleconsult(db, tc_id)
    if not tc:
        raise HTTPException(404, "Teleconsult nicht gefunden")
    return TeleconsultResponse.model_validate(tc)


@router.delete("/teleconsults/{tc_id}", status_code=204)
async def delete_teleconsult_endpoint(tc_id: uuid.UUID, db: DbSession, user: CurrentUser):
    deleted = await delete_teleconsult(db, tc_id)
    if not deleted:
        raise HTTPException(404, "Teleconsult nicht gefunden")
