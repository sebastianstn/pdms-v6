"""Alarm API endpoints — list, acknowledge, resolve, counts + Valkey caching."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.schemas.alarm import AlarmCountsResponse, AlarmResponse, PaginatedAlarms
from src.domain.services.alarm_service import (
    acknowledge_alarm,
    get_alarm,
    get_alarm_counts,
    list_alarms,
    resolve_alarm,
)
from src.infrastructure.valkey import (
    CacheKeys,
    TTL_ALARM_COUNTS,
    TTL_ALARM_LIST,
    get_cached,
    invalidate,
    set_cached,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/alarms", response_model=PaginatedAlarms)
async def list_alarms_endpoint(
    db: DbSession,
    user: CurrentUser,
    status: str | None = Query("active", pattern=r"^(active|acknowledged|resolved)$"),
    patient_id: uuid.UUID | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Aktive Alarme abrufen (filtert nach Status und optional nach Patient)."""
    cache_key = CacheKeys.alarm_list(status, str(patient_id) if patient_id else None, page)
    cached = await get_cached(cache_key)
    if cached is not None:
        return PaginatedAlarms(**cached)

    alarms, total = await list_alarms(
        db,
        status_filter=status,
        patient_id=patient_id,
        page=page,
        per_page=per_page,
    )
    result = PaginatedAlarms(
        items=[AlarmResponse.model_validate(a) for a in alarms],
        total=total,
        page=page,
        per_page=per_page,
    )
    await set_cached(cache_key, result.model_dump(), ttl=TTL_ALARM_LIST)
    return result


@router.get("/alarms/counts", response_model=AlarmCountsResponse)
async def alarm_counts_endpoint(
    db: DbSession,
    user: CurrentUser,
):
    """Schnelle Alarm-Zählung nach Schweregrad (für Dashboard-Badges)."""
    cached = await get_cached(CacheKeys.alarm_counts())
    if cached is not None:
        return AlarmCountsResponse(**cached)

    counts = await get_alarm_counts(db)
    await set_cached(CacheKeys.alarm_counts(), counts, ttl=TTL_ALARM_COUNTS)
    return AlarmCountsResponse(**counts)


@router.get("/alarms/{alarm_id}", response_model=AlarmResponse)
async def get_alarm_endpoint(
    alarm_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Einzelnen Alarm abrufen."""
    alarm = await get_alarm(db, alarm_id)
    if alarm is None:
        raise HTTPException(status_code=404, detail="Alarm nicht gefunden")
    return AlarmResponse.model_validate(alarm)


@router.patch("/alarms/{alarm_id}/acknowledge", response_model=AlarmResponse)
async def acknowledge_alarm_endpoint(
    alarm_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Alarm quittieren (acknowledge)."""
    user_id = uuid.UUID(user.get("sub", "00000000-0000-0000-0000-000000000000"))
    alarm = await acknowledge_alarm(db, alarm_id, user_id)
    if alarm is None:
        raise HTTPException(status_code=404, detail="Alarm nicht gefunden")
    # Invalidate alarm caches (counts + lists change on ack)
    await invalidate(CacheKeys.ALARM_ALL)
    return AlarmResponse.model_validate(alarm)


@router.patch("/alarms/{alarm_id}/resolve", response_model=AlarmResponse)
async def resolve_alarm_endpoint(
    alarm_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    """Alarm als gelöst markieren."""
    alarm = await resolve_alarm(db, alarm_id)
    if alarm is None:
        raise HTTPException(status_code=404, detail="Alarm nicht gefunden")
    # Invalidate alarm caches
    await invalidate(CacheKeys.ALARM_ALL)
    return AlarmResponse.model_validate(alarm)
