"""Dossier service — Aggregiert alle klinischen Daten eines Patienten für die Übersicht."""

import logging
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.clinical import (
    Alarm,
    ClinicalNote,
    Encounter,
    Medication,
    NursingEntry,
    VitalSign,
)
from src.domain.models.therapy import (
    Consultation,
    MedicalLetter,
    NursingDiagnosis,
    NutritionOrder,
    ShiftHandover,
    TreatmentPlan,
)

logger = logging.getLogger("pdms.dossier")


async def get_patient_dossier(db: AsyncSession, patient_id: uuid.UUID) -> dict:
    """Aggregierte Übersicht aller Patientendaten (Dossier-Tab).

    Gibt Zähler und die jeweils letzten Einträge pro Modul zurück.
    """
    # Aktive Encounters
    active_encounter = (await db.execute(
        select(Encounter)
        .where(Encounter.patient_id == patient_id, Encounter.status == "active")
        .order_by(Encounter.admitted_at.desc()).limit(1)
    )).scalar_one_or_none()

    # Aktive Alarme
    active_alarms_count = (await db.execute(
        select(func.count()).select_from(Alarm)
        .where(Alarm.patient_id == patient_id, Alarm.status == "active")
    )).scalar() or 0

    # Letzte Vitalzeichen
    latest_vitals = (await db.execute(
        select(VitalSign)
        .where(VitalSign.patient_id == patient_id)
        .order_by(VitalSign.recorded_at.desc()).limit(1)
    )).scalar_one_or_none()

    # Aktive Medikamente
    active_meds_count = (await db.execute(
        select(func.count()).select_from(Medication)
        .where(Medication.patient_id == patient_id, Medication.status == "active")
    )).scalar() or 0

    # Aktive Therapiepläne
    active_plans_count = (await db.execute(
        select(func.count()).select_from(TreatmentPlan)
        .where(TreatmentPlan.patient_id == patient_id, TreatmentPlan.status == "active")
    )).scalar() or 0

    # Offene Konsilien
    open_consultations_count = (await db.execute(
        select(func.count()).select_from(Consultation)
        .where(Consultation.patient_id == patient_id, Consultation.status.in_(["requested", "accepted"]))
    )).scalar() or 0

    # Arztbriefe (Entwürfe)
    draft_letters_count = (await db.execute(
        select(func.count()).select_from(MedicalLetter)
        .where(MedicalLetter.patient_id == patient_id, MedicalLetter.status == "draft")
    )).scalar() or 0

    # Aktive Pflegediagnosen
    active_diagnoses_count = (await db.execute(
        select(func.count()).select_from(NursingDiagnosis)
        .where(NursingDiagnosis.patient_id == patient_id, NursingDiagnosis.status == "active")
    )).scalar() or 0

    # Letzte Schichtübergabe
    latest_handover = (await db.execute(
        select(ShiftHandover)
        .where(ShiftHandover.patient_id == patient_id)
        .order_by(ShiftHandover.created_at.desc()).limit(1)
    )).scalar_one_or_none()

    # Aktive Ernährungsverordnung
    active_nutrition = (await db.execute(
        select(NutritionOrder)
        .where(NutritionOrder.patient_id == patient_id, NutritionOrder.status == "active")
        .order_by(NutritionOrder.created_at.desc()).limit(1)
    )).scalar_one_or_none()

    # Letzte klinische Notizen (Top 3)
    recent_notes = (await db.execute(
        select(ClinicalNote)
        .where(ClinicalNote.patient_id == patient_id)
        .order_by(ClinicalNote.created_at.desc()).limit(3)
    )).scalars().all()

    # Letzte Pflegeeinträge (Top 3)
    recent_nursing = (await db.execute(
        select(NursingEntry)
        .where(NursingEntry.patient_id == patient_id)
        .order_by(NursingEntry.recorded_at.desc()).limit(3)
    )).scalars().all()

    return {
        "patient_id": str(patient_id),
        "encounter": {
            "id": str(active_encounter.id) if active_encounter else None,
            "status": active_encounter.status if active_encounter else None,
            "type": active_encounter.encounter_type if active_encounter else None,
            "admitted_at": active_encounter.admitted_at.isoformat() if active_encounter else None,
        },
        "summary": {
            "active_alarms": active_alarms_count,
            "active_medications": active_meds_count,
            "active_treatment_plans": active_plans_count,
            "open_consultations": open_consultations_count,
            "draft_letters": draft_letters_count,
            "active_nursing_diagnoses": active_diagnoses_count,
        },
        "latest_vitals": {
            "recorded_at": latest_vitals.recorded_at.isoformat() if latest_vitals else None,
            "heart_rate": latest_vitals.heart_rate if latest_vitals else None,
            "systolic_bp": latest_vitals.systolic_bp if latest_vitals else None,
            "diastolic_bp": latest_vitals.diastolic_bp if latest_vitals else None,
            "spo2": latest_vitals.spo2 if latest_vitals else None,
            "temperature": latest_vitals.temperature if latest_vitals else None,
        } if latest_vitals else None,
        "latest_handover": {
            "id": str(latest_handover.id),
            "shift_type": latest_handover.shift_type,
            "handover_date": str(latest_handover.handover_date),
            "situation": latest_handover.situation[:200],
            "acknowledged": latest_handover.acknowledged_at is not None,
        } if latest_handover else None,
        "active_nutrition": {
            "diet_type": active_nutrition.diet_type,
            "caloric_target": active_nutrition.caloric_target,
            "fluid_target": active_nutrition.fluid_target,
        } if active_nutrition else None,
        "recent_notes": [
            {"id": str(n.id), "title": n.title, "note_type": n.note_type, "status": n.status, "created_at": n.created_at.isoformat()}
            for n in recent_notes
        ],
        "recent_nursing": [
            {"id": str(n.id), "title": n.title, "category": n.category, "priority": n.priority, "recorded_at": n.recorded_at.isoformat()}
            for n in recent_nursing
        ],
    }
