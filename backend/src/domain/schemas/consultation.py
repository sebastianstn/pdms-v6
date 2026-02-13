"""Konsil Pydantic schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


SPECIALTIES = (
    "kardiologie", "neurologie", "chirurgie", "orthopaedie", "pneumologie",
    "gastroenterologie", "nephrologie", "onkologie", "psychiatrie",
    "dermatologie", "radiologie", "anaesthesie", "intensivmedizin",
    "infektiologie", "ernaehrungsberatung", "physiotherapie",
    "ergotherapie", "logopaedie", "sozialarbeit", "palliativmedizin", "andere",
)

URGENCIES = ("routine", "urgent", "emergency")
CONSULTATION_STATUSES = ("requested", "accepted", "completed", "cancelled")


class ConsultationCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    specialty: str = Field(..., min_length=1, max_length=100)
    urgency: str = Field("routine", pattern=r"^(routine|urgent|emergency)$")
    question: str = Field(..., min_length=1)
    clinical_context: str | None = None


class ConsultationUpdate(BaseModel):
    status: str | None = Field(None, pattern=r"^(requested|accepted|completed|cancelled)$")
    consultant_name: str | None = Field(None, max_length=200)
    response: str | None = None
    recommendations: str | None = None


class ConsultationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    specialty: str
    urgency: str
    question: str
    clinical_context: str | None
    requested_by: uuid.UUID | None
    requested_at: datetime
    consultant_id: uuid.UUID | None
    consultant_name: str | None
    response: str | None
    recommendations: str | None
    responded_at: datetime | None
    status: str
    created_at: datetime
    updated_at: datetime


class PaginatedConsultations(BaseModel):
    items: list[ConsultationResponse]
    total: int
    page: int = 1
    per_page: int = 50
