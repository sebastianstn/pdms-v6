"""Lab result service — CRUD, trend calculation, batch import."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.lab import LabResult
from src.domain.schemas.lab import (
    ANALYTES,
    LabResultCreate,
    LabResultUpdate,
)
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.lab")


# ─── Interpretation helpers ─────────────────────────────────────

def _interpret(value: float, ref_min: float | None, ref_max: float | None) -> tuple[str | None, str | None]:
    """Return (flag, interpretation) based on reference range."""
    if ref_min is None and ref_max is None:
        return None, None

    if ref_max is not None and value > ref_max * 2:
        return "HH", "critical"
    if ref_min is not None and ref_min > 0 and value < ref_min * 0.5:
        return "LL", "critical"
    if ref_max is not None and value > ref_max:
        return "H", "pathological"
    if ref_min is not None and value < ref_min:
        return "L", "pathological"

    # Borderline: within 10% of bounds
    if ref_max is not None and value > ref_max * 0.9:
        return None, "borderline"
    if ref_min is not None and ref_min > 0 and value < ref_min * 1.1:
        return None, "borderline"

    return None, "normal"


def _trend_symbol(current: float, previous: float | None) -> str | None:
    """Compute trend arrow from current vs previous value."""
    if previous is None:
        return None
    if current == previous:
        return "→"
    pct = abs(current - previous) / max(abs(previous), 0.001) * 100
    if current > previous:
        return "↑↑" if pct > 50 else "↑"
    return "↓↓" if pct > 50 else "↓"


# ─── CRUD ───────────────────────────────────────────────────────

async def list_lab_results(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    analyte: str | None = None,
    category: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    """List lab results with optional filters, paginated."""
    base = select(LabResult).where(LabResult.patient_id == patient_id)
    count_q = select(func.count()).select_from(LabResult).where(LabResult.patient_id == patient_id)

    if analyte:
        base = base.where(LabResult.analyte == analyte)
        count_q = count_q.where(LabResult.analyte == analyte)
    if category:
        base = base.where(LabResult.category == category)
        count_q = count_q.where(LabResult.category == category)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * per_page
    query = base.order_by(LabResult.resulted_at.desc()).offset(offset).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_lab_result(db: AsyncSession, result_id: uuid.UUID) -> LabResult | None:
    return (await db.execute(select(LabResult).where(LabResult.id == result_id))).scalar_one_or_none()


async def _get_previous_value(db: AsyncSession, patient_id: uuid.UUID, analyte: str) -> float | None:
    """Get the most recent value for this analyte (for trend computation)."""
    q = (
        select(LabResult.value)
        .where(LabResult.patient_id == patient_id, LabResult.analyte == analyte)
        .order_by(LabResult.resulted_at.desc())
        .limit(1)
    )
    row = (await db.execute(q)).scalar_one_or_none()
    return row


async def create_lab_result(
    db: AsyncSession,
    data: LabResultCreate,
    ordered_by: uuid.UUID | None = None,
) -> LabResult:
    """Create a single lab result with auto-interpretation and trend."""
    # Look up catalogue defaults
    catalogue = ANALYTES.get(data.analyte, {})
    display_name = data.display_name or catalogue.get("display", data.analyte)
    unit = data.unit or catalogue.get("unit", "")
    ref_min = data.ref_min if data.ref_min is not None else catalogue.get("ref_min")
    ref_max = data.ref_max if data.ref_max is not None else catalogue.get("ref_max")
    loinc = data.loinc_code or catalogue.get("loinc")

    # Auto-interpret
    flag, interpretation = _interpret(data.value, ref_min, ref_max)
    if data.flag:
        flag = data.flag  # Explicit override

    # Trend from previous
    prev = await _get_previous_value(db, data.patient_id, data.analyte)
    trend = _trend_symbol(data.value, prev)

    result = LabResult(
        patient_id=data.patient_id,
        encounter_id=data.encounter_id,
        analyte=data.analyte,
        loinc_code=loinc,
        display_name=display_name,
        value=data.value,
        unit=unit,
        ref_min=ref_min,
        ref_max=ref_max,
        flag=flag,
        interpretation=interpretation,
        trend=trend,
        previous_value=prev,
        category=data.category or catalogue.get("category", "chemistry"),
        sample_type=data.sample_type,
        collected_at=data.collected_at,
        ordered_by=ordered_by,
        order_number=data.order_number,
        notes=data.notes,
    )
    db.add(result)
    await db.commit()
    await db.refresh(result)

    await emit_event(RoutingKeys.LAB_RESULTED, {
        "patient_id": str(data.patient_id),
        "analyte": data.analyte,
        "value": data.value,
        "flag": flag,
        "interpretation": interpretation,
    })

    # Emit critical alert for HH/LL results
    if flag in ("HH", "LL"):
        await emit_event(RoutingKeys.LAB_CRITICAL, {
            "patient_id": str(data.patient_id),
            "analyte": data.analyte,
            "display_name": display_name,
            "value": data.value,
            "unit": unit,
            "flag": flag,
        })

    logger.info("Lab result created: %s=%s %s for patient %s", data.analyte, data.value, unit, data.patient_id)
    return result


async def create_lab_results_batch(
    db: AsyncSession,
    patient_id: uuid.UUID,
    results: list[LabResultCreate],
    *,
    encounter_id: uuid.UUID | None = None,
    order_number: str | None = None,
    collected_at: datetime | None = None,
    sample_type: str | None = None,
    ordered_by: uuid.UUID | None = None,
) -> list[LabResult]:
    """Create multiple results from one blood draw / order."""
    created = []
    for data in results:
        # Apply batch defaults
        if not data.encounter_id:
            data.encounter_id = encounter_id
        if not data.order_number:
            data.order_number = order_number
        if not data.collected_at:
            data.collected_at = collected_at
        if not data.sample_type:
            data.sample_type = sample_type
        data.patient_id = patient_id

        result = await create_lab_result(db, data, ordered_by=ordered_by)
        created.append(result)

    return created


async def update_lab_result(
    db: AsyncSession,
    result_id: uuid.UUID,
    data: LabResultUpdate,
) -> LabResult | None:
    result = await get_lab_result(db, result_id)
    if not result:
        return None

    updates = data.model_dump(exclude_unset=True)
    if "value" in updates:
        result.value = updates["value"]
        flag, interpretation = _interpret(updates["value"], result.ref_min, result.ref_max)
        result.flag = updates.get("flag", flag)
        result.interpretation = interpretation
    elif "flag" in updates:
        result.flag = updates["flag"]

    if "notes" in updates:
        result.notes = updates["notes"]
    if "validated_by" in updates:
        result.validated_by = updates["validated_by"]

    await db.commit()
    await db.refresh(result)
    return result


async def delete_lab_result(db: AsyncSession, result_id: uuid.UUID) -> bool:
    result = await get_lab_result(db, result_id)
    if not result:
        return False
    await db.delete(result)
    await db.commit()
    return True


# ─── Trend (for chart) ─────────────────────────────────────────

async def get_lab_trend(
    db: AsyncSession,
    patient_id: uuid.UUID,
    analyte: str,
    *,
    limit: int = 20,
) -> dict:
    """Return the last N results for a given analyte (for chart)."""
    catalogue = ANALYTES.get(analyte, {})

    q = (
        select(LabResult)
        .where(LabResult.patient_id == patient_id, LabResult.analyte == analyte)
        .order_by(LabResult.resulted_at.asc())
        .limit(limit)
    )
    rows = (await db.execute(q)).scalars().all()

    return {
        "analyte": analyte,
        "display_name": catalogue.get("display", analyte),
        "unit": catalogue.get("unit", ""),
        "ref_min": catalogue.get("ref_min"),
        "ref_max": catalogue.get("ref_max"),
        "points": [
            {
                "value": r.value,
                "resulted_at": r.resulted_at,
                "flag": r.flag,
                "interpretation": r.interpretation,
            }
            for r in rows
        ],
    }


# ─── Summary (latest per analyte) ──────────────────────────────

async def get_lab_summary(db: AsyncSession, patient_id: uuid.UUID) -> list[dict]:
    """Return the latest result per analyte for a patient (for mini-table)."""
    # Subquery: max resulted_at per analyte
    sub = (
        select(LabResult.analyte, func.max(LabResult.resulted_at).label("max_at"))
        .where(LabResult.patient_id == patient_id)
        .group_by(LabResult.analyte)
        .subquery()
    )

    q = (
        select(LabResult)
        .join(sub, (LabResult.analyte == sub.c.analyte) & (LabResult.resulted_at == sub.c.max_at))
        .where(LabResult.patient_id == patient_id)
        .order_by(LabResult.category, LabResult.display_name)
    )
    rows = (await db.execute(q)).scalars().all()

    return [
        {
            "analyte": r.analyte,
            "display_name": r.display_name,
            "value": r.value,
            "unit": r.unit,
            "ref_min": r.ref_min,
            "ref_max": r.ref_max,
            "flag": r.flag,
            "interpretation": r.interpretation,
            "trend": r.trend,
            "resulted_at": r.resulted_at,
        }
        for r in rows
    ]
