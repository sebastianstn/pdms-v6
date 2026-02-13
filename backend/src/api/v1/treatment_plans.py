"""Treatment Plan API endpoints — CRUD, Item-Management."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.treatment_plan import (
    TreatmentPlanCreate,
    TreatmentPlanResponse,
    TreatmentPlanUpdate,
    PaginatedTreatmentPlans,
)
from src.domain.services.treatment_plan_service import (
    complete_plan_item,
    create_treatment_plan,
    delete_treatment_plan,
    get_treatment_plan,
    list_treatment_plans,
    update_treatment_plan,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
DoctorOrAdmin = Annotated[dict, Depends(require_role("arzt", "admin"))]


@router.get("/patients/{patient_id}/treatment-plans", response_model=PaginatedTreatmentPlans)
async def list_plans(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    status: str | None = Query(None, pattern=r"^(active|completed|cancelled|on-hold)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Alle Therapiepläne eines Patienten auflisten."""
    return await list_treatment_plans(db, patient_id, status=status, page=page, per_page=per_page)


@router.get("/treatment-plans/{plan_id}", response_model=TreatmentPlanResponse)
async def get_plan(plan_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Einzelnen Therapieplan mit Massnahmen laden."""
    plan = await get_treatment_plan(db, plan_id)
    if not plan:
        raise HTTPException(404, "Therapieplan nicht gefunden")
    return plan


@router.post("/treatment-plans", response_model=TreatmentPlanResponse, status_code=201)
async def create_plan(data: TreatmentPlanCreate, db: DbSession, user: DoctorOrAdmin):
    """Neuen Therapieplan erstellen (inkl. Massnahmen)."""
    created_by = uuid.UUID(user["sub"]) if user.get("sub") else None
    return await create_treatment_plan(db, data, created_by=created_by)


@router.patch("/treatment-plans/{plan_id}", response_model=TreatmentPlanResponse)
async def update_plan(plan_id: uuid.UUID, data: TreatmentPlanUpdate, db: DbSession, user: DoctorOrAdmin):
    """Therapieplan aktualisieren."""
    plan = await update_treatment_plan(db, plan_id, data)
    if not plan:
        raise HTTPException(404, "Therapieplan nicht gefunden")
    return plan


@router.post("/treatment-plan-items/{item_id}/complete", status_code=200)
async def complete_item(item_id: uuid.UUID, db: DbSession, user: Annotated[dict, Depends(require_role("arzt", "pflege", "admin"))]):
    """Einzelne Massnahme als erledigt markieren."""
    completed_by = uuid.UUID(user["sub"]) if user.get("sub") else None
    if not completed_by:
        raise HTTPException(400, "User-ID nicht verfügbar")
    item = await complete_plan_item(db, item_id, completed_by)
    if not item:
        raise HTTPException(404, "Massnahme nicht gefunden")
    return {"status": "completed", "item_id": str(item.id)}


@router.delete("/treatment-plans/{plan_id}", status_code=204)
async def delete_plan(plan_id: uuid.UUID, db: DbSession, user: DoctorOrAdmin):
    """Therapieplan löschen."""
    deleted = await delete_treatment_plan(db, plan_id)
    if not deleted:
        raise HTTPException(404, "Therapieplan nicht gefunden")
