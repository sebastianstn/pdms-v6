"""Schichtübergabe Pydantic schemas — SBAR-Struktur."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


SHIFT_TYPES = ("early", "late", "night")


class ShiftHandoverCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    shift_type: str = Field(..., pattern=r"^(early|late|night)$")
    handover_date: date
    situation: str = Field(..., min_length=1)
    background: str | None = None
    assessment: str | None = None
    recommendation: str | None = None
    open_tasks: list[dict] | None = None
    critical_info: str | None = None


class ShiftHandoverAcknowledge(BaseModel):
    pass


class ShiftHandoverResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    shift_type: str
    handover_date: date
    situation: str
    background: str | None
    assessment: str | None
    recommendation: str | None
    open_tasks: list[dict] | None
    critical_info: str | None
    handed_over_by: uuid.UUID | None
    received_by: uuid.UUID | None
    acknowledged_at: datetime | None
    created_at: datetime


class PaginatedShiftHandovers(BaseModel):
    items: list[ShiftHandoverResponse]
    total: int
    page: int = 1
    per_page: int = 50
