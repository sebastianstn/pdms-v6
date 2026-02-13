"""Treatment Plan service — CRUD for therapy plans and items."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.therapy import TreatmentPlan, TreatmentPlanItem
from src.domain.schemas.treatment_plan import TreatmentPlanCreate, TreatmentPlanUpdate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.treatment_plan")


async def list_treatment_plans(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    status: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    base = select(TreatmentPlan).where(TreatmentPlan.patient_id == patient_id).options(selectinload(TreatmentPlan.items))
    count_q = select(func.count()).select_from(TreatmentPlan).where(TreatmentPlan.patient_id == patient_id)

    if status:
        base = base.where(TreatmentPlan.status == status)
        count_q = count_q.where(TreatmentPlan.status == status)

    total = (await db.execute(count_q)).scalar() or 0
    query = base.order_by(TreatmentPlan.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().unique().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_treatment_plan(db: AsyncSession, plan_id: uuid.UUID) -> TreatmentPlan | None:
    result = await db.execute(
        select(TreatmentPlan).where(TreatmentPlan.id == plan_id).options(selectinload(TreatmentPlan.items))
    )
    return result.scalar_one_or_none()


async def create_treatment_plan(
    db: AsyncSession,
    data: TreatmentPlanCreate,
    created_by: uuid.UUID | None = None,
) -> TreatmentPlan:
    plan = TreatmentPlan(
        patient_id=data.patient_id,
        encounter_id=data.encounter_id,
        title=data.title,
        diagnosis=data.diagnosis,
        icd_code=data.icd_code,
        goals=data.goals,
        interventions=data.interventions,
        start_date=data.start_date,
        target_date=data.target_date,
        priority=data.priority,
        review_date=data.review_date,
        notes=data.notes,
        created_by=created_by,
        responsible_physician_id=created_by,
    )
    db.add(plan)
    await db.flush()

    for item_data in data.items:
        item = TreatmentPlanItem(
            plan_id=plan.id,
            **item_data.model_dump(),
        )
        db.add(item)

    await db.commit()
    await db.refresh(plan)
    logger.info("Therapieplan erstellt: %s — Patient %s", plan.id, plan.patient_id)

    await emit_event(RoutingKeys.TREATMENT_PLAN_CREATED, {
        "plan_id": str(plan.id),
        "patient_id": str(plan.patient_id),
        "title": plan.title,
        "created_by": str(created_by) if created_by else None,
    })

    return await get_treatment_plan(db, plan.id)  # type: ignore


async def update_treatment_plan(
    db: AsyncSession,
    plan_id: uuid.UUID,
    data: TreatmentPlanUpdate,
) -> TreatmentPlan | None:
    plan = await get_treatment_plan(db, plan_id)
    if not plan:
        return None

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)

    plan.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(plan)
    logger.info("Therapieplan aktualisiert: %s", plan.id)
    return plan


async def complete_plan_item(
    db: AsyncSession,
    item_id: uuid.UUID,
    completed_by: uuid.UUID,
) -> TreatmentPlanItem | None:
    result = await db.execute(select(TreatmentPlanItem).where(TreatmentPlanItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        return None

    item.status = "completed"
    item.completed_at = datetime.now(UTC)
    item.completed_by = completed_by
    await db.commit()
    await db.refresh(item)
    return item


async def delete_treatment_plan(db: AsyncSession, plan_id: uuid.UUID) -> bool:
    plan = await get_treatment_plan(db, plan_id)
    if not plan:
        return False
    await db.delete(plan)
    await db.commit()
    logger.info("Therapieplan gelöscht: %s", plan_id)
    return True
