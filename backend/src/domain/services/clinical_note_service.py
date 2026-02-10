"""Clinical Note service — CRUD for doctor notes and reports."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.clinical import ClinicalNote
from src.domain.schemas.clinical_note import (
    ClinicalNoteCreate,
    ClinicalNoteUpdate,
)
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.clinical_notes")


# ─── List / Read ───────────────────────────────────────────────


async def list_clinical_notes(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    note_type: str | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    """Paginierte Liste klinischer Notizen für einen Patienten."""
    base = select(ClinicalNote).where(ClinicalNote.patient_id == patient_id)
    count_q = select(func.count()).select_from(ClinicalNote).where(ClinicalNote.patient_id == patient_id)

    if note_type:
        base = base.where(ClinicalNote.note_type == note_type)
        count_q = count_q.where(ClinicalNote.note_type == note_type)
    if status:
        base = base.where(ClinicalNote.status == status)
        count_q = count_q.where(ClinicalNote.status == status)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * per_page
    query = base.order_by(ClinicalNote.created_at.desc()).offset(offset).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_clinical_note(db: AsyncSession, note_id: uuid.UUID) -> ClinicalNote | None:
    """Einzelne klinische Notiz laden."""
    return (await db.execute(select(ClinicalNote).where(ClinicalNote.id == note_id))).scalar_one_or_none()


# ─── Create ────────────────────────────────────────────────────


async def create_clinical_note(
    db: AsyncSession,
    data: ClinicalNoteCreate,
    author_id: uuid.UUID | None = None,
) -> ClinicalNote:
    """Neue klinische Notiz erstellen."""
    note = ClinicalNote(
        patient_id=data.patient_id,
        encounter_id=data.encounter_id,
        note_type=data.note_type,
        title=data.title,
        content=data.content,
        summary=data.summary,
        author_id=author_id,
        is_confidential=data.is_confidential,
        tags=data.tags,
        status="draft",
    )
    db.add(note)
    await db.commit()
    await db.refresh(note)
    logger.info("ClinicalNote created: %s (type=%s, patient=%s)", note.id, note.note_type, note.patient_id)

    await emit_event(RoutingKeys.NOTE_CREATED, {
        "note_id": str(note.id),
        "patient_id": str(note.patient_id),
        "note_type": note.note_type,
        "title": note.title,
        "author_id": str(author_id) if author_id else None,
    })

    return note


# ─── Update ────────────────────────────────────────────────────


async def update_clinical_note(
    db: AsyncSession,
    note_id: uuid.UUID,
    data: ClinicalNoteUpdate,
) -> ClinicalNote | None:
    """Klinische Notiz aktualisieren (nur im Status 'draft' oder 'amended')."""
    note = await get_clinical_note(db, note_id)
    if not note:
        return None

    if note.status not in ("draft", "amended"):
        raise ValueError(f"Notiz im Status '{note.status}' kann nicht bearbeitet werden.")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(note, field, value)

    note.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(note)
    logger.info("ClinicalNote updated: %s", note.id)
    return note


# ─── Finalize ──────────────────────────────────────────────────


async def finalize_clinical_note(
    db: AsyncSession,
    note_id: uuid.UUID,
    summary: str | None = None,
) -> ClinicalNote | None:
    """Notiz finalisieren — Status von 'draft' auf 'final' setzen."""
    note = await get_clinical_note(db, note_id)
    if not note:
        return None

    if note.status != "draft":
        raise ValueError(f"Nur Entwürfe können finalisiert werden. Aktueller Status: '{note.status}'")

    note.status = "final"
    if summary:
        note.summary = summary
    note.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(note)
    logger.info("ClinicalNote finalized: %s", note.id)

    await emit_event(RoutingKeys.NOTE_FINALIZED, {
        "note_id": str(note.id),
        "patient_id": str(note.patient_id),
        "finalized_by": str(note.author_id),
    })

    return note


# ─── Co-Sign ──────────────────────────────────────────────────


async def co_sign_clinical_note(
    db: AsyncSession,
    note_id: uuid.UUID,
    co_signer_id: uuid.UUID,
) -> ClinicalNote | None:
    """Co-Signatur einer finalisierten Notiz."""
    note = await get_clinical_note(db, note_id)
    if not note:
        return None

    if note.status != "final":
        raise ValueError(f"Nur finalisierte Notizen können co-signiert werden. Status: '{note.status}'")

    if note.co_signed_by:
        raise ValueError("Notiz wurde bereits co-signiert.")

    note.co_signed_by = co_signer_id
    note.co_signed_at = datetime.now(UTC)
    note.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(note)
    logger.info("ClinicalNote co-signed: %s by %s", note.id, co_signer_id)

    await emit_event(RoutingKeys.NOTE_COSIGNED, {
        "note_id": str(note.id),
        "patient_id": str(note.patient_id),
        "co_signed_by": str(co_signer_id),
    })

    return note


# ─── Amend ─────────────────────────────────────────────────────


async def amend_clinical_note(
    db: AsyncSession,
    note_id: uuid.UUID,
) -> ClinicalNote | None:
    """Finalisierte Notiz in den Nachtragsmodus setzen."""
    note = await get_clinical_note(db, note_id)
    if not note:
        return None

    if note.status != "final":
        raise ValueError(f"Nur finalisierte Notizen können nachgetragen werden. Status: '{note.status}'")

    note.status = "amended"
    note.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(note)
    logger.info("ClinicalNote amended: %s", note.id)
    return note


# ─── Delete ────────────────────────────────────────────────────


async def delete_clinical_note(
    db: AsyncSession,
    note_id: uuid.UUID,
) -> bool:
    """Klinische Notiz löschen (nur Entwürfe). Finalisierte Notizen → entered_in_error."""
    note = await get_clinical_note(db, note_id)
    if not note:
        return False

    if note.status == "draft":
        await db.delete(note)
        await db.commit()
        logger.info("ClinicalNote deleted (draft): %s", note.id)
    else:
        note.status = "entered_in_error"
        note.updated_at = datetime.now(UTC)
        await db.commit()
        logger.info("ClinicalNote marked entered_in_error: %s", note.id)

    return True
