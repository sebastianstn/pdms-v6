"""Patient business logic — CRUD + status management."""

import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.patient import Patient
from src.domain.schemas.patient import PatientCreate, PatientUpdate


async def create_patient(session: AsyncSession, data: PatientCreate) -> Patient:
    patient = Patient(**data.model_dump())
    session.add(patient)
    await session.flush()
    return patient


async def get_patient(session: AsyncSession, patient_id: uuid.UUID) -> Patient | None:
    result = await session.execute(
        select(Patient).where(Patient.id == patient_id, Patient.is_deleted == False)  # noqa: E712
    )
    return result.scalar_one_or_none()


async def list_patients(
    session: AsyncSession, *, page: int = 1, per_page: int = 20, search: str | None = None
) -> tuple[list[Patient], int]:
    query = select(Patient).where(Patient.is_deleted == False)  # noqa: E712

    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (Patient.first_name.ilike(search_filter))
            | (Patient.last_name.ilike(search_filter))
            | (Patient.ahv_number.ilike(search_filter))
        )

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    # Paginate
    query = query.offset((page - 1) * per_page).limit(per_page).order_by(Patient.last_name)
    result = await session.execute(query)
    patients = list(result.scalars().all())

    return patients, total


async def update_patient(session: AsyncSession, patient_id: uuid.UUID, data: PatientUpdate) -> Patient | None:
    patient = await get_patient(session, patient_id)
    if not patient:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    await session.flush()
    return patient


async def soft_delete_patient(session: AsyncSession, patient_id: uuid.UUID) -> bool:
    patient = await get_patient(session, patient_id)
    if not patient:
        return False
    patient.is_deleted = True
    await session.flush()
    return True
