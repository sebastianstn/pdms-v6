"""Nutrition service — CRUD for diet orders and screenings."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.therapy import NutritionOrder, NutritionScreening
from src.domain.schemas.nutrition import NutritionOrderCreate, NutritionOrderUpdate, NutritionScreeningCreate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.nutrition")


# ─── Nutrition Orders ──────────────────────────────────────────

async def list_nutrition_orders(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    status: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    base = select(NutritionOrder).where(NutritionOrder.patient_id == patient_id)
    count_q = select(func.count()).select_from(NutritionOrder).where(NutritionOrder.patient_id == patient_id)

    if status:
        base = base.where(NutritionOrder.status == status)
        count_q = count_q.where(NutritionOrder.status == status)

    total = (await db.execute(count_q)).scalar() or 0
    query = base.order_by(NutritionOrder.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_nutrition_order(db: AsyncSession, order_id: uuid.UUID) -> NutritionOrder | None:
    result = await db.execute(select(NutritionOrder).where(NutritionOrder.id == order_id))
    return result.scalar_one_or_none()


async def create_nutrition_order(
    db: AsyncSession,
    data: NutritionOrderCreate,
    ordered_by: uuid.UUID | None = None,
) -> NutritionOrder:
    order = NutritionOrder(**data.model_dump(), ordered_by=ordered_by)
    db.add(order)
    await db.commit()
    await db.refresh(order)
    logger.info("Ernährungsverordnung erstellt: %s (%s) — Patient %s", order.id, data.diet_type, data.patient_id)

    await emit_event(RoutingKeys.NUTRITION_ORDER_CREATED, {
        "order_id": str(order.id),
        "patient_id": str(order.patient_id),
        "diet_type": order.diet_type,
    })

    return order


async def update_nutrition_order(
    db: AsyncSession,
    order_id: uuid.UUID,
    data: NutritionOrderUpdate,
) -> NutritionOrder | None:
    order = await get_nutrition_order(db, order_id)
    if not order:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(order, field, value)

    order.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(order)
    logger.info("Ernährungsverordnung aktualisiert: %s", order.id)
    return order


async def delete_nutrition_order(db: AsyncSession, order_id: uuid.UUID) -> bool:
    order = await get_nutrition_order(db, order_id)
    if not order:
        return False
    await db.delete(order)
    await db.commit()
    logger.info("Ernährungsverordnung gelöscht: %s", order_id)
    return True


# ─── Nutrition Screenings ──────────────────────────────────────

async def list_nutrition_screenings(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    screening_type: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    base = select(NutritionScreening).where(NutritionScreening.patient_id == patient_id)
    count_q = select(func.count()).select_from(NutritionScreening).where(NutritionScreening.patient_id == patient_id)

    if screening_type:
        base = base.where(NutritionScreening.screening_type == screening_type)
        count_q = count_q.where(NutritionScreening.screening_type == screening_type)

    total = (await db.execute(count_q)).scalar() or 0
    query = base.order_by(NutritionScreening.screened_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def create_nutrition_screening(
    db: AsyncSession,
    data: NutritionScreeningCreate,
    screened_by: uuid.UUID | None = None,
) -> NutritionScreening:
    screening = NutritionScreening(**data.model_dump(), screened_by=screened_by)
    db.add(screening)
    await db.commit()
    await db.refresh(screening)
    logger.info("Ernährungs-Screening: %s Score=%d Risk=%s — Patient %s",
                data.screening_type, data.total_score, data.risk_level, data.patient_id)
    return screening
