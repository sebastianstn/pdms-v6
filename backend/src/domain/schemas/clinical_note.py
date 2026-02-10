"""Clinical Note Pydantic schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ─── Enums / Konstanten ────────────────────────────────────────

NOTE_TYPES = (
    "progress_note",
    "admission_note",
    "discharge_summary",
    "consultation",
    "procedure_note",
    "handoff",
)

NOTE_TYPE_LABELS: dict[str, str] = {
    "progress_note": "Verlaufsnotiz",
    "admission_note": "Aufnahmebericht",
    "discharge_summary": "Entlassbericht",
    "consultation": "Konsilbericht",
    "procedure_note": "Interventionsbericht",
    "handoff": "Dienstübergabe",
}

NOTE_STATUSES = ("draft", "final", "amended", "entered_in_error")

NOTE_STATUS_LABELS: dict[str, str] = {
    "draft": "Entwurf",
    "final": "Finalisiert",
    "amended": "Nachtrag",
    "entered_in_error": "Fehleingabe",
}


# ─── Create / Update ──────────────────────────────────────────

class ClinicalNoteCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    note_type: str = Field(
        ...,
        pattern=r"^(progress_note|admission_note|discharge_summary|consultation|procedure_note|handoff)$",
    )
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    summary: str | None = None
    is_confidential: bool = False
    tags: list[str] | None = None


class ClinicalNoteUpdate(BaseModel):
    title: str | None = Field(None, max_length=255)
    content: str | None = None
    summary: str | None = None
    note_type: str | None = Field(
        None,
        pattern=r"^(progress_note|admission_note|discharge_summary|consultation|procedure_note|handoff)$",
    )
    status: str | None = Field(
        None,
        pattern=r"^(draft|final|amended|entered_in_error)$",
    )
    is_confidential: bool | None = None
    tags: list[str] | None = None


class ClinicalNoteFinalize(BaseModel):
    """Notiz finalisieren — optional mit Zusammenfassung."""
    summary: str | None = None


class ClinicalNoteCoSign(BaseModel):
    """Co-Signatur einer finalisierten Notiz."""
    pass  # co_signed_by kommt aus dem Token


# ─── Response ──────────────────────────────────────────────────

class ClinicalNoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    note_type: str
    title: str
    content: str
    summary: str | None
    author_id: uuid.UUID | None
    co_signed_by: uuid.UUID | None
    co_signed_at: datetime | None
    status: str
    is_confidential: bool
    tags: list[str] | None
    created_at: datetime
    updated_at: datetime


class PaginatedClinicalNotes(BaseModel):
    items: list[ClinicalNoteResponse]
    total: int
    page: int = 1
    per_page: int = 50
