"""Clinical Notes API endpoints — CRUD, finalize, co-sign, amend."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.clinical_note import (
    ClinicalNoteCoSign,
    ClinicalNoteCreate,
    ClinicalNoteFinalize,
    ClinicalNoteResponse,
    ClinicalNoteUpdate,
    PaginatedClinicalNotes,
    NOTE_TYPE_LABELS,
    NOTE_STATUS_LABELS,
)
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

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
DoctorOrAdmin = Annotated[dict, Depends(require_role("arzt", "admin"))]


# ─── Meta (Labels) ────────────────────────────────────────────


@router.get("/clinical-notes/meta", response_model=dict)
async def get_note_meta(user: CurrentUser):
    """Notiz-Typen und Status-Labels abrufen."""
    return {
        "note_types": NOTE_TYPE_LABELS,
        "note_statuses": NOTE_STATUS_LABELS,
    }


# ─── List ──────────────────────────────────────────────────────


@router.get(
    "/patients/{patient_id}/clinical-notes",
    response_model=PaginatedClinicalNotes,
)
async def list_notes(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    note_type: str | None = Query(None),
    status: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Klinische Notizen eines Patienten — paginiert, filterbar."""
    return await list_clinical_notes(
        db, patient_id, note_type=note_type, status=status, page=page, per_page=per_page
    )


# ─── Read ──────────────────────────────────────────────────────


@router.get(
    "/clinical-notes/{note_id}",
    response_model=ClinicalNoteResponse,
)
async def get_note(note_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Einzelne klinische Notiz abrufen."""
    note = await get_clinical_note(db, note_id)
    if not note:
        raise HTTPException(404, "Klinische Notiz nicht gefunden")
    return note


# ─── Create ────────────────────────────────────────────────────


@router.post(
    "/clinical-notes",
    response_model=ClinicalNoteResponse,
    status_code=201,
)
async def create_note(
    data: ClinicalNoteCreate,
    db: DbSession,
    user: DoctorOrAdmin,
):
    """Neue klinische Notiz erstellen (nur Ärzte/Admin)."""
    author_id = uuid.UUID(user["sub"]) if user.get("sub") else None
    return await create_clinical_note(db, data, author_id=author_id)


# ─── Update ────────────────────────────────────────────────────


@router.patch(
    "/clinical-notes/{note_id}",
    response_model=ClinicalNoteResponse,
)
async def update_note(
    note_id: uuid.UUID,
    data: ClinicalNoteUpdate,
    db: DbSession,
    user: DoctorOrAdmin,
):
    """Klinische Notiz aktualisieren (nur draft/amended)."""
    try:
        note = await update_clinical_note(db, note_id, data)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not note:
        raise HTTPException(404, "Klinische Notiz nicht gefunden")
    return note


# ─── Finalize ──────────────────────────────────────────────────


@router.post(
    "/clinical-notes/{note_id}/finalize",
    response_model=ClinicalNoteResponse,
)
async def finalize_note(
    note_id: uuid.UUID,
    body: ClinicalNoteFinalize,
    db: DbSession,
    user: DoctorOrAdmin,
):
    """Notiz finalisieren — Status: draft → final."""
    try:
        note = await finalize_clinical_note(db, note_id, summary=body.summary)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not note:
        raise HTTPException(404, "Klinische Notiz nicht gefunden")
    return note


# ─── Co-Sign ──────────────────────────────────────────────────


@router.post(
    "/clinical-notes/{note_id}/co-sign",
    response_model=ClinicalNoteResponse,
)
async def co_sign_note(
    note_id: uuid.UUID,
    body: ClinicalNoteCoSign,
    db: DbSession,
    user: DoctorOrAdmin,
):
    """Co-Signatur einer finalisierten Notiz (ein anderer Arzt)."""
    co_signer_id = uuid.UUID(user["sub"]) if user.get("sub") else None
    if not co_signer_id:
        raise HTTPException(400, "User-ID nicht verfügbar")
    try:
        note = await co_sign_clinical_note(db, note_id, co_signer_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not note:
        raise HTTPException(404, "Klinische Notiz nicht gefunden")
    return note


# ─── Amend ─────────────────────────────────────────────────────


@router.post(
    "/clinical-notes/{note_id}/amend",
    response_model=ClinicalNoteResponse,
)
async def amend_note(
    note_id: uuid.UUID,
    db: DbSession,
    user: DoctorOrAdmin,
):
    """Finalisierte Notiz in den Nachtragsmodus setzen."""
    try:
        note = await amend_clinical_note(db, note_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not note:
        raise HTTPException(404, "Klinische Notiz nicht gefunden")
    return note


# ─── Delete ────────────────────────────────────────────────────


@router.delete(
    "/clinical-notes/{note_id}",
    status_code=204,
)
async def delete_note(
    note_id: uuid.UUID,
    db: DbSession,
    user: DoctorOrAdmin,
):
    """Notiz löschen (Entwürfe) oder als Fehleingabe markieren (finalisierte)."""
    deleted = await delete_clinical_note(db, note_id)
    if not deleted:
        raise HTTPException(404, "Klinische Notiz nicht gefunden")
