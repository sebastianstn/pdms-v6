"""Home-visit service — CRUD, status transitions, today's visits."""

import logging
import uuid
from datetime import UTC, date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.home_spital import HomeVisit
from src.domain.schemas.home_spital import HomeVisitCreate, HomeVisitUpdate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.home_visits")


# ─── CRUD ──────────────────────────────────────────────────────


async def list_home_visits(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    from_date: date | None = None,
    to_date: date | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[HomeVisit], int]:
    base = select(HomeVisit).where(HomeVisit.patient_id == patient_id)
    count_q = select(func.count()).select_from(HomeVisit).where(HomeVisit.patient_id == patient_id)

    if from_date:
        base = base.where(HomeVisit.planned_date >= from_date)
        count_q = count_q.where(HomeVisit.planned_date >= from_date)
    if to_date:
        base = base.where(HomeVisit.planned_date <= to_date)
        count_q = count_q.where(HomeVisit.planned_date <= to_date)
    if status:
        base = base.where(HomeVisit.status == status)
        count_q = count_q.where(HomeVisit.status == status)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * per_page
    rows = (await db.execute(
        base.order_by(HomeVisit.planned_date, HomeVisit.planned_start).offset(offset).limit(per_page)
    )).scalars().all()
    return rows, total


async def list_today_home_visits(
    db: AsyncSession,
    *,
    target_date: date | None = None,
) -> list[HomeVisit]:
    """Alle Hausbesuche für heute (oder angegebenes Datum) — über alle Patienten."""
    d = target_date or date.today()
    rows = (await db.execute(
        select(HomeVisit)
        .where(HomeVisit.planned_date == d)
        .order_by(HomeVisit.planned_start)
    )).scalars().all()
    return rows


async def get_home_visit(db: AsyncSession, visit_id: uuid.UUID) -> HomeVisit | None:
    return (await db.execute(select(HomeVisit).where(HomeVisit.id == visit_id))).scalar_one_or_none()


async def create_home_visit(db: AsyncSession, data: HomeVisitCreate) -> HomeVisit:
    visit = HomeVisit(**data.model_dump())
    db.add(visit)
    await db.commit()
    await db.refresh(visit)
    logger.info("HomeVisit created: %s patient=%s date=%s", visit.id, visit.patient_id, visit.planned_date)

    await emit_event(RoutingKeys.HOME_VISIT_CREATED, {
        "home_visit_id": str(visit.id),
        "patient_id": str(visit.patient_id),
        "planned_date": str(visit.planned_date),
        "assigned_nurse_name": visit.assigned_nurse_name,
    })
    return visit


async def update_home_visit(db: AsyncSession, visit_id: uuid.UUID, data: HomeVisitUpdate) -> HomeVisit | None:
    visit = await get_home_visit(db, visit_id)
    if not visit:
        return None

    old_status = visit.status
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(visit, field, value)

    # Auto-calculate duration on completion
    if visit.status == "completed" and visit.actual_arrival and visit.actual_departure:
        visit.visit_duration_minutes = int((visit.actual_departure - visit.actual_arrival).total_seconds() / 60)

    await db.commit()
    await db.refresh(visit)

    # Emit status change event
    if data.status and data.status != old_status:
        await emit_event(RoutingKeys.HOME_VISIT_STATUS_CHANGED, {
            "home_visit_id": str(visit.id),
            "patient_id": str(visit.patient_id),
            "old_status": old_status,
            "new_status": visit.status,
        })

    logger.info("HomeVisit updated: %s status=%s", visit.id, visit.status)
    return visit


async def delete_home_visit(db: AsyncSession, visit_id: uuid.UUID) -> bool:
    visit = await get_home_visit(db, visit_id)
    if not visit:
        return False
    await db.delete(visit)
    await db.commit()
    return True


# ─── Status shortcuts ──────────────────────────────────────────


async def start_travel(db: AsyncSession, visit_id: uuid.UUID) -> HomeVisit | None:
    """Mark nurse as en route."""
    return await update_home_visit(db, visit_id, HomeVisitUpdate(status="en_route"))


async def arrive(db: AsyncSession, visit_id: uuid.UUID) -> HomeVisit | None:
    """Mark arrival at patient's home."""
    return await update_home_visit(
        db, visit_id,
        HomeVisitUpdate(status="arrived", actual_arrival=datetime.now(UTC)),
    )


async def complete_visit(
    db: AsyncSession,
    visit_id: uuid.UUID,
    data: HomeVisitUpdate,
) -> HomeVisit | None:
    """Complete a home visit with documentation."""
    data.status = "completed"
    if not data.actual_departure:
        data.actual_departure = datetime.now(UTC)
    return await update_home_visit(db, visit_id, data)
