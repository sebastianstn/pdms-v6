"""Medication & MedicationAdministration Pydantic schemas."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


# ─── Medication (Verordnung) ──────────────────────────────────

class MedicationCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    name: str = Field(..., min_length=1, max_length=255)
    generic_name: str | None = Field(None, max_length=255)
    atc_code: str | None = Field(None, max_length=10)
    dose: str = Field(..., min_length=1, max_length=50)
    dose_unit: str = Field(..., pattern=r"^(mg|ml|IE|mcg|g|Tropfen|Hübe|Stk)$")
    route: str = Field("oral", pattern=r"^(oral|iv|sc|im|topisch|inhalativ|rektal|sublingual)$")
    frequency: str = Field(..., min_length=1, max_length=100)
    start_date: date
    end_date: date | None = None
    reason: str | None = None
    notes: str | None = None
    is_prn: bool = False


class MedicationUpdate(BaseModel):
    dose: str | None = Field(None, max_length=50)
    dose_unit: str | None = None
    frequency: str | None = None
    end_date: date | None = None
    status: str | None = Field(None, pattern=r"^(active|paused|discontinued|completed)$")
    reason: str | None = None
    notes: str | None = None
    is_prn: bool | None = None


class MedicationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    name: str
    generic_name: str | None
    atc_code: str | None
    dose: str
    dose_unit: str
    route: str
    frequency: str
    start_date: date
    end_date: date | None
    status: str
    reason: str | None
    notes: str | None
    prescribed_by: uuid.UUID | None
    is_prn: bool
    created_at: datetime
    updated_at: datetime


class PaginatedMedications(BaseModel):
    items: list[MedicationResponse]
    total: int
    page: int = 1
    per_page: int = 50


# ─── MedicationAdministration (Verabreichung) ─────────────────

class AdministrationCreate(BaseModel):
    medication_id: uuid.UUID
    patient_id: uuid.UUID
    dose_given: str = Field(..., min_length=1, max_length=50)
    dose_unit: str = Field(..., max_length=20)
    route: str = Field("oral", max_length=30)
    status: str = Field("completed", pattern=r"^(completed|refused|held|not-given)$")
    reason_not_given: str | None = None
    notes: str | None = None


class AdministrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    medication_id: uuid.UUID
    patient_id: uuid.UUID
    administered_at: datetime
    administered_by: uuid.UUID | None
    dose_given: str
    dose_unit: str
    route: str
    status: str
    reason_not_given: str | None
    notes: str | None