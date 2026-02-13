"""Arztbrief Pydantic schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


LETTER_TYPES = ("discharge", "referral", "progress", "transfer")
LETTER_STATUSES = ("draft", "final", "sent", "amended")
SEND_METHODS = ("hin_mail", "email", "fax", "print")


class MedicalLetterCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    letter_type: str = Field(..., pattern=r"^(discharge|referral|progress|transfer)$")
    title: str = Field(..., min_length=1, max_length=255)
    recipient_name: str | None = Field(None, max_length=200)
    recipient_institution: str | None = Field(None, max_length=255)
    recipient_email: str | None = Field(None, max_length=255)
    diagnosis: str | None = None
    history: str | None = None
    findings: str | None = None
    therapy: str | None = None
    procedures: str | None = None
    recommendations: str | None = None
    medication_on_discharge: str | None = None
    follow_up: str | None = None
    content: str | None = None


class MedicalLetterUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    letter_type: str | None = Field(None, pattern=r"^(discharge|referral|progress|transfer)$")
    recipient_name: str | None = Field(None, max_length=200)
    recipient_institution: str | None = Field(None, max_length=255)
    recipient_email: str | None = Field(None, max_length=255)
    diagnosis: str | None = None
    history: str | None = None
    findings: str | None = None
    therapy: str | None = None
    procedures: str | None = None
    recommendations: str | None = None
    medication_on_discharge: str | None = None
    follow_up: str | None = None
    content: str | None = None
    status: str | None = Field(None, pattern=r"^(draft|final|sent|amended)$")


class MedicalLetterSend(BaseModel):
    send_via: str = Field(..., pattern=r"^(hin_mail|email|fax|print)$")


class MedicalLetterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    letter_type: str
    title: str
    recipient_name: str | None
    recipient_institution: str | None
    recipient_email: str | None
    diagnosis: str | None
    history: str | None
    findings: str | None
    therapy: str | None
    procedures: str | None
    recommendations: str | None
    medication_on_discharge: str | None
    follow_up: str | None
    content: str | None
    author_id: uuid.UUID | None
    co_signed_by: uuid.UUID | None
    co_signed_at: datetime | None
    status: str
    sent_at: datetime | None
    sent_via: str | None
    created_at: datetime
    updated_at: datetime


class PaginatedMedicalLetters(BaseModel):
    items: list[MedicalLetterResponse]
    total: int
    page: int = 1
    per_page: int = 50
