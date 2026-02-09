"""Patient Pydantic schemas for request/response validation."""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class PatientCreate(BaseModel):
    ahv_number: str | None = Field(None, pattern=r"^\d{3}\.\d{4}\.\d{4}\.\d{2}$", description="756.XXXX.XXXX.XX")
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    gender: str = Field(..., pattern=r"^(male|female|other|unknown)$")
    blood_type: str | None = None
    phone: str | None = None
    email: str | None = None
    address_street: str | None = None
    address_zip: str | None = None
    address_city: str | None = None
    address_canton: str | None = Field(None, max_length=2)
    language: str = "de"


class PatientUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    phone: str | None = None
    email: str | None = None
    address_street: str | None = None
    address_zip: str | None = None
    address_city: str | None = None
    address_canton: str | None = None
    status: str | None = None


class PatientResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ahv_number: str | None
    first_name: str
    last_name: str
    date_of_birth: date
    gender: str
    blood_type: str | None
    phone: str | None
    email: str | None
    address_street: str | None
    address_zip: str | None
    address_city: str | None
    address_canton: str | None
    language: str
    status: str
    created_at: datetime
    updated_at: datetime


class PaginatedPatients(BaseModel):
    items: list[PatientResponse]
    total: int
    page: int
    per_page: int
