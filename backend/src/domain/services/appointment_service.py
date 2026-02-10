"""Appointment service — CRUD, recurring-expansion, week-view, discharge criteria."""

import logging
import uuid
from datetime import UTC, date, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.planning import Appointment, DischargeCriteria
from src.domain.schemas.appointment import AppointmentCreate, AppointmentUpdate, DischargeCriteriaUpdate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.appointments")

# ─── Recurrence helpers ────────────────────────────────────────

_RULE_DELTA = {
    "daily": timedelta(days=1),
    "weekly": timedelta(weeks=1),
    "biweekly": timedelta(weeks=2),
    "monthly": timedelta(days=30),  # approx
}


# ─── Appointment CRUD ─────────────────────────────────────────


async def list_appointments(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    from_date: date | None = None,
    to_date: date | None = None,
    appointment_type: str | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[Appointment], int]:
    base = select(Appointment).where(Appointment.patient_id == patient_id)
    count_q = select(func.count()).select_from(Appointment).where(Appointment.patient_id == patient_id)

    if from_date:
        base = base.where(Appointment.scheduled_date >= from_date)
        count_q = count_q.where(Appointment.scheduled_date >= from_date)
    if to_date:
        base = base.where(Appointment.scheduled_date <= to_date)
        count_q = count_q.where(Appointment.scheduled_date <= to_date)
    if appointment_type:
        base = base.where(Appointment.appointment_type == appointment_type)
        count_q = count_q.where(Appointment.appointment_type == appointment_type)
    if status:
        base = base.where(Appointment.status == status)
        count_q = count_q.where(Appointment.status == status)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * per_page
    rows = (await db.execute(
        base.order_by(Appointment.scheduled_date, Appointment.start_time).offset(offset).limit(per_page)
    )).scalars().all()
    return rows, total


async def get_appointment(db: AsyncSession, appointment_id: uuid.UUID) -> Appointment | None:
    return (await db.execute(select(Appointment).where(Appointment.id == appointment_id))).scalar_one_or_none()


async def create_appointment(db: AsyncSession, data: AppointmentCreate) -> Appointment:
    appt = Appointment(**data.model_dump())
    db.add(appt)
    await db.commit()
    await db.refresh(appt)
    logger.info("Appointment created: %s type=%s date=%s", appt.id, appt.appointment_type, appt.scheduled_date)

    await emit_event(RoutingKeys.APPOINTMENT_CREATED, {
        "appointment_id": str(appt.id),
        "patient_id": str(appt.patient_id),
        "appointment_type": appt.appointment_type,
        "scheduled_date": str(appt.scheduled_date),
    })

    # Generate recurring instances
    if data.is_recurring and data.recurrence_rule and data.recurrence_end:
        await _expand_recurrence(db, appt, data.recurrence_rule, data.recurrence_end)

    return appt


async def update_appointment(db: AsyncSession, appointment_id: uuid.UUID, data: AppointmentUpdate) -> Appointment | None:
    appt = await get_appointment(db, appointment_id)
    if not appt:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(appt, field, value)
    await db.commit()
    await db.refresh(appt)
    logger.info("Appointment updated: %s", appt.id)
    return appt


async def cancel_appointment(db: AsyncSession, appointment_id: uuid.UUID) -> Appointment | None:
    appt = await get_appointment(db, appointment_id)
    if not appt:
        return None
    appt.status = "cancelled"
    await db.commit()
    await db.refresh(appt)
    logger.info("Appointment cancelled: %s", appt.id)

    await emit_event(RoutingKeys.APPOINTMENT_CANCELLED, {
        "appointment_id": str(appt.id),
        "patient_id": str(appt.patient_id),
    })
    return appt


async def complete_appointment(db: AsyncSession, appointment_id: uuid.UUID) -> Appointment | None:
    appt = await get_appointment(db, appointment_id)
    if not appt:
        return None
    appt.status = "completed"
    await db.commit()
    await db.refresh(appt)
    logger.info("Appointment completed: %s", appt.id)
    return appt


async def delete_appointment(db: AsyncSession, appointment_id: uuid.UUID) -> bool:
    appt = await get_appointment(db, appointment_id)
    if not appt:
        return False
    await db.delete(appt)
    await db.commit()
    return True


# ─── Week View ─────────────────────────────────────────────────


async def get_week_appointments(
    db: AsyncSession,
    patient_id: uuid.UUID,
    week_start: date,
) -> list[Appointment]:
    """Alle Termine einer Kalenderwoche."""
    week_end = week_start + timedelta(days=6)
    rows = (await db.execute(
        select(Appointment)
        .where(
            Appointment.patient_id == patient_id,
            Appointment.scheduled_date >= week_start,
            Appointment.scheduled_date <= week_end,
        )
        .order_by(Appointment.scheduled_date, Appointment.start_time)
    )).scalars().all()
    return rows


# ─── Recurrence Expansion ─────────────────────────────────────


async def _expand_recurrence(
    db: AsyncSession,
    parent: Appointment,
    rule: str,
    end_date: date,
) -> None:
    delta = _RULE_DELTA.get(rule)
    if not delta:
        return
    current = parent.scheduled_date + delta if isinstance(delta, timedelta) else parent.scheduled_date + delta
    time_offset = (parent.start_time - datetime.combine(parent.scheduled_date, parent.start_time.time().replace(tzinfo=None), tzinfo=parent.start_time.tzinfo)) if parent.start_time else timedelta()

    while current <= end_date:
        child = Appointment(
            patient_id=parent.patient_id,
            encounter_id=parent.encounter_id,
            appointment_type=parent.appointment_type,
            title=parent.title,
            description=parent.description,
            location=parent.location,
            scheduled_date=current,
            start_time=datetime.combine(current, parent.start_time.time(), tzinfo=parent.start_time.tzinfo) if parent.start_time else datetime.now(UTC),
            end_time=datetime.combine(current, parent.end_time.time(), tzinfo=parent.end_time.tzinfo) if parent.end_time else None,
            duration_minutes=parent.duration_minutes,
            assigned_to=parent.assigned_to,
            assigned_name=parent.assigned_name,
            status="planned",
            is_recurring=True,
            recurrence_rule=rule,
            parent_appointment_id=parent.id,
            transport_required=parent.transport_required,
            transport_type=parent.transport_type,
        )
        db.add(child)
        current += delta
    await db.commit()
    logger.info("Expanded recurrence for %s, rule=%s until %s", parent.id, rule, end_date)


# ─── Discharge Criteria ───────────────────────────────────────


async def get_discharge_criteria(db: AsyncSession, patient_id: uuid.UUID) -> DischargeCriteria | None:
    return (await db.execute(
        select(DischargeCriteria).where(DischargeCriteria.patient_id == patient_id)
    )).scalar_one_or_none()


async def upsert_discharge_criteria(
    db: AsyncSession,
    patient_id: uuid.UUID,
    data: DischargeCriteriaUpdate,
    encounter_id: uuid.UUID | None = None,
) -> DischargeCriteria:
    criteria = await get_discharge_criteria(db, patient_id)
    if criteria is None:
        criteria = DischargeCriteria(patient_id=patient_id, encounter_id=encounter_id)
        db.add(criteria)

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(criteria, field, value)

    await db.commit()
    await db.refresh(criteria)
    logger.info("Discharge criteria updated: patient=%s, met=%d/6", patient_id, sum([
        criteria.crp_declining, criteria.crp_below_50, criteria.afebrile_48h,
        criteria.oral_stable_48h, criteria.clinical_improvement, criteria.aftercare_organized,
    ]))
    return criteria
