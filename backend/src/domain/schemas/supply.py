"""Verbrauchsmaterial Pydantic schemas."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


SUPPLY_CATEGORIES = ("wound_care", "infusion", "catheter", "respiratory", "other")
SUPPLY_UNITS = ("piece", "pack", "ml", "set")


class SupplyItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    article_number: str | None = Field(None, max_length=50)
    category: str = Field(..., pattern=r"^(wound_care|infusion|catheter|respiratory|other)$")
    unit: str = Field(..., pattern=r"^(piece|pack|ml|set)$")
    stock_quantity: int = Field(0, ge=0)
    min_stock: int = Field(0, ge=0)


class SupplyItemUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    category: str | None = Field(None, pattern=r"^(wound_care|infusion|catheter|respiratory|other)$")
    unit: str | None = Field(None, pattern=r"^(piece|pack|ml|set)$")
    stock_quantity: int | None = Field(None, ge=0)
    min_stock: int | None = Field(None, ge=0)
    is_active: bool | None = None


class SupplyItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    article_number: str | None
    category: str
    unit: str
    stock_quantity: int
    min_stock: int
    is_active: bool
    created_at: datetime


class PaginatedSupplyItems(BaseModel):
    items: list[SupplyItemResponse]
    total: int
    page: int = 1
    per_page: int = 50


class SupplyUsageCreate(BaseModel):
    patient_id: uuid.UUID
    supply_item_id: uuid.UUID
    encounter_id: uuid.UUID | None = None
    quantity: int = Field(..., ge=1)
    reason: str | None = None


class SupplyUsageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    patient_id: uuid.UUID
    supply_item_id: uuid.UUID
    encounter_id: uuid.UUID | None
    quantity: int
    reason: str | None
    used_at: datetime
    used_by: uuid.UUID | None
    created_at: datetime


class PaginatedSupplyUsages(BaseModel):
    items: list[SupplyUsageResponse]
    total: int
    page: int = 1
    per_page: int = 50
