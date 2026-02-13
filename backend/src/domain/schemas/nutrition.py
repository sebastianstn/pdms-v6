"""Ernährung Pydantic schemas — Diätverordnung + Screening."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


DIET_TYPES = ("normal", "light", "diabetic", "renal", "parenteral", "enteral", "npo")
TEXTURES = ("normal", "pureed", "liquid", "soft")
ORDER_STATUSES = ("active", "on-hold", "completed", "cancelled")
SCREENING_TYPES = ("nrs2002", "must", "mna", "sga")
RISK_LEVELS = ("low", "medium", "high")


class NutritionOrderCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    diet_type: str = Field(..., pattern=r"^(normal|light|diabetic|renal|parenteral|enteral|npo)$")
    texture: str | None = Field(None, pattern=r"^(normal|pureed|liquid|soft)$")
    supplements: str | None = None
    restrictions: str | None = None
    allergies: str | None = None
    caloric_target: int | None = Field(None, ge=0)
    protein_target: float | None = Field(None, ge=0)
    fluid_target: int | None = Field(None, ge=0)
    special_instructions: str | None = None
    start_date: date
    end_date: date | None = None


class NutritionOrderUpdate(BaseModel):
    diet_type: str | None = Field(None, pattern=r"^(normal|light|diabetic|renal|parenteral|enteral|npo)$")
    texture: str | None = Field(None, pattern=r"^(normal|pureed|liquid|soft)$")
    supplements: str | None = None
    restrictions: str | None = None
    allergies: str | None = None
    caloric_target: int | None = Field(None, ge=0)
    protein_target: float | None = Field(None, ge=0)
    fluid_target: int | None = Field(None, ge=0)
    special_instructions: str | None = None
    end_date: date | None = None
    status: str | None = Field(None, pattern=r"^(active|on-hold|completed|cancelled)$")


class NutritionOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None
    diet_type: str
    texture: str | None
    supplements: str | None
    restrictions: str | None
    allergies: str | None
    caloric_target: int | None
    protein_target: float | None
    fluid_target: int | None
    special_instructions: str | None
    status: str
    start_date: date
    end_date: date | None
    ordered_by: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class PaginatedNutritionOrders(BaseModel):
    items: list[NutritionOrderResponse]
    total: int
    page: int = 1
    per_page: int = 50


class NutritionScreeningCreate(BaseModel):
    patient_id: uuid.UUID
    screening_type: str = Field(..., pattern=r"^(nrs2002|must|mna|sga)$")
    total_score: int = Field(..., ge=0)
    risk_level: str = Field(..., pattern=r"^(low|medium|high)$")
    items: dict = Field(default_factory=dict)
    notes: str | None = None


class NutritionScreeningResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    screening_type: str
    total_score: int
    risk_level: str
    items: dict
    notes: str | None
    screened_at: datetime
    screened_by: uuid.UUID | None
    created_at: datetime


class PaginatedNutritionScreenings(BaseModel):
    items: list[NutritionScreeningResponse]
    total: int
    page: int = 1
    per_page: int = 50
