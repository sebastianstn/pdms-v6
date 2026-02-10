"""Consent & Legal services — CRUD for Consent, AdvanceDirective, PatientWishes, PalliativeCare, DeathNotification."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.legal import (
    AdvanceDirective,
    Consent,
    DeathNotification,
    PalliativeCare,
    PatientWishes,
)
from src.domain.schemas.legal import (
    ConsentCreate,
    ConsentUpdate,
    DeathNotificationCreate,
    DeathNotificationUpdate,
    DirectiveCreate,
    DirectiveUpdate,
    PalliativeUpsert,
    WishesUpsert,
)
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.legal")


# ════════════════════════════════════════════════════════════════
# Consent
# ════════════════════════════════════════════════════════════════


async def list_consents(db: AsyncSession, patient_id: uuid.UUID) -> list[Consent]:
    rows = (await db.execute(
        select(Consent).where(Consent.patient_id == patient_id).order_by(Consent.created_at.desc())
    )).scalars().all()
    return list(rows)


async def get_consent(db: AsyncSession, consent_id: uuid.UUID) -> Consent | None:
    return (await db.execute(select(Consent).where(Consent.id == consent_id))).scalar_one_or_none()


async def create_consent(db: AsyncSession, data: ConsentCreate) -> Consent:
    consent = Consent(**data.model_dump())
    db.add(consent)
    await db.commit()
    await db.refresh(consent)
    logger.info("Consent created: %s type=%s patient=%s", consent.id, consent.consent_type, consent.patient_id)
    if consent.status == "granted":
        await emit_event(RoutingKeys.CONSENT_GRANTED, {
            "consent_id": str(consent.id),
            "patient_id": str(consent.patient_id),
            "consent_type": consent.consent_type,
        })
    return consent


async def update_consent(db: AsyncSession, consent_id: uuid.UUID, data: ConsentUpdate) -> Consent | None:
    consent = await get_consent(db, consent_id)
    if not consent:
        return None
    old_status = consent.status
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(consent, field, value)
    await db.commit()
    await db.refresh(consent)
    # Emit events on status changes
    if consent.status == "granted" and old_status != "granted":
        await emit_event(RoutingKeys.CONSENT_GRANTED, {
            "consent_id": str(consent.id), "patient_id": str(consent.patient_id), "consent_type": consent.consent_type,
        })
    elif consent.status == "revoked" and old_status != "revoked":
        await emit_event(RoutingKeys.CONSENT_REVOKED, {
            "consent_id": str(consent.id), "patient_id": str(consent.patient_id), "consent_type": consent.consent_type,
        })
    return consent


async def revoke_consent(db: AsyncSession, consent_id: uuid.UUID, reason: str | None = None) -> Consent | None:
    consent = await get_consent(db, consent_id)
    if not consent:
        return None
    consent.status = "revoked"
    consent.revoked_at = datetime.now(UTC)
    consent.revoked_reason = reason
    await db.commit()
    await db.refresh(consent)
    await emit_event(RoutingKeys.CONSENT_REVOKED, {
        "consent_id": str(consent.id), "patient_id": str(consent.patient_id), "consent_type": consent.consent_type,
    })
    return consent


async def delete_consent(db: AsyncSession, consent_id: uuid.UUID) -> bool:
    consent = await get_consent(db, consent_id)
    if not consent:
        return False
    await db.delete(consent)
    await db.commit()
    return True


# ════════════════════════════════════════════════════════════════
# AdvanceDirective
# ════════════════════════════════════════════════════════════════


async def list_directives(db: AsyncSession, patient_id: uuid.UUID) -> list[AdvanceDirective]:
    rows = (await db.execute(
        select(AdvanceDirective).where(AdvanceDirective.patient_id == patient_id).order_by(AdvanceDirective.created_at.desc())
    )).scalars().all()
    return list(rows)


async def get_directive(db: AsyncSession, directive_id: uuid.UUID) -> AdvanceDirective | None:
    return (await db.execute(select(AdvanceDirective).where(AdvanceDirective.id == directive_id))).scalar_one_or_none()


async def create_directive(db: AsyncSession, data: DirectiveCreate) -> AdvanceDirective:
    directive = AdvanceDirective(**data.model_dump())
    db.add(directive)
    await db.commit()
    await db.refresh(directive)
    logger.info("Directive created: %s type=%s rea=%s", directive.id, directive.directive_type, directive.rea_status)
    return directive


async def update_directive(db: AsyncSession, directive_id: uuid.UUID, data: DirectiveUpdate) -> AdvanceDirective | None:
    directive = await get_directive(db, directive_id)
    if not directive:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(directive, field, value)
    await db.commit()
    await db.refresh(directive)
    return directive


async def delete_directive(db: AsyncSession, directive_id: uuid.UUID) -> bool:
    directive = await get_directive(db, directive_id)
    if not directive:
        return False
    await db.delete(directive)
    await db.commit()
    return True


# ════════════════════════════════════════════════════════════════
# PatientWishes
# ════════════════════════════════════════════════════════════════


async def get_wishes(db: AsyncSession, patient_id: uuid.UUID) -> PatientWishes | None:
    return (await db.execute(select(PatientWishes).where(PatientWishes.patient_id == patient_id))).scalar_one_or_none()


async def upsert_wishes(db: AsyncSession, patient_id: uuid.UUID, data: WishesUpsert, recorded_by: uuid.UUID | None = None) -> PatientWishes:
    wishes = await get_wishes(db, patient_id)
    if wishes is None:
        wishes = PatientWishes(patient_id=patient_id, recorded_by=recorded_by)
        db.add(wishes)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(wishes, field, value)
    await db.commit()
    await db.refresh(wishes)
    logger.info("Patient wishes updated: patient=%s", patient_id)
    return wishes


# ════════════════════════════════════════════════════════════════
# PalliativeCare
# ════════════════════════════════════════════════════════════════


async def get_palliative(db: AsyncSession, patient_id: uuid.UUID) -> PalliativeCare | None:
    return (await db.execute(select(PalliativeCare).where(PalliativeCare.patient_id == patient_id))).scalar_one_or_none()


async def upsert_palliative(
    db: AsyncSession,
    patient_id: uuid.UUID,
    data: PalliativeUpsert,
    user_id: uuid.UUID | None = None,
) -> PalliativeCare:
    palliative = await get_palliative(db, patient_id)
    if palliative is None:
        palliative = PalliativeCare(patient_id=patient_id)
        db.add(palliative)

    was_active = palliative.is_active if palliative.id else False
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(palliative, field, value)

    # Track activation
    if palliative.is_active and not was_active:
        palliative.activated_at = datetime.now(UTC)
        palliative.activated_by = user_id

    await db.commit()
    await db.refresh(palliative)
    logger.info("Palliative care updated: patient=%s active=%s", patient_id, palliative.is_active)
    return palliative


# ════════════════════════════════════════════════════════════════
# DeathNotification
# ════════════════════════════════════════════════════════════════


async def list_death_notifications(db: AsyncSession, patient_id: uuid.UUID) -> list[DeathNotification]:
    rows = (await db.execute(
        select(DeathNotification)
        .where(DeathNotification.patient_id == patient_id)
        .order_by(DeathNotification.priority, DeathNotification.created_at)
    )).scalars().all()
    return list(rows)


async def create_death_notification(db: AsyncSession, data: DeathNotificationCreate) -> DeathNotification:
    notif = DeathNotification(**data.model_dump())
    db.add(notif)
    await db.commit()
    await db.refresh(notif)
    return notif


async def update_death_notification(db: AsyncSession, notif_id: uuid.UUID, data: DeathNotificationUpdate) -> DeathNotification | None:
    notif = (await db.execute(select(DeathNotification).where(DeathNotification.id == notif_id))).scalar_one_or_none()
    if not notif:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(notif, field, value)
    await db.commit()
    await db.refresh(notif)
    return notif


async def delete_death_notification(db: AsyncSession, notif_id: uuid.UUID) -> bool:
    notif = (await db.execute(select(DeathNotification).where(DeathNotification.id == notif_id))).scalar_one_or_none()
    if not notif:
        return False
    await db.delete(notif)
    await db.commit()
    return True
