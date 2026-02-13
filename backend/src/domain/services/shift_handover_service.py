"""Shift Handover service — CRUD for SBAR-based handovers."""

import logging
import uuid
from datetime import UTC, date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.therapy import ShiftHandover
from src.domain.schemas.shift_handover import ShiftHandoverCreate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.shift_handover")


async def list_shift_handovers(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    shift_type: str | None = None,
    handover_date: date | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    base = select(ShiftHandover).where(ShiftHandover.patient_id == patient_id)
    count_q = select(func.count()).select_from(ShiftHandover).where(ShiftHandover.patient_id == patient_id)

    if shift_type:
        base = base.where(ShiftHandover.shift_type == shift_type)
        count_q = count_q.where(ShiftHandover.shift_type == shift_type)
    if handover_date:
        base = base.where(ShiftHandover.handover_date == handover_date)
        count_q = count_q.where(ShiftHandover.handover_date == handover_date)

    total = (await db.execute(count_q)).scalar() or 0
    query = base.order_by(ShiftHandover.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_shift_handover(db: AsyncSession, handover_id: uuid.UUID) -> ShiftHandover | None:
    result = await db.execute(select(ShiftHandover).where(ShiftHandover.id == handover_id))
    return result.scalar_one_or_none()


async def create_shift_handover(
    db: AsyncSession,
    data: ShiftHandoverCreate,
    handed_over_by: uuid.UUID | None = None,
) -> ShiftHandover:
    handover = ShiftHandover(
        **data.model_dump(),
        handed_over_by=handed_over_by,
    )
    db.add(handover)
    await db.commit()
    await db.refresh(handover)
    logger.info("Schichtübergabe erstellt: %s (%s) — Patient %s", handover.id, data.shift_type, data.patient_id)

    await emit_event(RoutingKeys.SHIFT_HANDOVER_CREATED, {
        "handover_id": str(handover.id),
        "patient_id": str(handover.patient_id),
        "shift_type": handover.shift_type,
        "handover_date": str(handover.handover_date),
    })

    return handover


async def acknowledge_handover(
    db: AsyncSession,
    handover_id: uuid.UUID,
    received_by: uuid.UUID,
) -> ShiftHandover | None:
    handover = await get_shift_handover(db, handover_id)
    if not handover:
        return None
    if handover.acknowledged_at:
        raise ValueError("Übergabe wurde bereits quittiert.")

    handover.received_by = received_by
    handover.acknowledged_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(handover)
    logger.info("Schichtübergabe quittiert: %s von %s", handover.id, received_by)
    return handover


async def delete_shift_handover(db: AsyncSession, handover_id: uuid.UUID) -> bool:
    handover = await get_shift_handover(db, handover_id)
    if not handover:
        return False
    if handover.acknowledged_at:
        raise ValueError("Quittierte Übergaben können nicht gelöscht werden.")
    await db.delete(handover)
    await db.commit()
    logger.info("Schichtübergabe gelöscht: %s", handover_id)
    return True
