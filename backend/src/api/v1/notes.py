"""Notes API routes — Alias-Router für klinische Notizen.

Dieser Router leitet auf die clinical_notes-Endpoints weiter.
Der Hauptrouter befindet sich in clinical_notes.py.
"""

from fastapi import APIRouter

from src.api.v1.clinical_notes import router as clinical_notes_router

router = APIRouter()

# Der notes-Endpunkt ist identisch mit clinical_notes.
# Alle Endpoints sind unter /api/v1/clinical-notes verfügbar.
# Dieser Router existiert nur für Abwärtskompatibilität.
