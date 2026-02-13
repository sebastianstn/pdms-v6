"""Nursing Diagnosis service — CRUD for NANDA-I based nursing diagnoses."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.therapy import NursingDiagnosis
from src.domain.schemas.nursing_diagnosis import NursingDiagnosisCreate, NursingDiagnosisUpdate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.nursing_diagnosis")


async def list_nursing_diagnoses(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    status: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    base = select(NursingDiagnosis).where(NursingDiagnosis.patient_id == patient_id)
    count_q = select(func.count()).select_from(NursingDiagnosis).where(NursingDiagnosis.patient_id == patient_id)

    if status:
        base = base.where(NursingDiagnosis.status == status)
        count_q = count_q.where(NursingDiagnosis.status == status)

    total = (await db.execute(count_q)).scalar() or 0
    query = base.order_by(NursingDiagnosis.diagnosed_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_nursing_diagnosis(db: AsyncSession, diagnosis_id: uuid.UUID) -> NursingDiagnosis | None:
    result = await db.execute(select(NursingDiagnosis).where(NursingDiagnosis.id == diagnosis_id))
    return result.scalar_one_or_none()


async def create_nursing_diagnosis(
    db: AsyncSession,
    data: NursingDiagnosisCreate,
    diagnosed_by: uuid.UUID | None = None,
) -> NursingDiagnosis:
    diagnosis = NursingDiagnosis(
        **data.model_dump(),
        diagnosed_by=diagnosed_by,
    )
    db.add(diagnosis)
    await db.commit()
    await db.refresh(diagnosis)
    logger.info("Pflegediagnose erstellt: %s '%s' — Patient %s", diagnosis.id, data.title, data.patient_id)

    await emit_event(RoutingKeys.NURSING_DIAGNOSIS_CREATED, {
        "diagnosis_id": str(diagnosis.id),
        "patient_id": str(diagnosis.patient_id),
        "title": diagnosis.title,
        "nanda_code": diagnosis.nanda_code,
    })

    return diagnosis


async def update_nursing_diagnosis(
    db: AsyncSession,
    diagnosis_id: uuid.UUID,
    data: NursingDiagnosisUpdate,
) -> NursingDiagnosis | None:
    diagnosis = await get_nursing_diagnosis(db, diagnosis_id)
    if not diagnosis:
        return None

    was_active = diagnosis.status == "active"

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(diagnosis, field, value)

    if was_active and diagnosis.status == "resolved":
        diagnosis.resolved_at = datetime.now(UTC)

    diagnosis.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(diagnosis)
    logger.info("Pflegediagnose aktualisiert: %s", diagnosis.id)
    return diagnosis


async def delete_nursing_diagnosis(db: AsyncSession, diagnosis_id: uuid.UUID) -> bool:
    diagnosis = await get_nursing_diagnosis(db, diagnosis_id)
    if not diagnosis:
        return False
    await db.delete(diagnosis)
    await db.commit()
    logger.info("Pflegediagnose gelöscht: %s", diagnosis_id)
    return True
