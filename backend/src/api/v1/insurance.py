"""Insurance API endpoints — CRUD for patient insurances."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from src.api.dependencies import get_current_user, get_db
from src.domain.models.patient import Insurance

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


# ─── Schemas ───────────────────────────────────────────────────

INSURANCE_TYPE_LABELS = {
    "grundversicherung": "Grundversicherung (KVG)",
    "zusatz": "Zusatzversicherung (VVG)",
    "unfall": "Unfallversicherung (UVG)",
    "iv": "Invalidenversicherung (IV)",
}


class InsuranceCreate(BaseModel):
    patient_id: uuid.UUID
    insurer_name: str = Field(..., max_length=255)
    policy_number: str = Field(..., max_length=50)
    insurance_type: str = Field(..., pattern=r"^(grundversicherung|zusatz|unfall|iv)$")
    valid_from: date | None = None
    valid_until: date | None = None
    franchise: int | None = None
    kostengutsprache: bool = False
    kostengutsprache_bis: date | None = None
    garant: str | None = Field(None, pattern=r"^(tiers_payant|tiers_garant)$")
    bvg_number: str | None = None
    notes: str | None = None


class InsuranceUpdate(BaseModel):
    insurer_name: str | None = Field(None, max_length=255)
    policy_number: str | None = Field(None, max_length=50)
    insurance_type: str | None = Field(None, pattern=r"^(grundversicherung|zusatz|unfall|iv)$")
    valid_from: date | None = None
    valid_until: date | None = None
    franchise: int | None = None
    kostengutsprache: bool | None = None
    kostengutsprache_bis: date | None = None
    garant: str | None = None
    bvg_number: str | None = None
    notes: str | None = None


class InsuranceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    patient_id: uuid.UUID
    insurer_name: str
    policy_number: str
    insurance_type: str
    valid_from: date | None
    valid_until: date | None
    franchise: int | None
    kostengutsprache: bool
    kostengutsprache_bis: date | None
    garant: str | None
    bvg_number: str | None
    notes: str | None


# ─── Endpoints ─────────────────────────────────────────────────


@router.get("/insurance/meta")
async def insurance_meta(user: CurrentUser):
    return {"insurance_types": INSURANCE_TYPE_LABELS}


@router.get("/patients/{patient_id}/insurances", response_model=list[InsuranceResponse])
async def list_patient_insurances(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    rows = (await db.execute(select(Insurance).where(Insurance.patient_id == patient_id))).scalars().all()
    return [InsuranceResponse.model_validate(i) for i in rows]


@router.post("/insurances", response_model=InsuranceResponse, status_code=201)
async def create_insurance_endpoint(data: InsuranceCreate, db: DbSession, user: CurrentUser):
    ins = Insurance(**data.model_dump())
    db.add(ins)
    await db.flush()
    await db.refresh(ins)
    return InsuranceResponse.model_validate(ins)


@router.patch("/insurances/{insurance_id}", response_model=InsuranceResponse)
async def update_insurance_endpoint(insurance_id: uuid.UUID, data: InsuranceUpdate, db: DbSession, user: CurrentUser):
    ins = (await db.execute(select(Insurance).where(Insurance.id == insurance_id))).scalar_one_or_none()
    if not ins:
        raise HTTPException(404, "Versicherung nicht gefunden")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(ins, field, value)
    await db.flush()
    await db.refresh(ins)
    return InsuranceResponse.model_validate(ins)


@router.delete("/insurances/{insurance_id}", status_code=204)
async def delete_insurance_endpoint(insurance_id: uuid.UUID, db: DbSession, user: CurrentUser):
    ins = (await db.execute(select(Insurance).where(Insurance.id == insurance_id))).scalar_one_or_none()
    if not ins:
        raise HTTPException(404, "Versicherung nicht gefunden")
    await db.delete(ins)
