"""Alarm service — threshold checking, CRUD, WebSocket broadcast."""

import json
import logging
import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.clinical import Alarm, VitalSign
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.alarms")


# ─── Klinische Schwellenwerte (Schweizer Richtlinien) ──────────
# Jeder Parameter hat: (min_warning, max_warning, min_critical, max_critical)
# None = keine Grenze in dieser Richtung
THRESHOLDS: dict[str, dict[str, tuple[float | None, float | None]]] = {
    "heart_rate": {
        "warning":  (50, 110),
        "critical": (40, 140),
    },
    "systolic_bp": {
        "warning":  (90, 160),
        "critical": (80, 200),
    },
    "diastolic_bp": {
        "warning":  (55, 95),
        "critical": (45, 110),
    },
    "spo2": {
        "warning":  (92, None),
        "critical": (88, None),
    },
    "temperature": {
        "warning":  (36.0, 38.0),
        "critical": (35.0, 39.5),
    },
    "respiratory_rate": {
        "warning":  (10, 24),
        "critical": (8, 30),
    },
}


# ─── Threshold Check ───────────────────────────────────────────

async def check_thresholds(
    session: AsyncSession,
    vital: VitalSign,
) -> list[Alarm]:
    """Prüft alle Vitalparameter gegen Schwellenwerte und erzeugt Alarme."""
    new_alarms: list[Alarm] = []

    for param, levels in THRESHOLDS.items():
        value = getattr(vital, param, None)
        if value is None:
            continue

        severity = _evaluate_severity(value, levels)
        if severity is None:
            continue

        # Kein Duplikat-Alarm wenn bereits ein aktiver Alarm für diesen Parameter+Patient existiert
        existing = await session.execute(
            select(Alarm).where(
                Alarm.patient_id == vital.patient_id,
                Alarm.parameter == param,
                Alarm.status == "active",
            )
        )
        if existing.scalar_one_or_none() is not None:
            continue

        alarm = Alarm(
            patient_id=vital.patient_id,
            vital_sign_id=vital.id,
            parameter=param,
            value=value,
            threshold_min=levels["warning"][0],
            threshold_max=levels["warning"][1],
            severity=severity,
            status="active",
        )
        session.add(alarm)
        new_alarms.append(alarm)
        logger.warning(
            f"🚨 Alarm: patient={vital.patient_id} param={param} value={value} severity={severity}"
        )

    if new_alarms:
        await session.flush()

    return new_alarms


def _evaluate_severity(
    value: float,
    levels: dict[str, tuple[float | None, float | None]],
) -> str | None:
    """Bestimmt Schweregrad: critical > warning > None."""
    crit_min, crit_max = levels["critical"]
    warn_min, warn_max = levels["warning"]

    # Critical?
    if crit_min is not None and value < crit_min:
        return "critical"
    if crit_max is not None and value > crit_max:
        return "critical"

    # Warning?
    if warn_min is not None and value < warn_min:
        return "warning"
    if warn_max is not None and value > warn_max:
        return "warning"

    return None


# ─── CRUD ──────────────────────────────────────────────────────

async def list_alarms(
    session: AsyncSession,
    *,
    status_filter: str | None = "active",
    patient_id: uuid.UUID | None = None,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[Alarm], int]:
    """Alarme mit optionalem Filter nach Status und Patient."""
    query = select(Alarm)
    count_query = select(func.count(Alarm.id))

    if status_filter:
        query = query.where(Alarm.status == status_filter)
        count_query = count_query.where(Alarm.status == status_filter)

    if patient_id:
        query = query.where(Alarm.patient_id == patient_id)
        count_query = count_query.where(Alarm.patient_id == patient_id)

    query = query.order_by(Alarm.triggered_at.desc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await session.execute(query)
    total_result = await session.execute(count_query)

    return list(result.scalars().all()), total_result.scalar_one()


async def get_alarm(session: AsyncSession, alarm_id: uuid.UUID) -> Alarm | None:
    """Einzelnen Alarm abrufen."""
    result = await session.execute(select(Alarm).where(Alarm.id == alarm_id))
    return result.scalar_one_or_none()


async def acknowledge_alarm(
    session: AsyncSession,
    alarm_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Alarm | None:
    """Alarm quittieren."""
    alarm = await get_alarm(session, alarm_id)
    if alarm is None:
        return None

    alarm.status = "acknowledged"
    alarm.acknowledged_at = datetime.now(UTC)
    alarm.acknowledged_by = user_id
    await session.flush()

    await emit_event(RoutingKeys.ALARM_ACKNOWLEDGED, {
        "alarm_id": str(alarm.id),
        "patient_id": str(alarm.patient_id),
        "parameter": alarm.parameter,
        "acknowledged_by": str(user_id),
    })

    return alarm


async def resolve_alarm(
    session: AsyncSession,
    alarm_id: uuid.UUID,
) -> Alarm | None:
    """Alarm als gelöst markieren."""
    alarm = await get_alarm(session, alarm_id)
    if alarm is None:
        return None

    alarm.status = "resolved"
    await session.flush()

    await emit_event(RoutingKeys.ALARM_RESOLVED, {
        "alarm_id": str(alarm.id),
        "patient_id": str(alarm.patient_id),
        "parameter": alarm.parameter,
        "resolved_by": "system",
    })

    return alarm


async def get_alarm_counts(session: AsyncSession) -> dict[str, int]:
    """Zählt aktive Alarme nach Schweregrad."""
    result = await session.execute(
        select(Alarm.severity, func.count(Alarm.id))
        .where(Alarm.status == "active")
        .group_by(Alarm.severity)
    )
    counts = {"warning": 0, "critical": 0, "total": 0}
    for severity, count in result.all():
        counts[severity] = count
        counts["total"] += count
    return counts


# ─── Alarm → JSON für WebSocket / RabbitMQ ─────────────────────

def alarm_to_event(alarm: Alarm) -> dict:
    """Alarm-Objekt in serialisierbares Dict umwandeln."""
    return {
        "type": "alarm.triggered",
        "alarm_id": str(alarm.id),
        "patient_id": str(alarm.patient_id),
        "parameter": alarm.parameter,
        "value": alarm.value,
        "severity": alarm.severity,
        "status": alarm.status,
        "triggered_at": alarm.triggered_at.isoformat(),
    }
