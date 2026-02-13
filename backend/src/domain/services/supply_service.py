"""Supply service — CRUD for supply items and patient usage tracking."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.therapy import SupplyItem, SupplyUsage
from src.domain.schemas.supply import SupplyItemCreate, SupplyItemUpdate, SupplyUsageCreate

logger = logging.getLogger("pdms.supply")


# ─── Supply Items (Katalog) ───────────────────────────────────

async def list_supply_items(
    db: AsyncSession,
    *,
    category: str | None = None,
    active_only: bool = True,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    base = select(SupplyItem)
    count_q = select(func.count()).select_from(SupplyItem)

    if active_only:
        base = base.where(SupplyItem.is_active.is_(True))
        count_q = count_q.where(SupplyItem.is_active.is_(True))
    if category:
        base = base.where(SupplyItem.category == category)
        count_q = count_q.where(SupplyItem.category == category)

    total = (await db.execute(count_q)).scalar() or 0
    query = base.order_by(SupplyItem.name).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_supply_item(db: AsyncSession, item_id: uuid.UUID) -> SupplyItem | None:
    result = await db.execute(select(SupplyItem).where(SupplyItem.id == item_id))
    return result.scalar_one_or_none()


async def create_supply_item(db: AsyncSession, data: SupplyItemCreate) -> SupplyItem:
    item = SupplyItem(**data.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    logger.info("Verbrauchsmaterial erstellt: %s '%s'", item.id, data.name)
    return item


async def update_supply_item(
    db: AsyncSession,
    item_id: uuid.UUID,
    data: SupplyItemUpdate,
) -> SupplyItem | None:
    item = await get_supply_item(db, item_id)
    if not item:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    await db.commit()
    await db.refresh(item)
    logger.info("Verbrauchsmaterial aktualisiert: %s", item.id)
    return item


async def get_low_stock_items(db: AsyncSession) -> list[SupplyItem]:
    """Artikel mit Bestand unter Mindestbestand."""
    result = await db.execute(
        select(SupplyItem)
        .where(SupplyItem.is_active.is_(True))
        .where(SupplyItem.stock_quantity <= SupplyItem.min_stock)
        .order_by(SupplyItem.name)
    )
    return list(result.scalars().all())


# ─── Supply Usage (pro Patient) ───────────────────────────────

async def list_supply_usages(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    base = select(SupplyUsage).where(SupplyUsage.patient_id == patient_id)
    count_q = select(func.count()).select_from(SupplyUsage).where(SupplyUsage.patient_id == patient_id)

    total = (await db.execute(count_q)).scalar() or 0
    query = base.order_by(SupplyUsage.used_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def create_supply_usage(
    db: AsyncSession,
    data: SupplyUsageCreate,
    used_by: uuid.UUID | None = None,
) -> SupplyUsage:
    # Bestand prüfen und aktualisieren
    item = await get_supply_item(db, data.supply_item_id)
    if not item:
        raise ValueError("Verbrauchsmaterial nicht gefunden.")
    if not item.is_active:
        raise ValueError("Verbrauchsmaterial ist deaktiviert.")
    if item.stock_quantity < data.quantity:
        raise ValueError(f"Unzureichender Bestand: {item.stock_quantity} verfügbar, {data.quantity} benötigt.")

    item.stock_quantity -= data.quantity

    usage = SupplyUsage(**data.model_dump(), used_by=used_by)
    db.add(usage)
    await db.commit()
    await db.refresh(usage)
    logger.info("Material verbraucht: %s × %d — Patient %s", item.name, data.quantity, data.patient_id)

    # Warnung bei niedrigem Bestand
    if item.stock_quantity <= item.min_stock:
        logger.warning("⚠️ Niedriger Bestand: '%s' — %d Stk. (Mindest: %d)", item.name, item.stock_quantity, item.min_stock)

    return usage
