"""Remote-device service — CRUD, status updates, reading ingestion."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.home_spital import RemoteDevice
from src.domain.schemas.home_spital import RemoteDeviceCreate, RemoteDeviceUpdate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.remote_devices")


async def list_devices(db: AsyncSession, patient_id: uuid.UUID) -> list[RemoteDevice]:
    rows = (await db.execute(
        select(RemoteDevice)
        .where(RemoteDevice.patient_id == patient_id)
        .order_by(RemoteDevice.device_type)
    )).scalars().all()
    return rows


async def get_device(db: AsyncSession, device_id: uuid.UUID) -> RemoteDevice | None:
    return (await db.execute(select(RemoteDevice).where(RemoteDevice.id == device_id))).scalar_one_or_none()


async def create_device(db: AsyncSession, data: RemoteDeviceCreate) -> RemoteDevice:
    device = RemoteDevice(**data.model_dump())
    db.add(device)
    await db.commit()
    await db.refresh(device)
    logger.info("RemoteDevice created: %s type=%s patient=%s", device.id, device.device_type, device.patient_id)
    return device


async def update_device(db: AsyncSession, device_id: uuid.UUID, data: RemoteDeviceUpdate) -> RemoteDevice | None:
    device = await get_device(db, device_id)
    if not device:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(device, field, value)
    await db.commit()
    await db.refresh(device)
    return device


async def delete_device(db: AsyncSession, device_id: uuid.UUID) -> bool:
    device = await get_device(db, device_id)
    if not device:
        return False
    await db.delete(device)
    await db.commit()
    return True


async def report_reading(
    db: AsyncSession,
    device_id: uuid.UUID,
    value: str,
    unit: str,
) -> RemoteDevice | None:
    """Ingest a new reading from a remote device."""
    device = await get_device(db, device_id)
    if not device:
        return None

    now = datetime.now(UTC)
    device.last_reading_value = value
    device.last_reading_unit = unit
    device.last_reading_at = now
    device.last_seen_at = now
    device.is_online = True

    await db.commit()
    await db.refresh(device)
    logger.info("Device reading: %s %s%s", device.device_name, value, unit)

    # Check thresholds
    try:
        numeric_val = float(value.split("/")[0])  # Handle "120/80" → 120
        if device.alert_threshold_high and numeric_val > float(device.alert_threshold_high):
            await emit_event(RoutingKeys.DEVICE_ALERT, {
                "device_id": str(device.id),
                "patient_id": str(device.patient_id),
                "device_type": device.device_type,
                "value": value,
                "threshold": device.alert_threshold_high,
                "direction": "high",
            })
        elif device.alert_threshold_low and numeric_val < float(device.alert_threshold_low):
            await emit_event(RoutingKeys.DEVICE_ALERT, {
                "device_id": str(device.id),
                "patient_id": str(device.patient_id),
                "device_type": device.device_type,
                "value": value,
                "threshold": device.alert_threshold_low,
                "direction": "low",
            })
    except (ValueError, TypeError):
        pass  # Non-numeric reading, skip threshold check

    return device


async def mark_offline(db: AsyncSession, device_id: uuid.UUID) -> RemoteDevice | None:
    """Mark a device as offline."""
    device = await get_device(db, device_id)
    if not device:
        return None
    device.is_online = False
    await db.commit()
    await db.refresh(device)

    await emit_event(RoutingKeys.DEVICE_OFFLINE, {
        "device_id": str(device.id),
        "patient_id": str(device.patient_id),
        "device_type": device.device_type,
        "device_name": device.device_name,
    })
    return device
