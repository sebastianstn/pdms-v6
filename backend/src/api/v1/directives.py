"""AdvanceDirective + PatientWishes + PalliativeCare + DeathNotification API endpoints."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.schemas.legal import (
    DIRECTIVE_TYPE_LABELS,
    DeathNotificationCreate,
    DeathNotificationResponse,
    DeathNotificationUpdate,
    DirectiveCreate,
    DirectiveResponse,
    DirectiveUpdate,
    PalliativeResponse,
    PalliativeUpsert,
    WishesResponse,
    WishesUpsert,
)
from src.domain.services.consent_service import (
    create_death_notification,
    create_directive,
    delete_death_notification,
    delete_directive,
    get_directive,
    get_palliative,
    get_wishes,
    list_death_notifications,
    list_directives,
    update_death_notification,
    update_directive,
    upsert_palliative,
    upsert_wishes,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


# ─── Directives Meta ──────────────────────────────────────────


@router.get("/directives/meta")
async def directive_meta(user: CurrentUser):
    return {"directive_types": DIRECTIVE_TYPE_LABELS}


# ─── AdvanceDirective CRUD ─────────────────────────────────────


@router.get("/patients/{patient_id}/directives", response_model=list[DirectiveResponse])
async def list_patient_directives(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    items = await list_directives(db, patient_id)
    return [DirectiveResponse.model_validate(d) for d in items]


@router.post("/directives", response_model=DirectiveResponse, status_code=201)
async def create_directive_endpoint(data: DirectiveCreate, db: DbSession, user: CurrentUser):
    return DirectiveResponse.model_validate(await create_directive(db, data))


@router.patch("/directives/{directive_id}", response_model=DirectiveResponse)
async def update_directive_endpoint(directive_id: uuid.UUID, data: DirectiveUpdate, db: DbSession, user: CurrentUser):
    d = await update_directive(db, directive_id, data)
    if not d:
        raise HTTPException(404, "Verfügung nicht gefunden")
    return DirectiveResponse.model_validate(d)


@router.delete("/directives/{directive_id}", status_code=204)
async def delete_directive_endpoint(directive_id: uuid.UUID, db: DbSession, user: CurrentUser):
    if not await delete_directive(db, directive_id):
        raise HTTPException(404, "Verfügung nicht gefunden")


# ─── PatientWishes ─────────────────────────────────────────────


@router.get("/patients/{patient_id}/wishes", response_model=WishesResponse | None)
async def get_patient_wishes(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    return await get_wishes(db, patient_id)


@router.put("/patients/{patient_id}/wishes", response_model=WishesResponse)
async def upsert_patient_wishes(patient_id: uuid.UUID, data: WishesUpsert, db: DbSession, user: CurrentUser):
    user_id = uuid.UUID(user.get("sub", "00000000-0000-0000-0000-000000000000"))
    w = await upsert_wishes(db, patient_id, data, recorded_by=user_id)
    return WishesResponse.model_validate(w)


# ─── PalliativeCare ────────────────────────────────────────────


@router.get("/patients/{patient_id}/palliative", response_model=PalliativeResponse | None)
async def get_patient_palliative(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    return await get_palliative(db, patient_id)


@router.put("/patients/{patient_id}/palliative", response_model=PalliativeResponse)
async def upsert_patient_palliative(patient_id: uuid.UUID, data: PalliativeUpsert, db: DbSession, user: CurrentUser):
    user_id = uuid.UUID(user.get("sub", "00000000-0000-0000-0000-000000000000"))
    p = await upsert_palliative(db, patient_id, data, user_id=user_id)
    return PalliativeResponse.model_validate(p)


# ─── DeathNotifications ────────────────────────────────────────


@router.get("/patients/{patient_id}/death-notifications", response_model=list[DeathNotificationResponse])
async def list_patient_death_notifications(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    items = await list_death_notifications(db, patient_id)
    return [DeathNotificationResponse.model_validate(n) for n in items]


@router.post("/death-notifications", response_model=DeathNotificationResponse, status_code=201)
async def create_death_notification_endpoint(data: DeathNotificationCreate, db: DbSession, user: CurrentUser):
    return DeathNotificationResponse.model_validate(await create_death_notification(db, data))


@router.patch("/death-notifications/{notif_id}", response_model=DeathNotificationResponse)
async def update_death_notification_endpoint(notif_id: uuid.UUID, data: DeathNotificationUpdate, db: DbSession, user: CurrentUser):
    n = await update_death_notification(db, notif_id, data)
    if not n:
        raise HTTPException(404, "Todesfall-Mitteilung nicht gefunden")
    return DeathNotificationResponse.model_validate(n)


@router.delete("/death-notifications/{notif_id}", status_code=204)
async def delete_death_notification_endpoint(notif_id: uuid.UUID, db: DbSession, user: CurrentUser):
    if not await delete_death_notification(db, notif_id):
        raise HTTPException(404, "Todesfall-Mitteilung nicht gefunden")
