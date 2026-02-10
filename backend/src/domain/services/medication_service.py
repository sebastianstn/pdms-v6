"""Medication service — CRUD for prescriptions and administrations."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.clinical import Medication, MedicationAdministration
from src.domain.schemas.medication import (
    AdministrationCreate,
    MedicationCreate,
    MedicationUpdate,
)
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.medications")


# ─── Medication (Verordnung) CRUD ──────────────────────────────

async def create_medication(
    session: AsyncSession,
    data: MedicationCreate,
    prescribed_by: uuid.UUID,
) -> Medication:
    """Neue Medikamentenverordnung anlegen."""
    med = Medication(**data.model_dump(), prescribed_by=prescribed_by)
    session.add(med)
    await session.flush()
    logger.info(f"💊 Neues Medikament verordnet: {med.name} für Patient {med.patient_id}")

    await emit_event(RoutingKeys.MEDICATION_CREATED, {
        "medication_id": str(med.id),
        "patient_id": str(med.patient_id),
        "medication_name": med.name,
        "dose": med.dose,
        "prescribed_by": str(prescribed_by),
    })

    return med


async def get_medication(session: AsyncSession, medication_id: uuid.UUID) -> Medication | None:
    """Einzelne Verordnung abrufen (inkl. Verabreichungen)."""
    result = await session.execute(
        select(Medication)
        .options(selectinload(Medication.administrations))
        .where(Medication.id == medication_id)
    )
    return result.scalar_one_or_none()


async def list_medications(
    session: AsyncSession,
    patient_id: uuid.UUID,
    *,
    status_filter: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[Medication], int]:
    """Medikamente eines Patienten auflisten."""
    query = select(Medication).where(Medication.patient_id == patient_id)
    count_query = select(func.count(Medication.id)).where(Medication.patient_id == patient_id)

    if status_filter:
        query = query.where(Medication.status == status_filter)
        count_query = count_query.where(Medication.status == status_filter)

    query = query.order_by(Medication.status.asc(), Medication.start_date.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await session.execute(query)
    total_result = await session.execute(count_query)

    return list(result.scalars().all()), total_result.scalar_one()


async def update_medication(
    session: AsyncSession,
    medication_id: uuid.UUID,
    data: MedicationUpdate,
) -> Medication | None:
    """Verordnung aktualisieren (Dosis ändern, pausieren, absetzen)."""
    med = await session.get(Medication, medication_id)
    if med is None:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(med, key, value)

    await session.flush()
    logger.info(f"💊 Medikament aktualisiert: {med.name} ({medication_id}) → {update_data}")
    return med


async def discontinue_medication(
    session: AsyncSession,
    medication_id: uuid.UUID,
    reason: str | None = None,
) -> Medication | None:
    """Medikament absetzen."""
    med = await session.get(Medication, medication_id)
    if med is None:
        return None

    med.status = "discontinued"
    med.end_date = datetime.now(UTC).date()
    if reason:
        med.notes = f"{med.notes or ''}\nAbgesetzt: {reason}".strip()

    await session.flush()
    logger.info(f"💊 Medikament abgesetzt: {med.name} ({medication_id})")

    await emit_event(RoutingKeys.MEDICATION_DISCONTINUED, {
        "medication_id": str(medication_id),
        "patient_id": str(med.patient_id),
        "medication_name": med.name,
        "reason": reason,
    })

    return med


# ─── MedicationAdministration (Verabreichung) ─────────────────

async def record_administration(
    session: AsyncSession,
    data: AdministrationCreate,
    administered_by: uuid.UUID,
) -> MedicationAdministration:
    """Medikamenten-Verabreichung dokumentieren."""
    admin = MedicationAdministration(
        **data.model_dump(),
        administered_by=administered_by,
    )
    session.add(admin)
    await session.flush()
    logger.info(
        f"💊 Verabreichung dokumentiert: med={data.medication_id} "
        f"dose={data.dose_given}{data.dose_unit} status={data.status}"
    )

    await emit_event(RoutingKeys.MEDICATION_ADMINISTERED, {
        "administration_id": str(admin.id),
        "medication_id": str(data.medication_id),
        "patient_id": str(data.patient_id),
        "dose_given": str(data.dose_given),
        "dose_unit": data.dose_unit,
        "status": data.status,
        "administered_by": str(administered_by),
    })

    return admin


async def list_administrations(
    session: AsyncSession,
    medication_id: uuid.UUID,
    *,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[MedicationAdministration], int]:
    """Verabreichungshistorie eines Medikaments abrufen."""
    query = (
        select(MedicationAdministration)
        .where(MedicationAdministration.medication_id == medication_id)
        .order_by(MedicationAdministration.administered_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    count_query = (
        select(func.count(MedicationAdministration.id))
        .where(MedicationAdministration.medication_id == medication_id)
    )

    result = await session.execute(query)
    total_result = await session.execute(count_query)

    return list(result.scalars().all()), total_result.scalar_one()


async def get_patient_administrations(
    session: AsyncSession,
    patient_id: uuid.UUID,
    *,
    hours: int = 24,
) -> list[MedicationAdministration]:
    """Alle Verabreichungen eines Patienten in den letzten X Stunden."""
    from datetime import timedelta
    since = datetime.now(UTC) - timedelta(hours=hours)

    result = await session.execute(
        select(MedicationAdministration)
        .where(
            MedicationAdministration.patient_id == patient_id,
            MedicationAdministration.administered_at >= since,
        )
        .order_by(MedicationAdministration.administered_at.desc())
    )
    return list(result.scalars().all())