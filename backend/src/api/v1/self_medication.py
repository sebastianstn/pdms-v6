"""Self-medication API endpoints — CRUD, confirm/miss/skip (Patient-App concept)."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.schemas.home_spital import (
    SELF_MED_STATUS_LABELS,
    PaginatedSelfMedicationLogs,
    SelfMedicationLogCreate,
    SelfMedicationLogResponse,
)
from src.domain.services.self_medication_service import (
    confirm_medication,
    create_self_medication_log,
    list_self_medication_logs,
    miss_medication,
    skip_medication,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/self-medication/meta")
async def self_medication_meta(user: CurrentUser):
    return {"statuses": SELF_MED_STATUS_LABELS}


@router.get("/patients/{patient_id}/self-medication", response_model=PaginatedSelfMedicationLogs)
async def list_patient_self_medication(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    status: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    items, total = await list_self_medication_logs(db, patient_id, status=status, page=page, per_page=per_page)
    return PaginatedSelfMedicationLogs(
        items=[SelfMedicationLogResponse.model_validate(l) for l in items],
        total=total, page=page, per_page=per_page,
    )


@router.post("/self-medication", response_model=SelfMedicationLogResponse, status_code=201)
async def create_self_medication_endpoint(data: SelfMedicationLogCreate, db: DbSession, user: CurrentUser):
    log = await create_self_medication_log(db, data)
    return SelfMedicationLogResponse.model_validate(log)


@router.post("/self-medication/{log_id}/confirm", response_model=SelfMedicationLogResponse)
async def confirm_medication_endpoint(log_id: uuid.UUID, db: DbSession, user: CurrentUser):
    log = await confirm_medication(db, log_id)
    if not log:
        raise HTTPException(404, "Log nicht gefunden")
    return SelfMedicationLogResponse.model_validate(log)


@router.post("/self-medication/{log_id}/miss", response_model=SelfMedicationLogResponse)
async def miss_medication_endpoint(log_id: uuid.UUID, db: DbSession, user: CurrentUser):
    log = await miss_medication(db, log_id)
    if not log:
        raise HTTPException(404, "Log nicht gefunden")
    return SelfMedicationLogResponse.model_validate(log)


@router.post("/self-medication/{log_id}/skip", response_model=SelfMedicationLogResponse)
async def skip_medication_endpoint(log_id: uuid.UUID, db: DbSession, user: CurrentUser):
    log = await skip_medication(db, log_id)
    if not log:
        raise HTTPException(404, "Log nicht gefunden")
    return SelfMedicationLogResponse.model_validate(log)
