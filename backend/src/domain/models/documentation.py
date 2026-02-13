"""Dokumentations-Modelle — Re-Export aus clinical.py.

ClinicalNote und NursingEntry sind in clinical.py definiert.
Dieses Modul stellt Kompatibilitäts-Aliases für Imports bereit.
"""

from src.domain.models.clinical import (
    ClinicalNote,
    NursingAssessment,
    NursingEntry,
)

__all__ = [
    "ClinicalNote",
    "NursingEntry",
    "NursingAssessment",
]
