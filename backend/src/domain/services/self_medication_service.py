"""Self-medication service — CRUD, confirm/miss/skip (Patient-App concept)."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.home_spital import SelfMedicationLog
from src.domain.schemas.home_spital import SelfMedicationLogCreate, SelfMedicationLogUpdate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.self_medication")


async def list_self_medication_logs(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    status: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[SelfMedicationLog], int]:
    base = select(SelfMedicationLog).where(SelfMedicationLog.patient_id == patient_id)
    count_q = select(func.count()).select_from(SelfMedicationLog).where(SelfMedicationLog.patient_id == patient_id)

    if status:
        base = base.where(SelfMedicationLog.status == status)
        count_q = count_q.where(SelfMedicationLog.status == status)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * per_page
    rows = (await db.execute(
        base.order_by(SelfMedicationLog.scheduled_time.desc()).offset(offset).limit(per_page)
    )).scalars().all()
    return rows, total


async def create_self_medication_log(db: AsyncSession, data: SelfMedicationLogCreate) -> SelfMedicationLog:
    log = SelfMedicationLog(**data.model_dump())
    db.add(log)
    await db.commit()
    await db.refresh(log)
    logger.info("SelfMedLog created: %s med=%s patient=%s", log.id, log.medication_id, log.patient_id)
    return log


async def confirm_medication(db: AsyncSession, log_id: uuid.UUID) -> SelfMedicationLog | None:
    log = (await db.execute(select(SelfMedicationLog).where(SelfMedicationLog.id == log_id))).scalar_one_or_none()
    if not log:
        return None
    log.status = "confirmed"
    log.confirmed_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(log)
    logger.info("SelfMed confirmed: %s", log.id)
    return log


async def miss_medication(db: AsyncSession, log_id: uuid.UUID) -> SelfMedicationLog | None:
    log = (await db.execute(select(SelfMedicationLog).where(SelfMedicationLog.id == log_id))).scalar_one_or_none()
    if not log:
        return None
    log.status = "missed"
    await db.commit()
    await db.refresh(log)

    await emit_event(RoutingKeys.SELF_MED_MISSED, {
        "log_id": str(log.id),
        "patient_id": str(log.patient_id),
        "medication_id": str(log.medication_id),
    })
    logger.info("SelfMed missed: %s", log.id)
    return log


async def skip_medication(db: AsyncSession, log_id: uuid.UUID, notes: str | None = None) -> SelfMedicationLog | None:
    log = (await db.execute(select(SelfMedicationLog).where(SelfMedicationLog.id == log_id))).scalar_one_or_none()
    if not log:
        return None
    log.status = "skipped"
    if notes:
        log.notes = notes
    await db.commit()
    await db.refresh(log)
    logger.info("SelfMed skipped: %s", log.id)
    return log
