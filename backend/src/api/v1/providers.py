"""MedicalProvider API endpoints — Hausarzt, Zuweiser, Apotheke, Spitex (Phase 3a.14)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.models.patient import MedicalProvider

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


# ─── Schemas ───────────────────────────────────────────────────

PROVIDER_TYPE_LABELS = {
    "hausarzt": "Hausarzt",
    "zuweiser": "Zuweiser",
    "apotheke": "Apotheke",
    "spitex": "Spitex",
    "physiotherapie": "Physiotherapie",
    "spezialist": "Spezialist",
}


class ProviderCreate(BaseModel):
    patient_id: uuid.UUID
    provider_type: str = Field(..., pattern=r"^(hausarzt|zuweiser|apotheke|spitex|physiotherapie|spezialist)$")
    name: str = Field(..., min_length=1, max_length=255)
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    hin_email: str | None = None
    gln_number: str | None = Field(None, max_length=13)
    address: str | None = None
    speciality: str | None = None
    notes: str | None = None


class ProviderUpdate(BaseModel):
    provider_type: str | None = Field(None, pattern=r"^(hausarzt|zuweiser|apotheke|spitex|physiotherapie|spezialist)$")
    name: str | None = Field(None, max_length=255)
    contact_person: str | None = None
    phone: str | None = None
    email: str | None = None
    hin_email: str | None = None
    gln_number: str | None = Field(None, max_length=13)
    address: str | None = None
    speciality: str | None = None
    notes: str | None = None


class ProviderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    patient_id: uuid.UUID
    provider_type: str
    name: str
    contact_person: str | None
    phone: str | None
    email: str | None
    hin_email: str | None
    gln_number: str | None
    address: str | None
    speciality: str | None
    notes: str | None


# ─── Endpoints ─────────────────────────────────────────────────


@router.get("/providers/meta")
async def provider_meta(user: CurrentUser):
    return {"provider_types": PROVIDER_TYPE_LABELS}


@router.get("/patients/{patient_id}/providers", response_model=list[ProviderResponse])
async def list_patient_providers(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    rows = (await db.execute(
        select(MedicalProvider)
        .where(MedicalProvider.patient_id == patient_id)
        .order_by(MedicalProvider.provider_type, MedicalProvider.name)
    )).scalars().all()
    return [ProviderResponse.model_validate(p) for p in rows]


@router.post("/providers", response_model=ProviderResponse, status_code=201)
async def create_provider_endpoint(data: ProviderCreate, db: DbSession, user: CurrentUser):
    provider = MedicalProvider(**data.model_dump())
    db.add(provider)
    await db.flush()
    await db.refresh(provider)
    return ProviderResponse.model_validate(provider)


@router.patch("/providers/{provider_id}", response_model=ProviderResponse)
async def update_provider_endpoint(provider_id: uuid.UUID, data: ProviderUpdate, db: DbSession, user: CurrentUser):
    provider = (await db.execute(select(MedicalProvider).where(MedicalProvider.id == provider_id))).scalar_one_or_none()
    if not provider:
        raise HTTPException(404, "Leistungserbringer nicht gefunden")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(provider, field, value)
    await db.flush()
    await db.refresh(provider)
    return ProviderResponse.model_validate(provider)


@router.delete("/providers/{provider_id}", status_code=204)
async def delete_provider_endpoint(provider_id: uuid.UUID, db: DbSession, user: CurrentUser):
    provider = (await db.execute(select(MedicalProvider).where(MedicalProvider.id == provider_id))).scalar_one_or_none()
    if not provider:
        raise HTTPException(404, "Leistungserbringer nicht gefunden")
    await db.delete(provider)
