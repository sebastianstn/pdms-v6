"""Nutrition API endpoints — Ernährungsverordnung + Screening."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.nutrition import (
    NutritionOrderCreate,
    NutritionOrderResponse,
    NutritionOrderUpdate,
    NutritionScreeningCreate,
    NutritionScreeningResponse,
    PaginatedNutritionOrders,
    PaginatedNutritionScreenings,
)
from src.domain.services.nutrition_service import (
    create_nutrition_order,
    create_nutrition_screening,
    delete_nutrition_order,
    get_nutrition_order,
    list_nutrition_orders,
    list_nutrition_screenings,
    update_nutrition_order,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
DoctorOrAdmin = Annotated[dict, Depends(require_role("arzt", "admin"))]
NurseOrAdmin = Annotated[dict, Depends(require_role("pflege", "arzt", "admin"))]


# ─── Nutrition Orders ──────────────────────────────────────────

@router.get("/patients/{patient_id}/nutrition-orders", response_model=PaginatedNutritionOrders)
async def list_orders(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    status: str | None = Query(None, pattern=r"^(active|on-hold|completed|cancelled)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Ernährungsverordnungen eines Patienten."""
    return await list_nutrition_orders(db, patient_id, status=status, page=page, per_page=per_page)


@router.get("/nutrition-orders/{order_id}", response_model=NutritionOrderResponse)
async def get_order(order_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Einzelne Ernährungsverordnung laden."""
    order = await get_nutrition_order(db, order_id)
    if not order:
        raise HTTPException(404, "Ernährungsverordnung nicht gefunden")
    return order


@router.post("/nutrition-orders", response_model=NutritionOrderResponse, status_code=201)
async def create_order(data: NutritionOrderCreate, db: DbSession, user: DoctorOrAdmin):
    """Neue Ernährungsverordnung erstellen."""
    ordered_by = uuid.UUID(user["sub"]) if user.get("sub") else None
    return await create_nutrition_order(db, data, ordered_by=ordered_by)


@router.patch("/nutrition-orders/{order_id}", response_model=NutritionOrderResponse)
async def update_order(order_id: uuid.UUID, data: NutritionOrderUpdate, db: DbSession, user: DoctorOrAdmin):
    """Ernährungsverordnung aktualisieren."""
    order = await update_nutrition_order(db, order_id, data)
    if not order:
        raise HTTPException(404, "Ernährungsverordnung nicht gefunden")
    return order


@router.delete("/nutrition-orders/{order_id}", status_code=204)
async def delete_order(order_id: uuid.UUID, db: DbSession, user: DoctorOrAdmin):
    """Ernährungsverordnung löschen."""
    deleted = await delete_nutrition_order(db, order_id)
    if not deleted:
        raise HTTPException(404, "Ernährungsverordnung nicht gefunden")


# ─── Nutrition Screenings ──────────────────────────────────────

@router.get("/patients/{patient_id}/nutrition-screenings", response_model=PaginatedNutritionScreenings)
async def list_screenings(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    screening_type: str | None = Query(None, pattern=r"^(nrs2002|must|mna|sga)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Ernährungs-Screenings eines Patienten."""
    return await list_nutrition_screenings(db, patient_id, screening_type=screening_type, page=page, per_page=per_page)


@router.post("/nutrition-screenings", response_model=NutritionScreeningResponse, status_code=201)
async def create_screening(data: NutritionScreeningCreate, db: DbSession, user: NurseOrAdmin):
    """Neues Ernährungs-Screening erfassen."""
    screened_by = uuid.UUID(user["sub"]) if user.get("sub") else None
    return await create_nutrition_screening(db, data, screened_by=screened_by)
