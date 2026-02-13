"""Note-Service — Re-Export der ClinicalNote-Funktionen.

Der eigenständige 'notes'-Endpunkt wurde durch das klinische Notizen-Modul
(clinical_note_service) ersetzt. Dieses Modul stellt Kompatibilitäts-Aliases bereit."""

from src.domain.services.clinical_note_service import (
    amend_clinical_note,
    co_sign_clinical_note,
    create_clinical_note,
    delete_clinical_note,
    finalize_clinical_note,
    get_clinical_note,
    list_clinical_notes,
    update_clinical_note,
)

__all__ = [
    "list_clinical_notes",
    "get_clinical_note",
    "create_clinical_note",
    "update_clinical_note",
    "finalize_clinical_note",
    "co_sign_clinical_note",
    "amend_clinical_note",
    "delete_clinical_note",
]
