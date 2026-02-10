"""Remote-device API endpoints — CRUD, readings, status."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.schemas.home_spital import (
    DEVICE_TYPE_LABELS,
    RemoteDeviceCreate,
    RemoteDeviceResponse,
    RemoteDeviceUpdate,
)
from src.domain.services.remote_device_service import (
    create_device,
    delete_device,
    get_device,
    list_devices,
    mark_offline,
    report_reading,
    update_device,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


class ReadingPayload(BaseModel):
    value: str
    unit: str


@router.get("/remote-devices/meta")
async def device_meta(user: CurrentUser):
    return {"device_types": DEVICE_TYPE_LABELS}


@router.get("/patients/{patient_id}/remote-devices", response_model=list[RemoteDeviceResponse])
async def list_patient_devices(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    rows = await list_devices(db, patient_id)
    return [RemoteDeviceResponse.model_validate(d) for d in rows]


@router.get("/remote-devices/{device_id}", response_model=RemoteDeviceResponse)
async def get_device_endpoint(device_id: uuid.UUID, db: DbSession, user: CurrentUser):
    device = await get_device(db, device_id)
    if not device:
        raise HTTPException(404, "Gerät nicht gefunden")
    return RemoteDeviceResponse.model_validate(device)


@router.post("/remote-devices", response_model=RemoteDeviceResponse, status_code=201)
async def create_device_endpoint(data: RemoteDeviceCreate, db: DbSession, user: CurrentUser):
    device = await create_device(db, data)
    return RemoteDeviceResponse.model_validate(device)


@router.patch("/remote-devices/{device_id}", response_model=RemoteDeviceResponse)
async def update_device_endpoint(
    device_id: uuid.UUID,
    data: RemoteDeviceUpdate,
    db: DbSession,
    user: CurrentUser,
):
    device = await update_device(db, device_id, data)
    if not device:
        raise HTTPException(404, "Gerät nicht gefunden")
    return RemoteDeviceResponse.model_validate(device)


@router.post("/remote-devices/{device_id}/reading", response_model=RemoteDeviceResponse)
async def report_reading_endpoint(
    device_id: uuid.UUID,
    data: ReadingPayload,
    db: DbSession,
    user: CurrentUser,
):
    """Neuen Messwert von Remote-Gerät einlesen."""
    device = await report_reading(db, device_id, data.value, data.unit)
    if not device:
        raise HTTPException(404, "Gerät nicht gefunden")
    return RemoteDeviceResponse.model_validate(device)


@router.post("/remote-devices/{device_id}/offline", response_model=RemoteDeviceResponse)
async def mark_offline_endpoint(device_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Gerät als offline markieren."""
    device = await mark_offline(db, device_id)
    if not device:
        raise HTTPException(404, "Gerät nicht gefunden")
    return RemoteDeviceResponse.model_validate(device)


@router.delete("/remote-devices/{device_id}", status_code=204)
async def delete_device_endpoint(device_id: uuid.UUID, db: DbSession, user: CurrentUser):
    deleted = await delete_device(db, device_id)
    if not deleted:
        raise HTTPException(404, "Gerät nicht gefunden")
