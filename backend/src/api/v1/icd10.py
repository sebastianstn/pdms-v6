"""ICD-10 Katalog API — Diagnosesuche für Autovervollständigung."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.services.icd10_service import count_icd10, search_icd10

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/icd10/search")
async def search_icd10_codes(
    db: DbSession,
    user: CurrentUser,
    q: str = Query(..., min_length=2, max_length=100, description="Suchbegriff (Code oder Text)"),
    limit: int = Query(15, ge=1, le=50),
):
    """Durchsucht den ICD-10 Katalog nach Code oder Bezeichnung.

    Gibt maximal `limit` Treffer zurück, sortiert nach Relevanz.
    """
    results = await search_icd10(db, q, limit=limit)
    return {"results": results, "query": q}


@router.get("/icd10/count")
async def icd10_count(db: DbSession, user: CurrentUser):
    """Anzahl Einträge im ICD-10 Katalog."""
    total = await count_icd10(db)
    return {"total": total}
