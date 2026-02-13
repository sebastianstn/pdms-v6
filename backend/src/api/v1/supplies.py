"""Supply API endpoints — Verbrauchsmaterial-Katalog + Patienten-Verbrauch."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.supply import (
    PaginatedSupplyItems,
    PaginatedSupplyUsages,
    SupplyItemCreate,
    SupplyItemResponse,
    SupplyItemUpdate,
    SupplyUsageCreate,
    SupplyUsageResponse,
)
from src.domain.services.supply_service import (
    create_supply_item,
    create_supply_usage,
    get_low_stock_items,
    get_supply_item,
    list_supply_items,
    list_supply_usages,
    update_supply_item,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
AdminUser = Annotated[dict, Depends(require_role("admin"))]
NurseOrAdmin = Annotated[dict, Depends(require_role("pflege", "arzt", "admin"))]


# ─── Supply Items (Katalog) ───────────────────────────────────

@router.get("/supplies", response_model=PaginatedSupplyItems)
async def list_items(
    db: DbSession,
    user: CurrentUser,
    category: str | None = Query(None, pattern=r"^(wound_care|infusion|catheter|respiratory|other)$"),
    active_only: bool = Query(True),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Verbrauchsmaterial-Katalog auflisten."""
    return await list_supply_items(db, category=category, active_only=active_only, page=page, per_page=per_page)


@router.get("/supplies/low-stock", response_model=list[SupplyItemResponse])
async def low_stock(db: DbSession, user: NurseOrAdmin):
    """Artikel mit niedrigem Bestand."""
    return await get_low_stock_items(db)


@router.get("/supplies/{item_id}", response_model=SupplyItemResponse)
async def get_item(item_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Einzelnen Artikel laden."""
    item = await get_supply_item(db, item_id)
    if not item:
        raise HTTPException(404, "Artikel nicht gefunden")
    return item


@router.post("/supplies", response_model=SupplyItemResponse, status_code=201)
async def create_item(data: SupplyItemCreate, db: DbSession, user: AdminUser):
    """Neuen Artikel im Katalog anlegen (Admin-Only)."""
    return await create_supply_item(db, data)


@router.patch("/supplies/{item_id}", response_model=SupplyItemResponse)
async def update_item(item_id: uuid.UUID, data: SupplyItemUpdate, db: DbSession, user: AdminUser):
    """Artikel aktualisieren (Admin-Only)."""
    item = await update_supply_item(db, item_id, data)
    if not item:
        raise HTTPException(404, "Artikel nicht gefunden")
    return item


# ─── Supply Usage (pro Patient) ───────────────────────────────

@router.get("/patients/{patient_id}/supply-usages", response_model=PaginatedSupplyUsages)
async def list_usages(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Materialverbrauch eines Patienten."""
    return await list_supply_usages(db, patient_id, page=page, per_page=per_page)


@router.post("/supply-usages", response_model=SupplyUsageResponse, status_code=201)
async def create_usage(data: SupplyUsageCreate, db: DbSession, user: NurseOrAdmin):
    """Material-Verbrauch dokumentieren."""
    used_by = uuid.UUID(user["sub"]) if user.get("sub") else None
    try:
        return await create_supply_usage(db, data, used_by=used_by)
    except ValueError as exc:
        raise HTTPException(400, str(exc))
