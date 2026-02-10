"""Alarm Pydantic schemas for request/response validation."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AlarmResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    vital_sign_id: uuid.UUID | None
    parameter: str
    value: float
    threshold_min: float | None
    threshold_max: float | None
    severity: str  # info, warning, critical
    status: str  # active, acknowledged, resolved
    triggered_at: datetime
    acknowledged_at: datetime | None
    acknowledged_by: uuid.UUID | None


class PaginatedAlarms(BaseModel):
    items: list[AlarmResponse]
    total: int
    page: int = 1
    per_page: int = 50


class AlarmCountsResponse(BaseModel):
    warning: int = 0
    critical: int = 0
    total: int = 0
