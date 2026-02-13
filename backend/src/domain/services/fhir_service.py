"""FHIR R4 Service — Mapping zwischen PDMS-Modellen und FHIR-Ressourcen.

Implementiert CH Core Profile Mappings für:
- Patient (CH Core Patient)
- Observation (Vitaldaten, Laborwerte)
- Encounter (Aufenthalte)
- MedicationRequest (Verordnungen)
"""

import logging
import uuid
from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.domain.models.clinical import Encounter, Medication, VitalSign
from src.domain.models.patient import Patient

logger = logging.getLogger("pdms.fhir")

# LOINC-Codes für Vitalzeichen
VITAL_LOINC_MAP: dict[str, dict[str, str]] = {
    "heart_rate": {"code": "8867-4", "display": "Heart rate", "unit": "/min"},
    "systolic_bp": {"code": "8480-6", "display": "Systolic blood pressure", "unit": "mmHg"},
    "diastolic_bp": {"code": "8462-4", "display": "Diastolic blood pressure", "unit": "mmHg"},
    "spo2": {"code": "2708-6", "display": "Oxygen saturation", "unit": "%"},
    "temperature": {"code": "8310-5", "display": "Body temperature", "unit": "Cel"},
    "respiratory_rate": {"code": "9279-1", "display": "Respiratory rate", "unit": "/min"},
    "gcs": {"code": "9269-2", "display": "Glasgow coma score total", "unit": "{score}"},
    "pain_score": {"code": "72514-3", "display": "Pain severity", "unit": "{score}"},
}


def patient_to_fhir(patient: Patient) -> dict[str, Any]:
    """PDMS-Patient → FHIR R4 Patient Resource (CH Core Profile)."""
    resource: dict[str, Any] = {
        "resourceType": "Patient",
        "id": str(patient.id),
        "meta": {
            "profile": ["http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-patient"],
        },
        "identifier": [],
        "name": [
            {
                "use": "official",
                "family": patient.last_name,
                "given": [patient.first_name],
            }
        ],
        "gender": _map_gender(getattr(patient, "gender", None)),
        "birthDate": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
    }

    # AHV-Nummer als Identifier
    ahv = getattr(patient, "ahv_number", None)
    if ahv:
        resource["identifier"].append({
            "system": "urn:oid:2.16.756.5.32",
            "value": ahv,
        })

    # Adresse
    address_parts = []
    for field in ("street", "city", "postal_code"):
        val = getattr(patient, field, None)
        if val:
            address_parts.append(val)
    if address_parts:
        addr: dict[str, Any] = {"use": "home"}
        if hasattr(patient, "street") and patient.street:
            addr["line"] = [patient.street]
        if hasattr(patient, "postal_code") and patient.postal_code:
            addr["postalCode"] = patient.postal_code
        if hasattr(patient, "city") and patient.city:
            addr["city"] = patient.city
        addr["country"] = "CH"
        resource["address"] = [addr]

    # Telefon / E-Mail
    telecoms = []
    phone = getattr(patient, "phone", None)
    if phone:
        telecoms.append({"system": "phone", "value": phone, "use": "mobile"})
    email = getattr(patient, "email", None)
    if email:
        telecoms.append({"system": "email", "value": email})
    if telecoms:
        resource["telecom"] = telecoms

    return resource


def vital_sign_to_fhir(vs: VitalSign) -> list[dict[str, Any]]:
    """PDMS-VitalSign → Liste von FHIR Observation Resources."""
    observations = []
    for param, loinc in VITAL_LOINC_MAP.items():
        value = getattr(vs, param, None)
        if value is not None:
            obs: dict[str, Any] = {
                "resourceType": "Observation",
                "id": f"{vs.id}-{param}",
                "meta": {
                    "profile": ["http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-observation-vitalsigns"],
                },
                "status": "final",
                "category": [
                    {
                        "coding": [
                            {
                                "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                                "code": "vital-signs",
                                "display": "Vital Signs",
                            }
                        ]
                    }
                ],
                "code": {
                    "coding": [
                        {
                            "system": "http://loinc.org",
                            "code": loinc["code"],
                            "display": loinc["display"],
                        }
                    ]
                },
                "subject": {"reference": f"Patient/{vs.patient_id}"},
                "effectiveDateTime": vs.recorded_at.isoformat(),
                "valueQuantity": {
                    "value": value,
                    "unit": loinc["unit"],
                    "system": "http://unitsofmeasure.org",
                    "code": loinc["unit"],
                },
            }
            if vs.encounter_id:
                obs["encounter"] = {"reference": f"Encounter/{vs.encounter_id}"}
            observations.append(obs)
    return observations


def encounter_to_fhir(enc: Encounter) -> dict[str, Any]:
    """PDMS-Encounter → FHIR Encounter Resource."""
    resource: dict[str, Any] = {
        "resourceType": "Encounter",
        "id": str(enc.id),
        "meta": {
            "profile": ["http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-encounter"],
        },
        "status": _map_encounter_status(enc.status),
        "class": {
            "system": "http://terminology.hl7.org/CodeSystem/v3-ActCode",
            "code": "HH",
            "display": "home health",
        },
        "subject": {"reference": f"Patient/{enc.patient_id}"},
        "period": {
            "start": enc.admitted_at.isoformat() if enc.admitted_at else None,
        },
    }
    if enc.discharged_at:
        resource["period"]["end"] = enc.discharged_at.isoformat()
    if enc.reason:
        resource["reasonCode"] = [{"text": enc.reason}]
    return resource


def medication_to_fhir(med: Medication) -> dict[str, Any]:
    """PDMS-Medication → FHIR MedicationRequest Resource."""
    resource: dict[str, Any] = {
        "resourceType": "MedicationRequest",
        "id": str(med.id),
        "status": _map_med_status(med.status),
        "intent": "order",
        "subject": {"reference": f"Patient/{med.patient_id}"},
        "medicationCodeableConcept": {
            "text": med.name,
        },
        "dosageInstruction": [
            {
                "text": f"{med.dose} {med.dose_unit} {med.frequency}",
                "route": {"text": med.route},
                "doseAndRate": [
                    {
                        "doseQuantity": {
                            "value": float(med.dose) if med.dose.replace('.', '', 1).isdigit() else 0,
                            "unit": med.dose_unit,
                        }
                    }
                ],
            }
        ],
        "authoredOn": med.created_at.isoformat() if med.created_at else None,
    }
    if med.atc_code:
        resource["medicationCodeableConcept"]["coding"] = [
            {
                "system": "http://www.whocc.no/atc",
                "code": med.atc_code,
                "display": med.name,
            }
        ]
    if med.encounter_id:
        resource["encounter"] = {"reference": f"Encounter/{med.encounter_id}"}
    if med.reason:
        resource["reasonCode"] = [{"text": med.reason}]
    return resource


# ─── Datenbank-Abfragen für FHIR ──────────────────────────────


async def get_fhir_patient(db: AsyncSession, patient_id: uuid.UUID) -> dict[str, Any] | None:
    """Einzelnen Patienten als FHIR Patient Resource laden."""
    patient = await db.get(Patient, patient_id)
    if not patient:
        return None
    return patient_to_fhir(patient)


async def get_fhir_patient_everything(
    db: AsyncSession,
    patient_id: uuid.UUID,
) -> dict[str, Any]:
    """FHIR $everything — Alle Ressourcen eines Patienten als Bundle."""
    entries: list[dict[str, Any]] = []

    # Patient
    patient = await db.get(Patient, patient_id)
    if patient:
        entries.append({
            "resource": patient_to_fhir(patient),
            "request": {"method": "GET", "url": f"Patient/{patient_id}"},
        })

    # Encounters
    enc_result = await db.execute(
        select(Encounter).where(Encounter.patient_id == patient_id)
    )
    for enc in enc_result.scalars().all():
        entries.append({
            "resource": encounter_to_fhir(enc),
            "request": {"method": "GET", "url": f"Encounter/{enc.id}"},
        })

    # Vitals → Observations
    vs_result = await db.execute(
        select(VitalSign)
        .where(VitalSign.patient_id == patient_id)
        .order_by(VitalSign.recorded_at.desc())
        .limit(100)
    )
    for vs in vs_result.scalars().all():
        for obs in vital_sign_to_fhir(vs):
            entries.append({
                "resource": obs,
                "request": {"method": "GET", "url": f"Observation/{obs['id']}"},
            })

    # Medications → MedicationRequest
    med_result = await db.execute(
        select(Medication).where(Medication.patient_id == patient_id)
    )
    for med in med_result.scalars().all():
        entries.append({
            "resource": medication_to_fhir(med),
            "request": {"method": "GET", "url": f"MedicationRequest/{med.id}"},
        })

    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(entries),
        "entry": entries,
    }


async def search_fhir_patients(
    db: AsyncSession,
    *,
    name: str | None = None,
    birthdate: date | None = None,
    identifier: str | None = None,
) -> list[dict[str, Any]]:
    """FHIR Patient-Suche mit optionalen Suchparametern."""
    query = select(Patient)
    if name:
        query = query.where(
            Patient.last_name.ilike(f"%{name}%")
            | Patient.first_name.ilike(f"%{name}%")
        )
    if birthdate:
        query = query.where(Patient.date_of_birth == birthdate)
    if identifier:
        query = query.where(Patient.ahv_number == identifier)

    result = await db.execute(query.limit(50))
    return [patient_to_fhir(p) for p in result.scalars().all()]


# ─── Hilfsfunktionen ──────────────────────────────────────────


def _map_gender(gender: str | None) -> str:
    """PDMS-Gender → FHIR AdministrativeGender."""
    mapping = {
        "männlich": "male",
        "male": "male",
        "m": "male",
        "weiblich": "female",
        "female": "female",
        "w": "female",
        "f": "female",
        "divers": "other",
        "other": "other",
    }
    return mapping.get((gender or "").lower(), "unknown")


def _map_encounter_status(status: str) -> str:
    """PDMS-Encounter-Status → FHIR EncounterStatus."""
    mapping = {
        "active": "in-progress",
        "discharged": "finished",
        "transferred": "finished",
        "cancelled": "cancelled",
    }
    return mapping.get(status, "unknown")


def _map_med_status(status: str) -> str:
    """PDMS-Medication-Status → FHIR MedicationRequestStatus."""
    mapping = {
        "active": "active",
        "discontinued": "stopped",
        "completed": "completed",
        "paused": "on-hold",
    }
    return mapping.get(status, "unknown")
