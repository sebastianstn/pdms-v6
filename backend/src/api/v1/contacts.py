"""EmergencyContact API endpoints — CRUD for patient emergency contacts."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.models.patient import EmergencyContact

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


# ─── Schemas ───────────────────────────────────────────────────


class ContactCreate(BaseModel):
    patient_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=200)
    relationship_type: str = Field(..., max_length=50)
    phone: str = Field(..., max_length=20)
    is_primary: bool = False
    email: str | None = None
    address: str | None = None
    priority: int = Field(2, ge=1, le=5)
    is_legal_representative: bool = False
    is_key_person: bool = False
    notes: str | None = None


class ContactUpdate(BaseModel):
    name: str | None = Field(None, max_length=200)
    relationship_type: str | None = Field(None, max_length=50)
    phone: str | None = Field(None, max_length=20)
    is_primary: bool | None = None
    email: str | None = None
    address: str | None = None
    priority: int | None = Field(None, ge=1, le=5)
    is_legal_representative: bool | None = None
    is_key_person: bool | None = None
    notes: str | None = None


class ContactResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    patient_id: uuid.UUID
    name: str
    relationship_type: str
    phone: str
    is_primary: bool
    email: str | None
    address: str | None
    priority: int
    is_legal_representative: bool
    is_key_person: bool
    notes: str | None


# ─── Endpoints ─────────────────────────────────────────────────


@router.get("/patients/{patient_id}/contacts", response_model=list[ContactResponse])
async def list_patient_contacts(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    rows = (await db.execute(
        select(EmergencyContact)
        .where(EmergencyContact.patient_id == patient_id)
        .order_by(EmergencyContact.priority, EmergencyContact.name)
    )).scalars().all()
    return [ContactResponse.model_validate(c) for c in rows]


@router.post("/contacts", response_model=ContactResponse, status_code=201)
async def create_contact_endpoint(data: ContactCreate, db: DbSession, user: CurrentUser):
    contact = EmergencyContact(**data.model_dump())
    db.add(contact)
    await db.flush()
    await db.refresh(contact)
    return ContactResponse.model_validate(contact)


@router.patch("/contacts/{contact_id}", response_model=ContactResponse)
async def update_contact_endpoint(contact_id: uuid.UUID, data: ContactUpdate, db: DbSession, user: CurrentUser):
    contact = (await db.execute(select(EmergencyContact).where(EmergencyContact.id == contact_id))).scalar_one_or_none()
    if not contact:
        raise HTTPException(404, "Kontakt nicht gefunden")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    await db.flush()
    await db.refresh(contact)
    return ContactResponse.model_validate(contact)


@router.delete("/contacts/{contact_id}", status_code=204)
async def delete_contact_endpoint(contact_id: uuid.UUID, db: DbSession, user: CurrentUser):
    contact = (await db.execute(select(EmergencyContact).where(EmergencyContact.id == contact_id))).scalar_one_or_none()
    if not contact:
        raise HTTPException(404, "Kontakt nicht gefunden")
    await db.delete(contact)
