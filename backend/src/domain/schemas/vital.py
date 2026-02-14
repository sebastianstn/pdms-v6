"""VitalSign Pydantic schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VitalSignCreate(BaseModel):
    patient_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    recorded_at: datetime | None = None
    heart_rate: float | None = Field(None, ge=0, le=300)
    systolic_bp: float | None = Field(None, ge=0, le=400)
    diastolic_bp: float | None = Field(None, ge=0, le=300)
    spo2: float | None = Field(None, ge=0, le=100)
    temperature: float | None = Field(None, ge=25, le=45)
    respiratory_rate: float | None = Field(None, ge=0, le=80)
    gcs: int | None = Field(None, ge=3, le=15)
    pain_score: int | None = Field(None, ge=0, le=10)
    source: str = "manual"


class VitalSignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    recorded_at: datetime
    source: str
    heart_rate: float | None
    systolic_bp: float | None
    diastolic_bp: float | None
    spo2: float | None
    temperature: float | None
    respiratory_rate: float | None
    gcs: int | None
    pain_score: int | None
