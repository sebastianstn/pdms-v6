"""Consultation service — CRUD for medical consultations (Konsilien)."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.therapy import Consultation
from src.domain.schemas.consultation import ConsultationCreate, ConsultationUpdate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.consultation")


async def list_consultations(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    status: str | None = None,
    specialty: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    base = select(Consultation).where(Consultation.patient_id == patient_id)
    count_q = select(func.count()).select_from(Consultation).where(Consultation.patient_id == patient_id)

    if status:
        base = base.where(Consultation.status == status)
        count_q = count_q.where(Consultation.status == status)
    if specialty:
        base = base.where(Consultation.specialty == specialty)
        count_q = count_q.where(Consultation.specialty == specialty)

    total = (await db.execute(count_q)).scalar() or 0
    query = base.order_by(Consultation.requested_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_consultation(db: AsyncSession, consultation_id: uuid.UUID) -> Consultation | None:
    result = await db.execute(select(Consultation).where(Consultation.id == consultation_id))
    return result.scalar_one_or_none()


async def create_consultation(
    db: AsyncSession,
    data: ConsultationCreate,
    requested_by: uuid.UUID | None = None,
) -> Consultation:
    consultation = Consultation(
        patient_id=data.patient_id,
        encounter_id=data.encounter_id,
        specialty=data.specialty,
        urgency=data.urgency,
        question=data.question,
        clinical_context=data.clinical_context,
        requested_by=requested_by,
    )
    db.add(consultation)
    await db.commit()
    await db.refresh(consultation)
    logger.info("Konsil angefragt: %s (%s) — Patient %s", consultation.id, data.specialty, data.patient_id)

    await emit_event(RoutingKeys.CONSULTATION_REQUESTED, {
        "consultation_id": str(consultation.id),
        "patient_id": str(consultation.patient_id),
        "specialty": consultation.specialty,
        "urgency": consultation.urgency,
        "requested_by": str(requested_by) if requested_by else None,
    })

    return consultation


async def respond_to_consultation(
    db: AsyncSession,
    consultation_id: uuid.UUID,
    data: ConsultationUpdate,
    consultant_id: uuid.UUID | None = None,
) -> Consultation | None:
    consultation = await get_consultation(db, consultation_id)
    if not consultation:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(consultation, field, value)

    if consultant_id:
        consultation.consultant_id = consultant_id
    if data.response:
        consultation.responded_at = datetime.now(UTC)
        consultation.status = "completed"

    consultation.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(consultation)
    logger.info("Konsil beantwortet: %s", consultation.id)

    if consultation.status == "completed":
        await emit_event(RoutingKeys.CONSULTATION_COMPLETED, {
            "consultation_id": str(consultation.id),
            "patient_id": str(consultation.patient_id),
            "specialty": consultation.specialty,
        })

    return consultation


async def cancel_consultation(db: AsyncSession, consultation_id: uuid.UUID) -> Consultation | None:
    consultation = await get_consultation(db, consultation_id)
    if not consultation:
        return None
    if consultation.status == "completed":
        raise ValueError("Abgeschlossene Konsilien können nicht storniert werden.")
    consultation.status = "cancelled"
    consultation.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(consultation)
    logger.info("Konsil storniert: %s", consultation_id)
    return consultation
