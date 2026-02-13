"""Medical Letter API endpoints — Arztbriefe CRUD, finalize, co-sign, send."""

import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db, require_role
from src.domain.schemas.medical_letter import (
    MedicalLetterCreate,
    MedicalLetterResponse,
    MedicalLetterSend,
    MedicalLetterUpdate,
    PaginatedMedicalLetters,
)
from src.domain.services.medical_letter_service import (
    co_sign_medical_letter,
    create_medical_letter,
    delete_medical_letter,
    finalize_medical_letter,
    get_medical_letter,
    list_medical_letters,
    send_medical_letter,
    update_medical_letter,
)

router = APIRouter()

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]
DoctorOrAdmin = Annotated[dict, Depends(require_role("arzt", "admin"))]


@router.get("/patients/{patient_id}/medical-letters", response_model=PaginatedMedicalLetters)
async def list_letters(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
    letter_type: str | None = Query(None, pattern=r"^(discharge|referral|progress|transfer)$"),
    status: str | None = Query(None, pattern=r"^(draft|final|sent|amended)$"),
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=200),
):
    """Arztbriefe eines Patienten auflisten."""
    return await list_medical_letters(db, patient_id, letter_type=letter_type, status=status, page=page, per_page=per_page)


@router.get("/medical-letters/{letter_id}", response_model=MedicalLetterResponse)
async def get_letter(letter_id: uuid.UUID, db: DbSession, user: CurrentUser):
    """Einzelnen Arztbrief laden."""
    letter = await get_medical_letter(db, letter_id)
    if not letter:
        raise HTTPException(404, "Arztbrief nicht gefunden")
    return letter


@router.post("/medical-letters", response_model=MedicalLetterResponse, status_code=201)
async def create_letter(data: MedicalLetterCreate, db: DbSession, user: DoctorOrAdmin):
    """Neuen Arztbrief erstellen."""
    author_id = uuid.UUID(user["sub"]) if user.get("sub") else None
    return await create_medical_letter(db, data, author_id=author_id)


@router.patch("/medical-letters/{letter_id}", response_model=MedicalLetterResponse)
async def update_letter(letter_id: uuid.UUID, data: MedicalLetterUpdate, db: DbSession, user: DoctorOrAdmin):
    """Arztbrief bearbeiten (nur Entwürfe/Nachträge)."""
    try:
        letter = await update_medical_letter(db, letter_id, data)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not letter:
        raise HTTPException(404, "Arztbrief nicht gefunden")
    return letter


@router.post("/medical-letters/{letter_id}/finalize", response_model=MedicalLetterResponse)
async def finalize_letter(letter_id: uuid.UUID, db: DbSession, user: DoctorOrAdmin):
    """Arztbrief finalisieren."""
    try:
        letter = await finalize_medical_letter(db, letter_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not letter:
        raise HTTPException(404, "Arztbrief nicht gefunden")
    return letter


@router.post("/medical-letters/{letter_id}/co-sign", response_model=MedicalLetterResponse)
async def co_sign_letter(letter_id: uuid.UUID, db: DbSession, user: DoctorOrAdmin):
    """Arztbrief co-signieren."""
    co_signer_id = uuid.UUID(user["sub"]) if user.get("sub") else None
    if not co_signer_id:
        raise HTTPException(400, "User-ID nicht verfügbar")
    try:
        letter = await co_sign_medical_letter(db, letter_id, co_signer_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not letter:
        raise HTTPException(404, "Arztbrief nicht gefunden")
    return letter


@router.post("/medical-letters/{letter_id}/send", response_model=MedicalLetterResponse)
async def send_letter(letter_id: uuid.UUID, body: MedicalLetterSend, db: DbSession, user: DoctorOrAdmin):
    """Arztbrief versenden (HIN-Mail, E-Mail, Fax, Druck)."""
    try:
        letter = await send_medical_letter(db, letter_id, body.send_via)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not letter:
        raise HTTPException(404, "Arztbrief nicht gefunden")
    return letter


@router.delete("/medical-letters/{letter_id}", status_code=204)
async def delete_letter(letter_id: uuid.UUID, db: DbSession, user: DoctorOrAdmin):
    """Arztbrief-Entwurf löschen."""
    try:
        deleted = await delete_medical_letter(db, letter_id)
    except ValueError as exc:
        raise HTTPException(409, str(exc))
    if not deleted:
        raise HTTPException(404, "Arztbrief nicht gefunden")
