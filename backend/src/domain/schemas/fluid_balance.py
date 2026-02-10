"""Fluid balance (I/O-Bilanz) Pydantic schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

# ─── Category Constants ─────────────────────────────────────────

INTAKE_CATEGORIES = ("infusion", "oral", "medication", "blood_product", "nutrition", "other_intake")
OUTPUT_CATEGORIES = ("urine", "drain", "vomit", "stool", "perspiratio", "blood_loss", "other_output")
ALL_CATEGORIES = INTAKE_CATEGORIES + OUTPUT_CATEGORIES

DIRECTION_LABELS: dict[str, str] = {
    "intake": "Einfuhr",
    "output": "Ausfuhr",
}

CATEGORY_LABELS: dict[str, str] = {
    # Intake
    "infusion": "Infusion",
    "oral": "Oral",
    "medication": "Medikamentös",
    "blood_product": "Blutprodukt",
    "nutrition": "Enterale Ernährung",
    "other_intake": "Andere Einfuhr",
    # Output
    "urine": "Urin",
    "drain": "Drainage",
    "vomit": "Erbrechen",
    "stool": "Stuhl",
    "perspiratio": "Perspiratio insensibilis",
    "blood_loss": "Blutverlust",
    "other_output": "Andere Ausfuhr",
}

ROUTE_LABELS: dict[str, str] = {
    "iv": "Intravenös",
    "oral": "Oral",
    "subcutaneous": "Subkutan",
    "rectal": "Rektal",
    "ng_tube": "Magensonde",
    "catheter": "Katheter",
    "other": "Andere",
}


# ─── Schemas ────────────────────────────────────────────────────

class FluidEntryCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    direction: str = Field(..., pattern=r"^(intake|output)$")
    category: str = Field(..., min_length=1, max_length=30)
    display_name: str = Field(..., min_length=1, max_length=200)
    volume_ml: float = Field(..., gt=0)
    route: str | None = None
    recorded_at: datetime | None = None
    notes: str | None = None


class FluidEntryUpdate(BaseModel):
    volume_ml: float | None = Field(None, gt=0)
    display_name: str | None = None
    route: str | None = None
    notes: str | None = None


class FluidEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    direction: str
    category: str
    display_name: str
    volume_ml: float
    route: str | None
    recorded_at: datetime
    recorded_by: uuid.UUID | None
    notes: str | None
    created_at: datetime


class PaginatedFluidEntries(BaseModel):
    items: list[FluidEntryResponse]
    total: int
    page: int = 1
    per_page: int = 50


class FluidBalanceSummary(BaseModel):
    """24-hour fluid balance summary."""
    period_start: datetime
    period_end: datetime
    total_intake_ml: float
    total_output_ml: float
    balance_ml: float  # intake - output (positive = net gain)
    intake_by_category: dict[str, float]  # category -> total mL
    output_by_category: dict[str, float]
    entry_count: int
