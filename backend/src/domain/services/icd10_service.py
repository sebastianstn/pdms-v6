"""ICD-10 Katalog — Such-Service."""

import logging

from sqlalchemy import or_, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.icd10 import Icd10Code

logger = logging.getLogger("pdms.icd10")


async def search_icd10(
    db: AsyncSession,
    query: str,
    *,
    limit: int = 15,
) -> list[dict]:
    """Durchsucht den ICD-10 Katalog nach Code oder Bezeichnung."""
    q = query.strip()
    if not q or len(q) < 2:
        return []

    pattern = f"%{q}%"

    stmt = (
        select(Icd10Code)
        .where(
            or_(
                Icd10Code.code.ilike(pattern),
                Icd10Code.title.ilike(pattern),
            )
        )
        # Exakte Code-Treffer zuerst, dann alphabetisch
        .order_by(
            Icd10Code.code.asc(),
        )
        .limit(limit)
    )

    rows = (await db.execute(stmt)).scalars().all()
    return [
        {
            "code": r.code,
            "title": r.title,
            "chapter": r.chapter,
            "category": r.category,
        }
        for r in rows
    ]


async def count_icd10(db: AsyncSession) -> int:
    """Anzahl Einträge im ICD-10 Katalog."""
    result = await db.execute(select(func.count()).select_from(Icd10Code))
    return result.scalar() or 0
