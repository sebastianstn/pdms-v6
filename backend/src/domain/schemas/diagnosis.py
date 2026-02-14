"""Diagnose Pydantic schemas — ICD-10 kodierte medizinische Diagnosen."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


DIAGNOSIS_TYPES = ("haupt", "neben", "verdacht")
DIAGNOSIS_STATUSES = ("active", "resolved", "ruled_out", "recurrence")
SEVERITIES = ("leicht", "mittel", "schwer")


class DiagnosisCreate(BaseModel):
    """Schema zum Erstellen einer neuen Diagnose."""
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    icd_code: str | None = Field(None, max_length=20, examples=["I50.0", "J18.9"])
    title: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    diagnosis_type: str = Field("haupt", pattern=r"^(haupt|neben|verdacht)$")
    severity: str | None = Field(None, pattern=r"^(leicht|mittel|schwer)$")
    body_site: str | None = Field(None, max_length=100)
    laterality: str | None = Field(None, pattern=r"^(links|rechts|beidseits)$")
    onset_date: date | None = None
    notes: str | None = None


class DiagnosisUpdate(BaseModel):
    """Schema zum Aktualisieren einer Diagnose."""
    icd_code: str | None = Field(None, max_length=20)
    title: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    diagnosis_type: str | None = Field(None, pattern=r"^(haupt|neben|verdacht)$")
    severity: str | None = Field(None, pattern=r"^(leicht|mittel|schwer)$")
    body_site: str | None = Field(None, max_length=100)
    laterality: str | None = Field(None, pattern=r"^(links|rechts|beidseits)$")
    status: str | None = Field(None, pattern=r"^(active|resolved|ruled_out|recurrence)$")
    onset_date: date | None = None
    resolved_date: date | None = None
    notes: str | None = None


class DiagnosisResponse(BaseModel):
    """Response-Schema mit allen DB-Feldern."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    icd_code: str | None
    title: str
    description: str | None
    diagnosis_type: str
    severity: str | None
    body_site: str | None
    laterality: str | None
    status: str
    onset_date: date | None
    resolved_date: date | None
    diagnosed_by: uuid.UUID | None
    diagnosed_at: datetime
    notes: str | None
    created_at: datetime
    updated_at: datetime


class PaginatedDiagnoses(BaseModel):
    """Paginierte Diagnose-Liste."""
    items: list[DiagnosisResponse]
    total: int
    page: int = 1
    per_page: int = 50
