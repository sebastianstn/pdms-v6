"""Nursing Entry & Assessment Pydantic schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ─── NursingEntry (Pflegeeintrag) ──────────────────────────────

ENTRY_CATEGORIES = (
    "observation",
    "intervention",
    "assessment",
    "handover",
    "wound_care",
    "mobility",
    "nutrition",
    "elimination",
    "communication",
)

ENTRY_PRIORITIES = ("low", "normal", "high", "urgent")


class NursingEntryCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    category: str = Field(..., pattern=r"^(observation|intervention|assessment|handover|wound_care|mobility|nutrition|elimination|communication)$")
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    priority: str = Field("normal", pattern=r"^(low|normal|high|urgent)$")
    is_handover: bool = False


class NursingEntryUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    content: str | None = None
    priority: str | None = Field(None, pattern=r"^(low|normal|high|urgent)$")
    category: str | None = Field(None, pattern=r"^(observation|intervention|assessment|handover|wound_care|mobility|nutrition|elimination|communication)$")
    is_handover: bool | None = None


class NursingEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    category: str
    title: str
    content: str
    priority: str
    recorded_at: datetime
    recorded_by: uuid.UUID | None
    is_handover: bool
    created_at: datetime
    updated_at: datetime


class PaginatedNursingEntries(BaseModel):
    items: list[NursingEntryResponse]
    total: int
    page: int = 1
    per_page: int = 50


# ─── NursingAssessment (Pflege-Assessment) ─────────────────────

ASSESSMENT_TYPES = ("barthel", "norton", "braden", "pain", "fall_risk", "nutrition")
RISK_LEVELS = ("low", "medium", "high", "very_high")


class NursingAssessmentCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    assessment_type: str = Field(..., pattern=r"^(barthel|norton|braden|pain|fall_risk|nutrition)$")
    total_score: int = Field(..., ge=0)
    max_score: int | None = Field(None, ge=0)
    risk_level: str | None = Field(None, pattern=r"^(low|medium|high|very_high)$")
    items: dict = Field(default_factory=dict)
    notes: str | None = None


class NursingAssessmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    assessment_type: str
    total_score: int
    max_score: int | None
    risk_level: str | None
    items: dict
    notes: str | None
    assessed_at: datetime
    assessed_by: uuid.UUID | None
    created_at: datetime


class PaginatedAssessments(BaseModel):
    items: list[NursingAssessmentResponse]
    total: int
    page: int = 1
    per_page: int = 50
