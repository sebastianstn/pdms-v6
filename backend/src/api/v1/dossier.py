"""Dossier API endpoint — Aggregierte Patientenübersicht."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.services.dossier_service import get_patient_dossier

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/patients/{patient_id}/dossier")
async def patient_dossier(patient_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Aggregierte Patientenübersicht — alle Module auf einen Blick.

    Gibt Zähler, letzte Einträge und Statusübersicht für:
    Encounter, Vitals, Alarme, Medikamente, Therapiepläne,
    Konsilien, Arztbriefe, Pflegediagnosen, Schichtübergabe,
    Ernährung, klinische Notizen und Pflege-Einträge zurück.
    """
    return await get_patient_dossier(db, patient_id)
