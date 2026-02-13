"""Teleconsult service — CRUD, start/end session, SOAP documentation."""

import logging
import uuid
from datetime import UTC, date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.home_spital import Teleconsult
from src.domain.schemas.home_spital import TeleconsultCreate, TeleconsultUpdate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.teleconsults")


# ─── Today ─────────────────────────────────────────────────────


async def list_today_teleconsults(db: AsyncSession) -> tuple[list[Teleconsult], int]:
    """Alle Teleconsults für heute (für Dashboard-Stat)."""
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    base = select(Teleconsult).where(
        Teleconsult.scheduled_start >= today_start,
        Teleconsult.scheduled_start <= today_end,
    )
    count_q = select(func.count()).select_from(Teleconsult).where(
        Teleconsult.scheduled_start >= today_start,
        Teleconsult.scheduled_start <= today_end,
    )

    total = (await db.execute(count_q)).scalar() or 0
    rows = (await db.execute(
        base.order_by(Teleconsult.scheduled_start.asc())
    )).scalars().all()
    return rows, total


# ─── CRUD ──────────────────────────────────────────────────────


async def list_teleconsults(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    status: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[Teleconsult], int]:
    base = select(Teleconsult).where(Teleconsult.patient_id == patient_id)
    count_q = select(func.count()).select_from(Teleconsult).where(Teleconsult.patient_id == patient_id)

    if status:
        base = base.where(Teleconsult.status == status)
        count_q = count_q.where(Teleconsult.status == status)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * per_page
    rows = (await db.execute(
        base.order_by(Teleconsult.scheduled_start.desc()).offset(offset).limit(per_page)
    )).scalars().all()
    return rows, total


async def get_teleconsult(db: AsyncSession, tc_id: uuid.UUID) -> Teleconsult | None:
    return (await db.execute(select(Teleconsult).where(Teleconsult.id == tc_id))).scalar_one_or_none()


async def create_teleconsult(db: AsyncSession, data: TeleconsultCreate) -> Teleconsult:
    tc = Teleconsult(**data.model_dump())
    db.add(tc)
    await db.commit()
    await db.refresh(tc)
    logger.info("Teleconsult created: %s patient=%s", tc.id, tc.patient_id)
    return tc


async def update_teleconsult(db: AsyncSession, tc_id: uuid.UUID, data: TeleconsultUpdate) -> Teleconsult | None:
    tc = await get_teleconsult(db, tc_id)
    if not tc:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tc, field, value)
    await db.commit()
    await db.refresh(tc)
    logger.info("Teleconsult updated: %s status=%s", tc.id, tc.status)
    return tc


async def delete_teleconsult(db: AsyncSession, tc_id: uuid.UUID) -> bool:
    tc = await get_teleconsult(db, tc_id)
    if not tc:
        return False
    await db.delete(tc)
    await db.commit()
    return True


# ─── Session lifecycle ─────────────────────────────────────────


async def start_teleconsult(db: AsyncSession, tc_id: uuid.UUID) -> Teleconsult | None:
    """Mark teleconsult as active (video started)."""
    tc = await get_teleconsult(db, tc_id)
    if not tc:
        return None
    tc.status = "active"
    tc.actual_start = datetime.now(UTC)
    await db.commit()
    await db.refresh(tc)
    logger.info("Teleconsult started: %s", tc.id)

    await emit_event(RoutingKeys.TELECONSULT_STARTED, {
        "teleconsult_id": str(tc.id),
        "patient_id": str(tc.patient_id),
        "physician_name": tc.physician_name,
    })
    return tc


async def end_teleconsult(db: AsyncSession, tc_id: uuid.UUID) -> Teleconsult | None:
    """Mark teleconsult as completed, calculate duration."""
    tc = await get_teleconsult(db, tc_id)
    if not tc:
        return None
    tc.status = "completed"
    tc.actual_end = datetime.now(UTC)
    if tc.actual_start:
        tc.duration_minutes = int((tc.actual_end - tc.actual_start).total_seconds() / 60)
    await db.commit()
    await db.refresh(tc)
    logger.info("Teleconsult ended: %s duration=%d min", tc.id, tc.duration_minutes or 0)

    await emit_event(RoutingKeys.TELECONSULT_ENDED, {
        "teleconsult_id": str(tc.id),
        "patient_id": str(tc.patient_id),
        "duration_minutes": tc.duration_minutes,
    })
    return tc
