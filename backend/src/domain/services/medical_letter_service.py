"""Medical Letter service — CRUD for Arztbriefe."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.therapy import MedicalLetter
from src.domain.schemas.medical_letter import MedicalLetterCreate, MedicalLetterUpdate
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.medical_letter")


async def list_medical_letters(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    letter_type: str | None = None,
    status: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    base = select(MedicalLetter).where(MedicalLetter.patient_id == patient_id)
    count_q = select(func.count()).select_from(MedicalLetter).where(MedicalLetter.patient_id == patient_id)

    if letter_type:
        base = base.where(MedicalLetter.letter_type == letter_type)
        count_q = count_q.where(MedicalLetter.letter_type == letter_type)
    if status:
        base = base.where(MedicalLetter.status == status)
        count_q = count_q.where(MedicalLetter.status == status)

    total = (await db.execute(count_q)).scalar() or 0
    query = base.order_by(MedicalLetter.created_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_medical_letter(db: AsyncSession, letter_id: uuid.UUID) -> MedicalLetter | None:
    result = await db.execute(select(MedicalLetter).where(MedicalLetter.id == letter_id))
    return result.scalar_one_or_none()


async def create_medical_letter(
    db: AsyncSession,
    data: MedicalLetterCreate,
    author_id: uuid.UUID | None = None,
) -> MedicalLetter:
    letter = MedicalLetter(
        **data.model_dump(),
        author_id=author_id,
    )
    db.add(letter)
    await db.commit()
    await db.refresh(letter)
    logger.info("Arztbrief erstellt: %s (%s) — Patient %s", letter.id, data.letter_type, data.patient_id)

    await emit_event(RoutingKeys.LETTER_CREATED, {
        "letter_id": str(letter.id),
        "patient_id": str(letter.patient_id),
        "letter_type": letter.letter_type,
        "author_id": str(author_id) if author_id else None,
    })

    return letter


async def update_medical_letter(
    db: AsyncSession,
    letter_id: uuid.UUID,
    data: MedicalLetterUpdate,
) -> MedicalLetter | None:
    letter = await get_medical_letter(db, letter_id)
    if not letter:
        return None

    if letter.status not in ("draft", "amended"):
        raise ValueError(f"Brief im Status '{letter.status}' kann nicht bearbeitet werden.")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(letter, field, value)

    letter.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(letter)
    logger.info("Arztbrief aktualisiert: %s", letter.id)
    return letter


async def finalize_medical_letter(db: AsyncSession, letter_id: uuid.UUID) -> MedicalLetter | None:
    letter = await get_medical_letter(db, letter_id)
    if not letter:
        return None
    if letter.status != "draft":
        raise ValueError(f"Nur Entwürfe können finalisiert werden. Status: '{letter.status}'")
    letter.status = "final"
    letter.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(letter)
    logger.info("Arztbrief finalisiert: %s", letter.id)
    return letter


async def co_sign_medical_letter(
    db: AsyncSession,
    letter_id: uuid.UUID,
    co_signer_id: uuid.UUID,
) -> MedicalLetter | None:
    letter = await get_medical_letter(db, letter_id)
    if not letter:
        return None
    if letter.status != "final":
        raise ValueError("Nur finalisierte Briefe können co-signiert werden.")
    if letter.co_signed_by:
        raise ValueError("Brief wurde bereits co-signiert.")
    letter.co_signed_by = co_signer_id
    letter.co_signed_at = datetime.now(UTC)
    letter.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(letter)
    logger.info("Arztbrief co-signiert: %s von %s", letter.id, co_signer_id)
    return letter


async def send_medical_letter(
    db: AsyncSession,
    letter_id: uuid.UUID,
    send_via: str,
) -> MedicalLetter | None:
    letter = await get_medical_letter(db, letter_id)
    if not letter:
        return None
    if letter.status not in ("final",):
        raise ValueError("Nur finalisierte Briefe können versendet werden.")

    letter.status = "sent"
    letter.sent_at = datetime.now(UTC)
    letter.sent_via = send_via
    letter.updated_at = datetime.now(UTC)
    await db.commit()
    await db.refresh(letter)
    logger.info("Arztbrief versendet: %s via %s", letter.id, send_via)

    await emit_event(RoutingKeys.LETTER_SENT, {
        "letter_id": str(letter.id),
        "patient_id": str(letter.patient_id),
        "sent_via": send_via,
    })

    # TODO: HIN-Mail Integration für send_via == "hin_mail"
    return letter


async def delete_medical_letter(db: AsyncSession, letter_id: uuid.UUID) -> bool:
    letter = await get_medical_letter(db, letter_id)
    if not letter:
        return False
    if letter.status == "draft":
        await db.delete(letter)
        await db.commit()
        logger.info("Arztbrief gelöscht (Entwurf): %s", letter_id)
    else:
        raise ValueError(f"Nur Entwürfe können gelöscht werden. Status: '{letter.status}'")
    return True
