"""Vitals API endpoints — record + query time series."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.schemas.vital import VitalSignCreate, VitalSignResponse, VitalSignUpdate
from src.domain.services.vital_service import get_vitals, record_vital, update_vital

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/patients/{patient_id}/vitals", response_model=list[VitalSignResponse])
async def get_vitals_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    hours: int = Query(24, ge=1, le=720),
):
    """Vitaldaten eines Patienten abrufen (Zeitreihe)."""
    vitals = await get_vitals(db, patient_id, hours=hours)
    return [VitalSignResponse.model_validate(v) for v in vitals]


@router.post("/vitals", response_model=VitalSignResponse, status_code=201)
async def record_vital_endpoint(
    data: VitalSignCreate,
    db: DbSession,
    user: CurrentUser,
):
    """Neue Vitaldaten erfassen."""
    user_id = uuid.UUID(user.get("sub", "00000000-0000-0000-0000-000000000000"))
    vital = await record_vital(db, data, recorded_by=user_id)
    return VitalSignResponse.model_validate(vital)


@router.patch("/vitals/{vital_id}", response_model=VitalSignResponse)
async def update_vital_endpoint(
    vital_id: uuid.UUID,
    data: VitalSignUpdate,
    db: DbSession,
    user: CurrentUser,
):
    """Bestehende Vitaldaten korrigieren (Zeitpunkt und Werte)."""
    user_id = uuid.UUID(user.get("sub", "00000000-0000-0000-0000-000000000000"))
    vital = await update_vital(db, vital_id, data, updated_by=user_id)
    if not vital:
        raise HTTPException(status_code=404, detail="Vitaleintrag nicht gefunden")
    return VitalSignResponse.model_validate(vital)
