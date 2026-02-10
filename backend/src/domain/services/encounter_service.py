"""Encounter service — CRUD, admission, discharge, transfer."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.clinical import Encounter
from src.domain.schemas.encounter import (
    EncounterCreate,
    EncounterUpdate,
)
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.encounters")


# ─── List / Read ───────────────────────────────────────────────


async def list_encounters(
    db: AsyncSession,
    patient_id: uuid.UUID,
    *,
    status: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> dict:
    """Paginierte Liste aller Encounters eines Patienten."""
    base = select(Encounter).where(Encounter.patient_id == patient_id)
    count_q = select(func.count()).select_from(Encounter).where(Encounter.patient_id == patient_id)

    if status:
        base = base.where(Encounter.status == status)
        count_q = count_q.where(Encounter.status == status)

    total = (await db.execute(count_q)).scalar() or 0
    offset = (page - 1) * per_page
    query = base.order_by(Encounter.admitted_at.desc()).offset(offset).limit(per_page)
    rows = (await db.execute(query)).scalars().all()

    return {"items": rows, "total": total, "page": page, "per_page": per_page}


async def get_encounter(db: AsyncSession, encounter_id: uuid.UUID) -> Encounter | None:
    """Einzelnen Encounter laden."""
    return (await db.execute(select(Encounter).where(Encounter.id == encounter_id))).scalar_one_or_none()


async def get_active_encounter(db: AsyncSession, patient_id: uuid.UUID) -> Encounter | None:
    """Aktiven Encounter eines Patienten laden (es sollte maximal einen geben)."""
    return (
        await db.execute(
            select(Encounter)
            .where(Encounter.patient_id == patient_id, Encounter.status == "active")
            .order_by(Encounter.admitted_at.desc())
            .limit(1)
        )
    ).scalar_one_or_none()


# ─── Admission (Aufnahme) ─────────────────────────────────────


async def admit_patient(
    db: AsyncSession,
    data: EncounterCreate,
) -> Encounter:
    """Patienten aufnehmen — neuen aktiven Encounter erstellen.

    Prüft, ob bereits ein aktiver Encounter existiert.
    """
    existing = await get_active_encounter(db, data.patient_id)
    if existing:
        raise ValueError(
            f"Patient hat bereits einen aktiven Encounter ({existing.id}). "
            "Bitte zuerst entlassen oder abbrechen."
        )

    encounter = Encounter(
        patient_id=data.patient_id,
        encounter_type=data.encounter_type,
        ward=data.ward,
        bed=data.bed,
        reason=data.reason,
        attending_physician_id=data.attending_physician_id,
        status="active",
    )
    db.add(encounter)
    await db.commit()
    await db.refresh(encounter)
    logger.info(
        "Patient admitted: encounter=%s, patient=%s, type=%s, ward=%s",
        encounter.id, encounter.patient_id, encounter.encounter_type, encounter.ward,
    )

    await emit_event(RoutingKeys.ENCOUNTER_ADMITTED, {
        "encounter_id": str(encounter.id),
        "patient_id": str(encounter.patient_id),
        "encounter_type": encounter.encounter_type,
        "ward": encounter.ward,
        "bed": encounter.bed,
    })

    return encounter


# ─── Update ────────────────────────────────────────────────────


async def update_encounter(
    db: AsyncSession,
    encounter_id: uuid.UUID,
    data: EncounterUpdate,
) -> Encounter | None:
    """Encounter-Daten aktualisieren (nur aktive Encounters)."""
    encounter = await get_encounter(db, encounter_id)
    if not encounter:
        return None

    if encounter.status != "active":
        raise ValueError(f"Nur aktive Encounters können bearbeitet werden. Status: '{encounter.status}'")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(encounter, field, value)

    await db.commit()
    await db.refresh(encounter)
    logger.info("Encounter updated: %s", encounter.id)
    return encounter


# ─── Discharge (Entlassung) ───────────────────────────────────


async def discharge_patient(
    db: AsyncSession,
    encounter_id: uuid.UUID,
    discharge_reason: str | None = None,
) -> Encounter | None:
    """Patienten entlassen — Encounter abschliessen."""
    encounter = await get_encounter(db, encounter_id)
    if not encounter:
        return None

    if encounter.status != "active":
        raise ValueError(f"Nur aktive Encounters können entlassen werden. Status: '{encounter.status}'")

    encounter.status = "finished"
    encounter.discharged_at = datetime.now(UTC)
    if discharge_reason:
        encounter.reason = (encounter.reason or "") + f"\n\nEntlassgrund: {discharge_reason}"

    await db.commit()
    await db.refresh(encounter)
    logger.info("Patient discharged: encounter=%s, patient=%s", encounter.id, encounter.patient_id)

    await emit_event(RoutingKeys.ENCOUNTER_DISCHARGED, {
        "encounter_id": str(encounter.id),
        "patient_id": str(encounter.patient_id),
    })

    return encounter


# ─── Transfer (Verlegung) ─────────────────────────────────────


async def transfer_patient(
    db: AsyncSession,
    encounter_id: uuid.UUID,
    ward: str,
    bed: str | None = None,
) -> Encounter | None:
    """Station/Bett wechseln (Verlegung)."""
    encounter = await get_encounter(db, encounter_id)
    if not encounter:
        return None

    if encounter.status != "active":
        raise ValueError(f"Nur aktive Encounters können verlegt werden. Status: '{encounter.status}'")

    old_ward = encounter.ward
    encounter.ward = ward
    encounter.bed = bed

    await db.commit()
    await db.refresh(encounter)
    logger.info(
        "Patient transferred: encounter=%s, %s → %s (bed=%s)",
        encounter.id, old_ward, ward, bed,
    )

    await emit_event(RoutingKeys.ENCOUNTER_TRANSFERRED, {
        "encounter_id": str(encounter.id),
        "patient_id": str(encounter.patient_id),
        "from_ward": old_ward,
        "ward": ward,
        "bed": bed,
    })

    return encounter


# ─── Cancel ────────────────────────────────────────────────────


async def cancel_encounter(
    db: AsyncSession,
    encounter_id: uuid.UUID,
) -> Encounter | None:
    """Encounter abbrechen (z.B. bei Fehlaufnahme)."""
    encounter = await get_encounter(db, encounter_id)
    if not encounter:
        return None

    if encounter.status not in ("active", "planned"):
        raise ValueError(f"Encounter kann nicht abgebrochen werden. Status: '{encounter.status}'")

    encounter.status = "cancelled"
    encounter.discharged_at = datetime.now(UTC)

    await db.commit()
    await db.refresh(encounter)
    logger.info("Encounter cancelled: %s", encounter.id)

    await emit_event(RoutingKeys.ENCOUNTER_CANCELLED, {
        "encounter_id": str(encounter.id),
        "patient_id": str(encounter.patient_id),
    })

    return encounter
