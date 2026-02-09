"""VitalSign business logic — recording, alarm checking, aggregation."""

import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.clinical import VitalSign
from src.domain.schemas.vital import VitalSignCreate


async def record_vital(session: AsyncSession, data: VitalSignCreate, recorded_by: uuid.UUID) -> VitalSign:
    vital = VitalSign(**data.model_dump(), recorded_by=recorded_by)
    session.add(vital)
    await session.flush()
    # TODO: check alarm thresholds
    # TODO: publish event to RabbitMQ
    return vital


async def get_vitals(
    session: AsyncSession,
    patient_id: uuid.UUID,
    *,
    hours: int = 24,
) -> list[VitalSign]:
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    result = await session.execute(
        select(VitalSign)
        .where(VitalSign.patient_id == patient_id, VitalSign.recorded_at >= since)
        .order_by(VitalSign.recorded_at.desc())
    )
    return list(result.scalars().all())
