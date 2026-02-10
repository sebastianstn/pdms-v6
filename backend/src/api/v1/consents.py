"""Consent API endpoints — list, create, update, revoke, delete + meta."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.schemas.legal import (
    CONSENT_STATUS_LABELS,
    CONSENT_TYPE_LABELS,
    ConsentCreate,
    ConsentResponse,
    ConsentUpdate,
    PaginatedConsents,
)
from src.domain.services.consent_service import (
    create_consent,
    delete_consent,
    get_consent,
    list_consents,
    revoke_consent,
    update_consent,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/consents/meta")
async def consent_meta(user: CurrentUser):
    return {"consent_types": CONSENT_TYPE_LABELS, "consent_statuses": CONSENT_STATUS_LABELS}


@router.get("/patients/{patient_id}/consents", response_model=PaginatedConsents)
async def list_patient_consents(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    items = await list_consents(db, patient_id)
    return PaginatedConsents(items=[ConsentResponse.model_validate(c) for c in items], total=len(items))


@router.get("/consents/{consent_id}", response_model=ConsentResponse)
async def get_consent_endpoint(consent_id: uuid.UUID, db: DbSession, user: CurrentUser):
    c = await get_consent(db, consent_id)
    if not c:
        raise HTTPException(404, "Einwilligung nicht gefunden")
    return ConsentResponse.model_validate(c)


@router.post("/consents", response_model=ConsentResponse, status_code=201)
async def create_consent_endpoint(data: ConsentCreate, db: DbSession, user: CurrentUser):
    return ConsentResponse.model_validate(await create_consent(db, data))


@router.patch("/consents/{consent_id}", response_model=ConsentResponse)
async def update_consent_endpoint(consent_id: uuid.UUID, data: ConsentUpdate, db: DbSession, user: CurrentUser):
    c = await update_consent(db, consent_id, data)
    if not c:
        raise HTTPException(404, "Einwilligung nicht gefunden")
    return ConsentResponse.model_validate(c)


@router.post("/consents/{consent_id}/revoke", response_model=ConsentResponse)
async def revoke_consent_endpoint(
    consent_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    reason: str | None = None,
):
    c = await revoke_consent(db, consent_id, reason)
    if not c:
        raise HTTPException(404, "Einwilligung nicht gefunden")
    return ConsentResponse.model_validate(c)


@router.delete("/consents/{consent_id}", status_code=204)
async def delete_consent_endpoint(consent_id: uuid.UUID, db: DbSession, user: CurrentUser):
    if not await delete_consent(db, consent_id):
        raise HTTPException(404, "Einwilligung nicht gefunden")
