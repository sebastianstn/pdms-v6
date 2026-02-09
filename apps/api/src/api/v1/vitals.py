"""Vitals API endpoints — record + query time series."""

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.schemas.vital import VitalSignCreate, VitalSignResponse
from src.domain.services.vital_service import get_vitals, record_vital

router = APIRouter()


@router.get("/patients/{patient_id}/vitals", response_model=list[VitalSignResponse])
async def get_vitals_endpoint(
    patient_id: uuid.UUID,
    hours: int = Query(24, ge=1, le=720),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Vitaldaten eines Patienten abrufen (Zeitreihe)."""
    vitals = await get_vitals(db, patient_id, hours=hours)
    return [VitalSignResponse.model_validate(v) for v in vitals]


@router.post("/vitals", response_model=VitalSignResponse, status_code=201)
async def record_vital_endpoint(
    data: VitalSignCreate,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    """Neue Vitaldaten erfassen."""
    user_id = uuid.UUID(user.get("sub", "00000000-0000-0000-0000-000000000000"))
    vital = await record_vital(db, data, recorded_by=user_id)
    return VitalSignResponse.model_validate(vital)
