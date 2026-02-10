"""Nursing service — CRUD for nursing entries and assessments."""

import logging
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.events.routing_keys import RoutingKeys
from src.domain.models.clinical import NursingAssessment, NursingEntry
from src.domain.schemas.nursing import (
    NursingAssessmentCreate,
    NursingEntryCreate,
    NursingEntryUpdate,
)
from src.infrastructure.rabbitmq import emit_event

logger = logging.getLogger("pdms.nursing")


# ─── Assessment-Definitionen (Barthel, Norton, Braden) ─────────

ASSESSMENT_DEFINITIONS: dict[str, dict] = {
    "barthel": {
        "name": "Barthel-Index",
        "max_score": 100,
        "items": {
            "essen": {"label": "Essen", "options": [0, 5, 10]},
            "transfer": {"label": "Transfer (Bett/Stuhl)", "options": [0, 5, 10, 15]},
            "koerperpflege": {"label": "Körperpflege", "options": [0, 5]},
            "toilette": {"label": "Toilettenbenutzung", "options": [0, 5, 10]},
            "baden": {"label": "Baden/Duschen", "options": [0, 5]},
            "gehen": {"label": "Gehen auf Ebene", "options": [0, 5, 10, 15]},
            "treppen": {"label": "Treppen steigen", "options": [0, 5, 10]},
            "anziehen": {"label": "An-/Auskleiden", "options": [0, 5, 10]},
            "stuhlkontrolle": {"label": "Stuhlkontrolle", "options": [0, 5, 10]},
            "harnkontrolle": {"label": "Harnkontrolle", "options": [0, 5, 10]},
        },
        "risk_levels": [
            {"max": 30, "level": "very_high", "label": "Weitgehend pflegeabhängig"},
            {"max": 60, "level": "high", "label": "Hilfsbedürftig"},
            {"max": 80, "level": "medium", "label": "Punktuell hilfsbedürftig"},
            {"max": 100, "level": "low", "label": "Weitgehend selbstständig"},
        ],
    },
    "norton": {
        "name": "Norton-Skala",
        "max_score": 20,
        "items": {
            "koerperlicher_zustand": {"label": "Körperlicher Zustand", "options": [1, 2, 3, 4]},
            "geistiger_zustand": {"label": "Geistiger Zustand", "options": [1, 2, 3, 4]},
            "aktivitaet": {"label": "Aktivität", "options": [1, 2, 3, 4]},
            "beweglichkeit": {"label": "Beweglichkeit", "options": [1, 2, 3, 4]},
            "inkontinenz": {"label": "Inkontinenz", "options": [1, 2, 3, 4]},
        },
        "risk_levels": [
            {"max": 9, "level": "very_high", "label": "Sehr hohes Dekubitusrisiko"},
            {"max": 14, "level": "high", "label": "Hohes Dekubitusrisiko"},
            {"max": 18, "level": "medium", "label": "Gefährdet"},
            {"max": 20, "level": "low", "label": "Kein erhöhtes Risiko"},
        ],
    },
    "braden": {
        "name": "Braden-Skala",
        "max_score": 23,
        "items": {
            "sensorisches_empfinden": {"label": "Sensorisches Empfindungsvermögen", "options": [1, 2, 3, 4]},
            "feuchtigkeit": {"label": "Feuchtigkeit", "options": [1, 2, 3, 4]},
            "aktivitaet": {"label": "Aktivität", "options": [1, 2, 3, 4]},
            "mobilitaet": {"label": "Mobilität", "options": [1, 2, 3, 4]},
            "ernaehrung": {"label": "Ernährung", "options": [1, 2, 3, 4]},
            "reibung_scherkraefte": {"label": "Reibung / Scherkräfte", "options": [1, 2, 3]},
        },
        "risk_levels": [
            {"max": 9, "level": "very_high", "label": "Sehr hohes Dekubitusrisiko"},
            {"max": 12, "level": "high", "label": "Hohes Risiko"},
            {"max": 14, "level": "medium", "label": "Mittleres Risiko"},
            {"max": 23, "level": "low", "label": "Geringes Risiko"},
        ],
    },
    "fall_risk": {
        "name": "Sturzrisiko (Morse)",
        "max_score": 125,
        "items": {
            "sturzanamnese": {"label": "Sturz in Anamnese", "options": [0, 25]},
            "nebendiagnose": {"label": "Nebendiagnose", "options": [0, 15]},
            "gehhilfe": {"label": "Gehhilfe", "options": [0, 15, 30]},
            "iv_zugang": {"label": "i.v.-Zugang / Heparin-Lock", "options": [0, 20]},
            "gangbild": {"label": "Gangbild", "options": [0, 10, 20]},
            "orientierung": {"label": "Orientierung / Selbsteinschätzung", "options": [0, 15]},
        },
        "risk_levels": [
            {"max": 24, "level": "low", "label": "Geringes Sturzrisiko"},
            {"max": 50, "level": "medium", "label": "Mittleres Sturzrisiko"},
            {"max": 125, "level": "high", "label": "Hohes Sturzrisiko"},
        ],
    },
}


def compute_risk_level(assessment_type: str, total_score: int) -> str | None:
    """Risikostufe anhand des Scores berechnen."""
    definition = ASSESSMENT_DEFINITIONS.get(assessment_type)
    if not definition:
        return None
    for band in definition["risk_levels"]:
        if total_score <= band["max"]:
            return band["level"]
    return None


# ─── NursingEntry CRUD ────────────────────────────────────────

async def create_nursing_entry(
    session: AsyncSession,
    data: NursingEntryCreate,
    recorded_by: uuid.UUID,
) -> NursingEntry:
    """Neuen Pflegeeintrag erstellen."""
    entry = NursingEntry(**data.model_dump(), recorded_by=recorded_by)
    session.add(entry)
    await session.flush()
    logger.info(f"📝 Pflegeeintrag: [{data.category}] {data.title} — Patient {data.patient_id}")

    await emit_event(RoutingKeys.NURSING_ENTRY_CREATED, {
        "entry_id": str(entry.id),
        "patient_id": str(data.patient_id),
        "category": data.category,
        "title": data.title,
        "recorded_by": str(recorded_by),
    })

    return entry


async def get_nursing_entry(session: AsyncSession, entry_id: uuid.UUID) -> NursingEntry | None:
    """Einzelnen Pflegeeintrag abrufen."""
    result = await session.execute(
        select(NursingEntry).where(NursingEntry.id == entry_id)
    )
    return result.scalar_one_or_none()


async def list_nursing_entries(
    session: AsyncSession,
    patient_id: uuid.UUID,
    *,
    category: str | None = None,
    handover_only: bool = False,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[NursingEntry], int]:
    """Pflegeeinträge eines Patienten auflisten."""
    query = select(NursingEntry).where(NursingEntry.patient_id == patient_id)
    count_query = select(func.count(NursingEntry.id)).where(NursingEntry.patient_id == patient_id)

    if category:
        query = query.where(NursingEntry.category == category)
        count_query = count_query.where(NursingEntry.category == category)
    if handover_only:
        query = query.where(NursingEntry.is_handover.is_(True))
        count_query = count_query.where(NursingEntry.is_handover.is_(True))

    total = (await session.execute(count_query)).scalar() or 0
    query = query.order_by(NursingEntry.recorded_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await session.execute(query)).scalars().all()
    return list(rows), total


async def update_nursing_entry(
    session: AsyncSession,
    entry_id: uuid.UUID,
    data: NursingEntryUpdate,
) -> NursingEntry | None:
    """Pflegeeintrag aktualisieren."""
    entry = await get_nursing_entry(session, entry_id)
    if entry is None:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    entry.updated_at = datetime.now(UTC)
    await session.flush()
    return entry


async def delete_nursing_entry(session: AsyncSession, entry_id: uuid.UUID) -> bool:
    """Pflegeeintrag löschen."""
    entry = await get_nursing_entry(session, entry_id)
    if entry is None:
        return False
    await session.delete(entry)
    await session.flush()
    return True


# ─── NursingAssessment CRUD ───────────────────────────────────

async def create_assessment(
    session: AsyncSession,
    data: NursingAssessmentCreate,
    assessed_by: uuid.UUID,
) -> NursingAssessment:
    """Neues Pflege-Assessment erfassen."""
    risk_level = data.risk_level or compute_risk_level(data.assessment_type, data.total_score)
    max_score = data.max_score
    definition = ASSESSMENT_DEFINITIONS.get(data.assessment_type)
    if definition and max_score is None:
        max_score = definition["max_score"]

    assessment = NursingAssessment(
        **data.model_dump(exclude={"risk_level", "max_score"}),
        risk_level=risk_level,
        max_score=max_score,
        assessed_by=assessed_by,
    )
    session.add(assessment)
    await session.flush()
    logger.info(
        f"📊 Assessment: {data.assessment_type} Score={data.total_score} "
        f"Risk={risk_level} — Patient {data.patient_id}"
    )

    await emit_event(RoutingKeys.NURSING_ASSESSMENT_CREATED, {
        "assessment_id": str(assessment.id),
        "patient_id": str(data.patient_id),
        "assessment_tool": data.assessment_type,
        "total_score": data.total_score,
        "max_score": max_score,
        "risk_level": risk_level,
        "assessed_by": str(assessed_by),
    })

    return assessment


async def get_assessment(session: AsyncSession, assessment_id: uuid.UUID) -> NursingAssessment | None:
    """Einzelnes Assessment abrufen."""
    result = await session.execute(
        select(NursingAssessment).where(NursingAssessment.id == assessment_id)
    )
    return result.scalar_one_or_none()


async def list_assessments(
    session: AsyncSession,
    patient_id: uuid.UUID,
    *,
    assessment_type: str | None = None,
    page: int = 1,
    per_page: int = 50,
) -> tuple[list[NursingAssessment], int]:
    """Assessments eines Patienten auflisten."""
    query = select(NursingAssessment).where(NursingAssessment.patient_id == patient_id)
    count_query = select(func.count(NursingAssessment.id)).where(NursingAssessment.patient_id == patient_id)

    if assessment_type:
        query = query.where(NursingAssessment.assessment_type == assessment_type)
        count_query = count_query.where(NursingAssessment.assessment_type == assessment_type)

    total = (await session.execute(count_query)).scalar() or 0
    query = query.order_by(NursingAssessment.assessed_at.desc()).offset((page - 1) * per_page).limit(per_page)
    rows = (await session.execute(query)).scalars().all()
    return list(rows), total


async def get_latest_assessments(
    session: AsyncSession,
    patient_id: uuid.UUID,
) -> dict[str, NursingAssessment]:
    """Jeweils letztes Assessment pro Typ für einen Patienten."""
    result: dict[str, NursingAssessment] = {}
    for atype in ASSESSMENT_DEFINITIONS:
        row = await session.execute(
            select(NursingAssessment)
            .where(NursingAssessment.patient_id == patient_id, NursingAssessment.assessment_type == atype)
            .order_by(NursingAssessment.assessed_at.desc())
            .limit(1)
        )
        assessment = row.scalar_one_or_none()
        if assessment:
            result[atype] = assessment
    return result


def get_assessment_definitions() -> dict:
    """Assessment-Definitionen für das Frontend zurückgeben."""
    return ASSESSMENT_DEFINITIONS
