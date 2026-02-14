"""Medikamenten-Katalog — Such-Service."""

import logging

from sqlalchemy import or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.medikament_katalog import MedikamentKatalog

logger = logging.getLogger("pdms.medikament_katalog")


async def search_medikamente(
    db: AsyncSession,
    query: str,
    *,
    limit: int = 15,
) -> list[dict]:
    """Durchsucht den Medikamenten-Katalog nach Name, Wirkstoff oder ATC-Code."""
    q = query.strip()
    if not q or len(q) < 2:
        return []

    pattern = f"%{q}%"

    stmt = (
        select(MedikamentKatalog)
        .where(
            or_(
                MedikamentKatalog.name.ilike(pattern),
                MedikamentKatalog.wirkstoff.ilike(pattern),
                MedikamentKatalog.atc_code.ilike(pattern),
            )
        )
        .order_by(MedikamentKatalog.name.asc())
        .limit(limit)
    )

    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "name": r.name,
            "wirkstoff": r.wirkstoff,
            "hersteller": r.hersteller,
            "dosis": r.dosis,
            "form": r.form,
            "route": r.route,
            "route_label": r.route_label,
            "atc_code": r.atc_code,
            "kategorie": r.kategorie,
        }
        for r in rows
    ]


async def count_medikamente(db: AsyncSession) -> int:
    """Anzahl Einträge im Medikamenten-Katalog."""
    result = await db.execute(select(func.count()).select_from(MedikamentKatalog))
    return result.scalar() or 0
