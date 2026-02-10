"""Appointment API endpoints — CRUD, week-view, cancel, complete, discharge criteria."""

import uuid
from datetime import date, timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.schemas.appointment import (
    APPOINTMENT_STATUS_LABELS,
    APPOINTMENT_TYPE_LABELS,
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    DischargeCriteriaResponse,
    DischargeCriteriaUpdate,
    PaginatedAppointments,
)
from src.domain.services.appointment_service import (
    cancel_appointment,
    complete_appointment,
    create_appointment,
    delete_appointment,
    get_appointment,
    get_discharge_criteria,
    get_week_appointments,
    list_appointments,
    update_appointment,
    upsert_discharge_criteria,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


# ─── Meta ──────────────────────────────────────────────────────


@router.get("/appointments/meta")
async def appointment_meta(user: CurrentUser):
    return {
        "appointment_types": APPOINTMENT_TYPE_LABELS,
        "appointment_statuses": APPOINTMENT_STATUS_LABELS,
    }


# ─── List ──────────────────────────────────────────────────────


@router.get("/patients/{patient_id}/appointments", response_model=PaginatedAppointments)
async def list_patient_appointments(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    from_date: date | None = None,
    to_date: date | None = None,
    appointment_type: str | None = None,
    status: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    items, total = await list_appointments(
        db, patient_id,
        from_date=from_date, to_date=to_date,
        appointment_type=appointment_type, status=status,
        page=page, per_page=per_page,
    )
    return PaginatedAppointments(
        items=[AppointmentResponse.model_validate(a) for a in items],
        total=total, page=page, per_page=per_page,
    )


# ─── Week View ─────────────────────────────────────────────────


@router.get("/patients/{patient_id}/appointments/week", response_model=list[AppointmentResponse])
async def patient_week_appointments(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    week_start: date | None = None,
):
    """Wochenansicht — alle Termine einer KW (default: aktuelle Woche)."""
    if week_start is None:
        today = date.today()
        week_start = today - timedelta(days=today.weekday())  # Montag
    rows = await get_week_appointments(db, patient_id, week_start)
    return [AppointmentResponse.model_validate(a) for a in rows]


# ─── Detail ────────────────────────────────────────────────────


@router.get("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def get_appointment_endpoint(
    appointment_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    appt = await get_appointment(db, appointment_id)
    if not appt:
        raise HTTPException(404, "Termin nicht gefunden")
    return AppointmentResponse.model_validate(appt)


# ─── Create ────────────────────────────────────────────────────


@router.post("/appointments", response_model=AppointmentResponse, status_code=201)
async def create_appointment_endpoint(
    data: AppointmentCreate,
    db: DbSession,
    user: CurrentUser,
):
    appt = await create_appointment(db, data)
    return AppointmentResponse.model_validate(appt)


# ─── Update ────────────────────────────────────────────────────


@router.patch("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment_endpoint(
    appointment_id: uuid.UUID,
    data: AppointmentUpdate,
    db: DbSession,
    user: CurrentUser,
):
    appt = await update_appointment(db, appointment_id, data)
    if not appt:
        raise HTTPException(404, "Termin nicht gefunden")
    return AppointmentResponse.model_validate(appt)


# ─── Cancel ────────────────────────────────────────────────────


@router.post("/appointments/{appointment_id}/cancel", response_model=AppointmentResponse)
async def cancel_appointment_endpoint(
    appointment_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    appt = await cancel_appointment(db, appointment_id)
    if not appt:
        raise HTTPException(404, "Termin nicht gefunden")
    return AppointmentResponse.model_validate(appt)


# ─── Complete ──────────────────────────────────────────────────


@router.post("/appointments/{appointment_id}/complete", response_model=AppointmentResponse)
async def complete_appointment_endpoint(
    appointment_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    appt = await complete_appointment(db, appointment_id)
    if not appt:
        raise HTTPException(404, "Termin nicht gefunden")
    return AppointmentResponse.model_validate(appt)


# ─── Delete ────────────────────────────────────────────────────


@router.delete("/appointments/{appointment_id}", status_code=204)
async def delete_appointment_endpoint(
    appointment_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    deleted = await delete_appointment(db, appointment_id)
    if not deleted:
        raise HTTPException(404, "Termin nicht gefunden")


# ─── Discharge Criteria ───────────────────────────────────────


@router.get("/patients/{patient_id}/discharge-criteria", response_model=DischargeCriteriaResponse | None)
async def get_discharge_criteria_endpoint(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
):
    return await get_discharge_criteria(db, patient_id)


@router.put("/patients/{patient_id}/discharge-criteria", response_model=DischargeCriteriaResponse)
async def upsert_discharge_criteria_endpoint(
    patient_id: uuid.UUID,
    data: DischargeCriteriaUpdate,
    db: DbSession,
    user: CurrentUser,
    encounter_id: uuid.UUID | None = None,
):
    return await upsert_discharge_criteria(db, patient_id, data, encounter_id=encounter_id)
