"""Diagnosis service — CRUD für medizinische Diagnosen (ICD-10)."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.therapy import Diagnosis
from src.domain.schemas.diagnosis import DiagnosisCreate, DiagnosisUpdate

logger = logging.getLogger("pdms.diagnosis")


async def list_diagnoses(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    status: str | None = None,
    diagnosis_type: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    """Alle Diagnosen eines Patienten auflisten."""
    base = select(Diagnosis).where(Diagnosis.patient_id == patient_id)
    count_q = select(func.count()).select_from(Diagnosis).where(Diagnosis.patient_id == patient_id)

    if status:
        base = base.where(Diagnosis.status == status)
        count_q = count_q.where(Diagnosis.status == status)
    if diagnosis_type:
        base = base.where(Diagnosis.diagnosis_type == diagnosis_type)
        count_q = count_q.where(Diagnosis.diagnosis_type == diagnosis_type)

    total = (await db.execute(count_q)).scalar() or 0
    query = base.order_by(Diagnosis.diagnosed_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_diagnosis(db: AsyncSession, diagnosis_id: uuid.UUID) -> Diagnosis | None:
    """Einzelne Diagnose laden."""
    result = await db.execute(select(Diagnosis).where(Diagnosis.id == diagnosis_id))
    return result.scalar_one_or_none()


async def create_diagnosis(
    db: AsyncSession,
    data: DiagnosisCreate,
    diagnosed_by: uuid.UUID | None = None,
) -> Diagnosis:
    """Neue Diagnose erstellen."""
    diagnosis = Diagnosis(
        patient_id=data.patient_id,
        encounter_id=data.encounter_id,
        icd_code=data.icd_code,
        title=data.title,
        description=data.description,
        diagnosis_type=data.diagnosis_type,
        severity=data.severity,
        body_site=data.body_site,
        laterality=data.laterality,
        onset_date=data.onset_date,
        notes=data.notes,
        diagnosed_by=diagnosed_by,
    )
    db.add(diagnosis)
    await db.commit()
    await db.refresh(diagnosis)
    logger.info(
        "Diagnose erstellt: %s — %s (%s) — Patient %s",
        diagnosis.id, data.title, data.icd_code or "ohne ICD", data.patient_id,
    )
    return diagnosis


async def update_diagnosis(
    db: AsyncSession,
    diagnosis_id: uuid.UUID,
    data: DiagnosisUpdate,
) -> Diagnosis | None:
    """Bestehende Diagnose aktualisieren."""
    diagnosis = await get_diagnosis(db, diagnosis_id)
    if not diagnosis:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(diagnosis, field, value)

    await db.commit()
    await db.refresh(diagnosis)
    logger.info("Diagnose aktualisiert: %s", diagnosis_id)
    return diagnosis


async def delete_diagnosis(db: AsyncSession, diagnosis_id: uuid.UUID) -> bool:
    """Diagnose löschen."""
    diagnosis = await get_diagnosis(db, diagnosis_id)
    if not diagnosis:
        return False
    await db.delete(diagnosis)
    await db.commit()
    logger.info("Diagnose gelöscht: %s", diagnosis_id)
    return True
