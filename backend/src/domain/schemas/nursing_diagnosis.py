"""Pflegediagnose Pydantic schemas — NANDA-I basiert."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


DIAGNOSIS_STATUSES = ("active", "resolved", "inactive")
DIAGNOSIS_PRIORITIES = ("low", "normal", "high")


class NursingDiagnosisCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    nanda_code: str | None = Field(None, max_length=20)
    title: str = Field(..., min_length=1, max_length=255)
    domain: str | None = Field(None, max_length=100)
    defining_characteristics: str | None = None
    related_factors: str | None = None
    risk_factors: str | None = None
    goals: str | None = None
    interventions: str | None = None
    priority: str = Field("normal", pattern=r"^(low|normal|high)$")


class NursingDiagnosisUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    nanda_code: str | None = Field(None, max_length=20)
    domain: str | None = Field(None, max_length=100)
    defining_characteristics: str | None = None
    related_factors: str | None = None
    risk_factors: str | None = None
    goals: str | None = None
    interventions: str | None = None
    evaluation: str | None = None
    priority: str | None = Field(None, pattern=r"^(low|normal|high)$")
    status: str | None = Field(None, pattern=r"^(active|resolved|inactive)$")


class NursingDiagnosisResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    nanda_code: str | None
    title: str
    domain: str | None
    defining_characteristics: str | None
    related_factors: str | None
    risk_factors: str | None
    goals: str | None
    interventions: str | None
    evaluation: str | None
    priority: str
    status: str
    diagnosed_by: uuid.UUID | None
    diagnosed_at: datetime
    resolved_at: datetime | None
    created_at: datetime
    updated_at: datetime


class PaginatedNursingDiagnoses(BaseModel):
    items: list[NursingDiagnosisResponse]
    total: int
    page: int = 1
    per_page: int = 50
