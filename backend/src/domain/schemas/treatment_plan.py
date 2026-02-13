"""Therapieplan Pydantic schemas."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


PLAN_STATUSES = ("active", "completed", "cancelled", "on-hold")
PLAN_PRIORITIES = ("low", "normal", "high", "urgent")
ITEM_TYPES = ("medication", "physiotherapy", "lab", "imaging", "nursing", "other")
ITEM_STATUSES = ("pending", "in_progress", "completed", "cancelled")


class TreatmentPlanItemCreate(BaseModel):
    item_type: str = Field(..., pattern=r"^(medication|physiotherapy|lab|imaging|nursing|other)$")
    description: str = Field(..., min_length=1)
    frequency: str | None = None
    duration: str | None = None
    sort_order: int = 0
    notes: str | None = None


class TreatmentPlanItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    plan_id: uuid.UUID
    item_type: str
    description: str
    frequency: str | None
    duration: str | None
    status: str
    sort_order: int
    notes: str | None
    completed_at: datetime | None
    completed_by: uuid.UUID | None
    created_at: datetime


class TreatmentPlanCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    title: str = Field(..., min_length=1, max_length=255)
    diagnosis: str = Field(..., min_length=1)
    icd_code: str | None = Field(None, max_length=20)
    goals: str = Field(..., min_length=1)
    interventions: str = Field(..., min_length=1)
    start_date: date
    target_date: date | None = None
    priority: str = Field("normal", pattern=r"^(low|normal|high|urgent)$")
    review_date: date | None = None
    notes: str | None = None
    items: list[TreatmentPlanItemCreate] = Field(default_factory=list)


class TreatmentPlanUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    diagnosis: str | None = None
    icd_code: str | None = Field(None, max_length=20)
    goals: str | None = None
    interventions: str | None = None
    target_date: date | None = None
    end_date: date | None = None
    status: str | None = Field(None, pattern=r"^(active|completed|cancelled|on-hold)$")
    priority: str | None = Field(None, pattern=r"^(low|normal|high|urgent)$")
    review_date: date | None = None
    notes: str | None = None


class TreatmentPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    title: str
    diagnosis: str
    icd_code: str | None
    goals: str
    interventions: str
    start_date: date
    target_date: date | None
    end_date: date | None
    status: str
    priority: str
    responsible_physician_id: uuid.UUID | None
    created_by: uuid.UUID | None
    review_date: date | None
    notes: str | None
    items: list[TreatmentPlanItemResponse] = Field(default_factory=list)
    created_at: datetime
    updated_at: datetime


class PaginatedTreatmentPlans(BaseModel):
    items: list[TreatmentPlanResponse]
    total: int
    page: int = 1
    per_page: int = 50
