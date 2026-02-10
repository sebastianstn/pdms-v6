"""Appointment & DischargeCriteria Pydantic schemas."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

# ─── Enums / Labels ────────────────────────────────────────────

APPOINTMENT_TYPES = (
    "hausbesuch", "teleconsult", "konsil", "ambulant",
    "labor", "entlassung", "spitex", "physiotherapie",
)

APPOINTMENT_TYPE_LABELS: dict[str, str] = {
    "hausbesuch": "Hausbesuch",
    "teleconsult": "Teleconsult",
    "konsil": "Konsil",
    "ambulant": "Ambulant",
    "labor": "Labor",
    "entlassung": "Entlassung",
    "spitex": "Spitex",
    "physiotherapie": "Physiotherapie",
}

APPOINTMENT_STATUSES = ("planned", "confirmed", "in_progress", "completed", "cancelled", "no_show")

APPOINTMENT_STATUS_LABELS: dict[str, str] = {
    "planned": "Geplant",
    "confirmed": "Bestätigt",
    "in_progress": "Laufend",
    "completed": "Durchgeführt",
    "cancelled": "Abgesagt",
    "no_show": "Nicht erschienen",
}

# ─── Create / Update ──────────────────────────────────────────


class AppointmentCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    appointment_type: str = Field(..., pattern=r"^(hausbesuch|teleconsult|konsil|ambulant|labor|entlassung|spitex|physiotherapie)$")
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    location: str | None = None
    scheduled_date: date
    start_time: datetime
    end_time: datetime | None = None
    duration_minutes: int = Field(30, ge=5, le=480)
    assigned_to: uuid.UUID | None = None
    assigned_name: str | None = None
    is_recurring: bool = False
    recurrence_rule: str | None = Field(None, pattern=r"^(daily|weekly|biweekly|monthly)$")
    recurrence_end: date | None = None
    transport_required: bool = False
    transport_type: str | None = None
    transport_notes: str | None = None
    notes: str | None = None


class AppointmentUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    description: str | None = None
    location: str | None = None
    scheduled_date: date | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    duration_minutes: int | None = Field(None, ge=5, le=480)
    assigned_to: uuid.UUID | None = None
    assigned_name: str | None = None
    status: str | None = Field(None, pattern=r"^(planned|confirmed|in_progress|completed|cancelled|no_show)$")
    transport_required: bool | None = None
    transport_type: str | None = None
    transport_notes: str | None = None
    notes: str | None = None


class AppointmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    appointment_type: str
    title: str
    description: str | None
    location: str | None
    scheduled_date: date
    start_time: datetime
    end_time: datetime | None
    duration_minutes: int
    assigned_to: uuid.UUID | None
    assigned_name: str | None
    status: str
    is_recurring: bool
    recurrence_rule: str | None
    recurrence_end: date | None
    parent_appointment_id: uuid.UUID | None
    transport_required: bool
    transport_type: str | None
    transport_notes: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class PaginatedAppointments(BaseModel):
    items: list[AppointmentResponse]
    total: int
    page: int = 1
    per_page: int = 50


# ─── Discharge Criteria ───────────────────────────────────────


class DischargeCriteriaUpdate(BaseModel):
    planned_discharge_date: date | None = None
    crp_declining: bool | None = None
    crp_below_50: bool | None = None
    afebrile_48h: bool | None = None
    oral_stable_48h: bool | None = None
    clinical_improvement: bool | None = None
    aftercare_organized: bool | None = None
    followup_gp: str | None = None
    followup_gp_date: date | None = None
    followup_spitex: str | None = None
    followup_spitex_date: date | None = None
    notes: str | None = None


class DischargeCriteriaResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    planned_discharge_date: date | None
    actual_discharge_date: date | None
    crp_declining: bool
    crp_below_50: bool
    afebrile_48h: bool
    oral_stable_48h: bool
    clinical_improvement: bool
    aftercare_organized: bool
    followup_gp: str | None
    followup_gp_date: date | None
    followup_spitex: str | None
    followup_spitex_date: date | None
    notes: str | None
    updated_at: datetime

    @property
    def criteria_met(self) -> int:
        """Anzahl erfüllter Kriterien (max 6)."""
        return sum([
            self.crp_declining,
            self.crp_below_50,
            self.afebrile_48h,
            self.oral_stable_48h,
            self.clinical_improvement,
            self.aftercare_organized,
        ])

    @property
    def progress_percent(self) -> int:
        return round(self.criteria_met / 6 * 100)
