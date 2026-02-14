"""VitalSign business logic — recording, alarm checking, aggregation."""

import logging
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.clinical import VitalSign
from src.domain.schemas.vital import VitalSignCreate, VitalSignUpdate
from src.domain.services.alarm_service import alarm_to_event, check_thresholds
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.vitals")


async def record_vital(session: AsyncSession, data: VitalSignCreate, recorded_by: uuid.UUID) -> VitalSign:
    vital = VitalSign(**data.model_dump(), recorded_by=recorded_by)
    session.add(vital)
    await session.flush()

    # Event: vital.recorded
    await emit_event(RoutingKeys.VITAL_RECORDED, {
        "vital_sign_id": str(vital.id),
        "patient_id": str(vital.patient_id),
        "recorded_by": str(recorded_by),
        "heart_rate": vital.heart_rate,
        "systolic_bp": vital.systolic_bp,
        "diastolic_bp": vital.diastolic_bp,
        "spo2": vital.spo2,
        "temperature": vital.temperature,
        "respiratory_rate": vital.respiratory_rate,
    })

    # Alarm-Schwellenwerte prüfen
    new_alarms = await check_thresholds(session, vital)
    if new_alarms:
        logger.info(f"🚨 {len(new_alarms)} Alarm(e) ausgelöst für Patient {vital.patient_id}")

        # WebSocket-Broadcast an verbundene Clients
        from src.api.websocket.alarms_ws import broadcast_alarm
        for alarm in new_alarms:
            await broadcast_alarm(alarm_to_event(alarm))

        # RabbitMQ Event publizieren
        for alarm in new_alarms:
            await emit_event(
                f"alarm.{alarm.severity}",
                alarm_to_event(alarm),
            )

    return vital


async def get_vitals(
    session: AsyncSession,
    patient_id: uuid.UUID,
    *,
    hours: int = 24,
) -> list[VitalSign]:
    since = datetime.now(UTC) - timedelta(hours=hours)
    result = await session.execute(
        select(VitalSign)
        .where(VitalSign.patient_id == patient_id, VitalSign.recorded_at >= since)
        .order_by(VitalSign.recorded_at.desc())
    )
    return list(result.scalars().all())


async def update_vital(
    session: AsyncSession,
    vital_id: uuid.UUID,
    data: VitalSignUpdate,
    *,
    updated_by: uuid.UUID,
) -> VitalSign | None:
    """Bestehenden Vitaleintrag korrigieren (Zeitpunkt/Werte)."""
    vital = await session.get(VitalSign, vital_id)
    if not vital:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vital, field, value)

    await session.flush()

    await emit_event(RoutingKeys.VITAL_UPDATED, {
        "vital_sign_id": str(vital.id),
        "patient_id": str(vital.patient_id),
        "updated_by": str(updated_by),
        "recorded_at": vital.recorded_at.isoformat(),
        "heart_rate": vital.heart_rate,
        "systolic_bp": vital.systolic_bp,
        "diastolic_bp": vital.diastolic_bp,
        "spo2": vital.spo2,
        "temperature": vital.temperature,
        "respiratory_rate": vital.respiratory_rate,
        "gcs": vital.gcs,
        "pain_score": vital.pain_score,
    })

    return vital
