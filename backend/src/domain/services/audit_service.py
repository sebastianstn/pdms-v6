"""Audit-Service — Abfrage und Analyse von Audit-Log-Einträgen."""

import logging
import uuid
from datetime import date, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.system import AuditLog

logger = logging.getLogger("pdms.audit")


async def list_audit_logs(
    db: AsyncSession,
    *,
    user_id: uuid.UUID | None = None,
    action: str | None = None,
    resource_type: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    """Paginierte Liste von Audit-Log-Einträgen mit optionalen Filtern."""
    query = select(AuditLog)
    count_q = select(func.count()).select_from(AuditLog)

    if user_id:
        query = query.where(AuditLog.user_id == user_id)
        count_q = count_q.where(AuditLog.user_id == user_id)
    if action:
        query = query.where(AuditLog.action == action)
        count_q = count_q.where(AuditLog.action == action)
    if resource_type:
        query = query.where(AuditLog.resource_type.ilike(f"%{resource_type}%"))
        count_q = count_q.where(AuditLog.resource_type.ilike(f"%{resource_type}%"))
    if date_from:
        dt_from = datetime.combine(date_from, datetime.min.time())
        query = query.where(AuditLog.created_at >= dt_from)
        count_q = count_q.where(AuditLog.created_at >= dt_from)
    if date_to:
        dt_to = datetime.combine(date_to, datetime.max.time())
        query = query.where(AuditLog.created_at <= dt_to)
        count_q = count_q.where(AuditLog.created_at <= dt_to)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * per_page
    rows = (
        await db.execute(
            query.order_by(AuditLog.created_at.desc()).offset(offset).limit(per_page)
        )
    ).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_audit_entry(db: AsyncSession, log_id: uuid.UUID) -> AuditLog | None:
    """Einzelnen Audit-Log-Eintrag laden."""
    return (
        await db.execute(select(AuditLog).where(AuditLog.id == log_id))
    ).scalar_one_or_none()


async def get_patient_audit_logs(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    """Audit-Logs für einen bestimmten Patienten (resource_id filter)."""
    pid_str = str(patient_id)
    base_filter = AuditLog.resource_type.ilike(f"%/patients/{pid_str}%")

    query = select(AuditLog).where(base_filter)
    count_q = select(func.count()).select_from(AuditLog).where(base_filter)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * per_page
    rows = (
        await db.execute(
            query.order_by(AuditLog.created_at.desc()).offset(offset).limit(per_page)
        )
    ).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_audit_stats(db: AsyncSession) -> dict:
    """Zusammenfassung der Audit-Logs (Anzahl pro Aktion, Top-Ressourcen)."""
    total = (await db.execute(select(func.count()).select_from(AuditLog))).scalar() or 0

    action_counts_q = (
        select(AuditLog.action, func.count().label("count"))
        .group_by(AuditLog.action)
        .order_by(func.count().desc())
    )
    action_rows = (await db.execute(action_counts_q)).all()
    by_action = {row.action: row.count for row in action_rows}

    resource_counts_q = (
        select(AuditLog.resource_type, func.count().label("count"))
        .group_by(AuditLog.resource_type)
        .order_by(func.count().desc())
        .limit(10)
    )
    resource_rows = (await db.execute(resource_counts_q)).all()
    by_resource = {row.resource_type: row.count for row in resource_rows}

    return {
        "total_entries": total,
        "by_action": by_action,
        "by_resource": by_resource,
    }
