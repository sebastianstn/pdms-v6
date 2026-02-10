"""Fluid balance service — CRUD, 24h summary, balance calculation."""

import logging
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.fluid_balance import FluidEntry
from src.domain.schemas.fluid_balance import FluidEntryCreate, FluidEntryUpdate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.fluid")


# ─── CRUD ───────────────────────────────────────────────────────

async def list_fluid_entries(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    direction: str | None = None,
    category: str | None = None,
    since: datetime | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    """List fluid entries with optional filters, paginated."""
    base = select(FluidEntry).where(FluidEntry.patient_id == patient_id)
    count_q = select(func.count()).select_from(FluidEntry).where(FluidEntry.patient_id == patient_id)

    if direction:
        base = base.where(FluidEntry.direction == direction)
        count_q = count_q.where(FluidEntry.direction == direction)
    if category:
        base = base.where(FluidEntry.category == category)
        count_q = count_q.where(FluidEntry.category == category)
    if since:
        base = base.where(FluidEntry.recorded_at >= since)
        count_q = count_q.where(FluidEntry.recorded_at >= since)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * per_page
    query = base.order_by(FluidEntry.recorded_at.desc()).offset(offset).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_fluid_entry(db: AsyncSession, entry_id: uuid.UUID) -> FluidEntry | None:
    return (await db.execute(select(FluidEntry).where(FluidEntry.id == entry_id))).scalar_one_or_none()


async def create_fluid_entry(
    db: AsyncSession,
    data: FluidEntryCreate,
    recorded_by: uuid.UUID | None = None,
) -> FluidEntry:
    """Create a single fluid intake/output entry."""
    entry = FluidEntry(
        patient_id=data.patient_id,
        encounter_id=data.encounter_id,
        direction=data.direction,
        category=data.category,
        display_name=data.display_name,
        volume_ml=data.volume_ml,
        route=data.route,
        recorded_at=data.recorded_at or datetime.now(UTC),
        recorded_by=recorded_by,
        notes=data.notes,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)

    await emit_event(RoutingKeys.FLUID_RECORDED, {
        "patient_id": str(data.patient_id),
        "direction": data.direction,
        "category": data.category,
        "volume_ml": data.volume_ml,
    })

    logger.info(
        "Fluid entry created: %s %s %.0f mL for patient %s",
        data.direction, data.category, data.volume_ml, data.patient_id,
    )
    return entry


async def update_fluid_entry(
    db: AsyncSession,
    entry_id: uuid.UUID,
    data: FluidEntryUpdate,
) -> FluidEntry | None:
    entry = await get_fluid_entry(db, entry_id)
    if not entry:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(entry, field, value)

    await db.commit()
    await db.refresh(entry)
    return entry


async def delete_fluid_entry(db: AsyncSession, entry_id: uuid.UUID) -> bool:
    entry = await get_fluid_entry(db, entry_id)
    if not entry:
        return False
    await db.delete(entry)
    await db.commit()
    return True


# ─── 24-hour Balance Summary ───────────────────────────────────

async def get_fluid_balance_summary(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    hours: int = 24,
) -> dict:
    """Calculate fluid balance for the last N hours."""
    now = datetime.now(UTC)
    period_start = now - timedelta(hours=hours)
    period_end = now

    # Get all entries in the period
    q = (
        select(FluidEntry)
        .where(
            FluidEntry.patient_id == patient_id,
            FluidEntry.recorded_at >= period_start,
            FluidEntry.recorded_at <= period_end,
        )
        .order_by(FluidEntry.recorded_at)
    )
    rows = (await db.execute(q)).scalars().all()

    intake_by_cat: dict[str, float] = {}
    output_by_cat: dict[str, float] = {}
    total_intake = 0.0
    total_output = 0.0

    for entry in rows:
        if entry.direction == "intake":
            total_intake += entry.volume_ml
            intake_by_cat[entry.category] = intake_by_cat.get(entry.category, 0) + entry.volume_ml
        else:
            total_output += entry.volume_ml
            output_by_cat[entry.category] = output_by_cat.get(entry.category, 0) + entry.volume_ml

    return {
        "period_start": period_start,
        "period_end": period_end,
        "total_intake_ml": total_intake,
        "total_output_ml": total_output,
        "balance_ml": total_intake - total_output,
        "intake_by_category": intake_by_cat,
        "output_by_category": output_by_cat,
        "entry_count": len(rows),
    }
