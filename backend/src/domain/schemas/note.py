"""Note schemas — Re-Export der klinischen Notizen-Schemas.

Der eigenständige 'notes'-Endpunkt verwendet die gleichen Schemas
wie das clinical_notes-Modul. Dieses Modul stellt Kompatibilitäts-Aliases bereit.
"""

from src.domain.schemas.clinical_note import (
    ClinicalNoteCoSign,
    ClinicalNoteCreate,
    ClinicalNoteFinalize,
    ClinicalNoteResponse,
    ClinicalNoteUpdate,
    NOTE_STATUS_LABELS,
    NOTE_STATUSES,
    NOTE_TYPE_LABELS,
    NOTE_TYPES,
    PaginatedClinicalNotes,
)

# Re-Exports als Aliases
NoteCreate = ClinicalNoteCreate
NoteUpdate = ClinicalNoteUpdate
NoteResponse = ClinicalNoteResponse
PaginatedNotes = PaginatedClinicalNotes
NoteFinalize = ClinicalNoteFinalize
NoteCoSign = ClinicalNoteCoSign

__all__ = [
    "NoteCreate",
    "NoteUpdate",
    "NoteResponse",
    "PaginatedNotes",
    "NoteFinalize",
    "NoteCoSign",
    "NOTE_TYPES",
    "NOTE_TYPE_LABELS",
    "NOTE_STATUSES",
    "NOTE_STATUS_LABELS",
]
