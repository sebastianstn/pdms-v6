"""Medikamenten-Katalog API — Suche für Autovervollständigung."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.services.medikament_katalog_service import count_medikamente, search_medikamente

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/medikamente-katalog/search")
async def search_medikamente_katalog(
    db: DbSession,
    user: CurrentUser,
    q: str = Query(..., min_length=2, max_length=100, description="Suchbegriff (Name, Wirkstoff oder ATC-Code)"),
    limit: int = Query(15, ge=1, le=50),
):
    """Durchsucht den Medikamenten-Katalog.

    Sucht nach Handelsname, Wirkstoff (Generika) oder ATC-Code.
    """
    results = await search_medikamente(db, q, limit=limit)
    return {"results": results, "query": q}


@router.get("/medikamente-katalog/count")
async def medikamente_count(db: DbSession, user: CurrentUser):
    """Anzahl Einträge im Medikamenten-Katalog."""
    total = await count_medikamente(db)
    return {"total": total}
