"""Encounter Pydantic schemas — request/response validation."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


# ─── Enums / Konstanten ────────────────────────────────────────

ENCOUNTER_TYPES = ("hospitalization", "home-care", "ambulatory")
ENCOUNTER_STATUSES = ("planned", "active", "finished", "cancelled")

ENCOUNTER_TYPE_LABELS: dict[str, str] = {
    "hospitalization": "Stationär",
    "home-care": "Home-Care / Spitex",
    "ambulatory": "Ambulant",
}

ENCOUNTER_STATUS_LABELS: dict[str, str] = {
    "planned": "Geplant",
    "active": "Aktiv",
    "finished": "Abgeschlossen",
    "cancelled": "Abgebrochen",
}


# ─── Create / Update ──────────────────────────────────────────


class EncounterCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_type: str = Field(
        ...,
        pattern=r"^(hospitalization|home-care|ambulatory)$",
    )
    ward: str | None = Field(None, max_length=50)
    bed: str | None = Field(None, max_length=20)
    reason: str | None = None
    attending_physician_id: uuid.UUID | None = None


class EncounterUpdate(BaseModel):
    encounter_type: str | None = Field(
        None,
        pattern=r"^(hospitalization|home-care|ambulatory)$",
    )
    ward: str | None = Field(None, max_length=50)
    bed: str | None = Field(None, max_length=20)
    reason: str | None = None
    attending_physician_id: uuid.UUID | None = None


class EncounterDischarge(BaseModel):
    """Entlassungs-Payload."""
    discharge_reason: str | None = None


class EncounterTransfer(BaseModel):
    """Verlegung — Station/Bett wechseln."""
    ward: str = Field(..., max_length=50)
    bed: str | None = Field(None, max_length=20)


# ─── Response ──────────────────────────────────────────────────


class EncounterResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    status: str
    encounter_type: str
    ward: str | None
    bed: str | None
    admitted_at: datetime
    discharged_at: datetime | None
    reason: str | None
    attending_physician_id: uuid.UUID | None


class PaginatedEncounters(BaseModel):
    items: list[EncounterResponse]
    total: int
    page: int = 1
    per_page: int = 50
