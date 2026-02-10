"""Home-Spital Pydantic schemas — HomeVisit, Teleconsult, RemoteDevice, SelfMedicationLog."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

# ─── Enums / Labels ────────────────────────────────────────────

HOME_VISIT_STATUSES = ("planned", "en_route", "arrived", "in_progress", "completed", "cancelled")

HOME_VISIT_STATUS_LABELS: dict[str, str] = {
    "planned": "Geplant",
    "en_route": "Unterwegs",
    "arrived": "Vor Ort",
    "in_progress": "Laufend",
    "completed": "Durchgeführt",
    "cancelled": "Abgesagt",
}

PATIENT_CONDITIONS = ("stable", "improved", "deteriorated", "critical")

PATIENT_CONDITION_LABELS: dict[str, str] = {
    "stable": "Stabil",
    "improved": "Verbessert",
    "deteriorated": "Verschlechtert",
    "critical": "Kritisch",
}

TELECONSULT_STATUSES = ("scheduled", "waiting", "active", "completed", "no_show", "technical_issue")

TELECONSULT_STATUS_LABELS: dict[str, str] = {
    "scheduled": "Geplant",
    "waiting": "Wartezimmer",
    "active": "Aktiv",
    "completed": "Abgeschlossen",
    "no_show": "Nicht erschienen",
    "technical_issue": "Technisches Problem",
}

TELECONSULT_PLATFORMS = ("zoom", "teams", "hin_talk", "other")

DEVICE_TYPES = ("pulsoximeter", "blood_pressure", "scale", "thermometer", "glucometer")

DEVICE_TYPE_LABELS: dict[str, str] = {
    "pulsoximeter": "Pulsoximeter",
    "blood_pressure": "Blutdruckmessgerät",
    "scale": "Waage",
    "thermometer": "Thermometer",
    "glucometer": "Glukometer",
}

SELF_MED_STATUSES = ("pending", "confirmed", "missed", "skipped")

SELF_MED_STATUS_LABELS: dict[str, str] = {
    "pending": "Ausstehend",
    "confirmed": "Bestätigt",
    "missed": "Verpasst",
    "skipped": "Übersprungen",
}


# ═══════════════════════════════════════════════════════════════
# HomeVisit
# ═══════════════════════════════════════════════════════════════


class HomeVisitCreate(BaseModel):
    patient_id: uuid.UUID
    appointment_id: uuid.UUID | None = None
    encounter_id: uuid.UUID | None = None
    assigned_nurse_id: uuid.UUID | None = None
    assigned_nurse_name: str | None = None
    planned_date: date
    planned_start: datetime
    planned_end: datetime | None = None
    notes: str | None = None


class HomeVisitUpdate(BaseModel):
    assigned_nurse_id: uuid.UUID | None = None
    assigned_nurse_name: str | None = None
    status: str | None = Field(None, pattern=r"^(planned|en_route|arrived|in_progress|completed|cancelled)$")
    planned_start: datetime | None = None
    planned_end: datetime | None = None
    actual_arrival: datetime | None = None
    actual_departure: datetime | None = None
    travel_time_minutes: int | None = None
    visit_duration_minutes: int | None = None
    vital_signs_recorded: bool | None = None
    medication_administered: bool | None = None
    wound_care_performed: bool | None = None
    iv_therapy_performed: bool | None = None
    blood_drawn: bool | None = None
    patient_condition: str | None = Field(None, pattern=r"^(stable|improved|deteriorated|critical)$")
    documentation: str | None = None
    notes: str | None = None


class HomeVisitResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    appointment_id: uuid.UUID | None
    encounter_id: uuid.UUID | None
    assigned_nurse_id: uuid.UUID | None
    assigned_nurse_name: str | None
    status: str
    planned_date: date
    planned_start: datetime
    planned_end: datetime | None
    actual_arrival: datetime | None
    actual_departure: datetime | None
    travel_time_minutes: int | None
    visit_duration_minutes: int | None
    vital_signs_recorded: bool
    medication_administered: bool
    wound_care_performed: bool
    iv_therapy_performed: bool
    blood_drawn: bool
    patient_condition: str | None
    documentation: str | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class PaginatedHomeVisits(BaseModel):
    items: list[HomeVisitResponse]
    total: int
    page: int = 1
    per_page: int = 50


# ═══════════════════════════════════════════════════════════════
# Teleconsult
# ═══════════════════════════════════════════════════════════════


class TeleconsultCreate(BaseModel):
    patient_id: uuid.UUID
    appointment_id: uuid.UUID | None = None
    encounter_id: uuid.UUID | None = None
    physician_id: uuid.UUID | None = None
    physician_name: str | None = None
    meeting_link: str | None = None
    meeting_platform: str | None = Field(None, pattern=r"^(zoom|teams|hin_talk|other)$")
    scheduled_start: datetime
    scheduled_end: datetime | None = None
    notes: str | None = None


class TeleconsultUpdate(BaseModel):
    physician_id: uuid.UUID | None = None
    physician_name: str | None = None
    status: str | None = Field(None, pattern=r"^(scheduled|waiting|active|completed|no_show|technical_issue)$")
    meeting_link: str | None = None
    meeting_platform: str | None = None
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    actual_start: datetime | None = None
    actual_end: datetime | None = None
    duration_minutes: int | None = None
    soap_subjective: str | None = None
    soap_objective: str | None = None
    soap_assessment: str | None = None
    soap_plan: str | None = None
    technical_quality: str | None = Field(None, pattern=r"^(good|fair|poor)$")
    followup_required: bool | None = None
    followup_notes: str | None = None
    clinical_note_id: uuid.UUID | None = None
    notes: str | None = None


class TeleconsultResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    appointment_id: uuid.UUID | None
    encounter_id: uuid.UUID | None
    physician_id: uuid.UUID | None
    physician_name: str | None
    status: str
    meeting_link: str | None
    meeting_platform: str | None
    scheduled_start: datetime
    scheduled_end: datetime | None
    actual_start: datetime | None
    actual_end: datetime | None
    duration_minutes: int | None
    soap_subjective: str | None
    soap_objective: str | None
    soap_assessment: str | None
    soap_plan: str | None
    technical_quality: str | None
    followup_required: bool
    followup_notes: str | None
    clinical_note_id: uuid.UUID | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class PaginatedTeleconsults(BaseModel):
    items: list[TeleconsultResponse]
    total: int
    page: int = 1
    per_page: int = 50


# ═══════════════════════════════════════════════════════════════
# RemoteDevice
# ═══════════════════════════════════════════════════════════════


class RemoteDeviceCreate(BaseModel):
    patient_id: uuid.UUID
    device_type: str = Field(..., pattern=r"^(pulsoximeter|blood_pressure|scale|thermometer|glucometer)$")
    device_name: str = Field(..., min_length=1, max_length=200)
    serial_number: str | None = None
    manufacturer: str | None = None
    alert_threshold_low: str | None = None
    alert_threshold_high: str | None = None
    installed_at: date | None = None
    notes: str | None = None


class RemoteDeviceUpdate(BaseModel):
    device_name: str | None = Field(None, max_length=200)
    serial_number: str | None = None
    manufacturer: str | None = None
    is_online: bool | None = None
    last_seen_at: datetime | None = None
    battery_level: int | None = Field(None, ge=0, le=100)
    last_reading_value: str | None = None
    last_reading_unit: str | None = None
    last_reading_at: datetime | None = None
    alert_threshold_low: str | None = None
    alert_threshold_high: str | None = None
    notes: str | None = None


class RemoteDeviceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    device_type: str
    device_name: str
    serial_number: str | None
    manufacturer: str | None
    is_online: bool
    last_seen_at: datetime | None
    battery_level: int | None
    last_reading_value: str | None
    last_reading_unit: str | None
    last_reading_at: datetime | None
    alert_threshold_low: str | None
    alert_threshold_high: str | None
    installed_at: date | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


# ═══════════════════════════════════════════════════════════════
# SelfMedicationLog
# ═══════════════════════════════════════════════════════════════


class SelfMedicationLogCreate(BaseModel):
    patient_id: uuid.UUID
    medication_id: uuid.UUID
    scheduled_time: datetime
    notes: str | None = None


class SelfMedicationLogUpdate(BaseModel):
    status: str | None = Field(None, pattern=r"^(pending|confirmed|missed|skipped)$")
    confirmed_at: datetime | None = None
    notes: str | None = None


class SelfMedicationLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    medication_id: uuid.UUID
    scheduled_time: datetime
    confirmed_at: datetime | None
    status: str
    notes: str | None
    created_at: datetime


class PaginatedSelfMedicationLogs(BaseModel):
    items: list[SelfMedicationLogResponse]
    total: int
    page: int = 1
    per_page: int = 50
