"""FHIR R4 API endpoints — CH Core Profile Mappings.

Stellt FHIR-konforme Ressourcen bereit:
- GET /fhir/Patient            → Patienten-Suche
- GET /fhir/Patient/{id}       → Einzelner Patient
- GET /fhir/Patient/{id}/$everything → Alle Ressourcen eines Patienten
- GET /fhir/metadata           → CapabilityStatement
"""

import uuid
from datetime import date
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies import get_current_user, get_db
from src.domain.services.fhir_service import (
    get_fhir_patient,
    get_fhir_patient_everything,
    search_fhir_patients,
)

router = APIRouter(prefix="/fhir")

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[dict, Depends(get_current_user)]


@router.get("/metadata")
async def capability_statement(user: CurrentUser) -> dict[str, Any]:
    """FHIR CapabilityStatement — beschreibt die FHIR-Fähigkeiten des Systems."""
    return {
        "resourceType": "CapabilityStatement",
        "status": "active",
        "kind": "instance",
        "fhirVersion": "4.0.1",
        "format": ["json"],
        "implementation": {
            "description": "PDMS Home-Spital FHIR R4 Server",
            "url": "/api/v1/fhir",
        },
        "rest": [
            {
                "mode": "server",
                "resource": [
                    {
                        "type": "Patient",
                        "profile": "http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-patient",
                        "interaction": [
                            {"code": "read"},
                            {"code": "search-type"},
                        ],
                        "searchParam": [
                            {"name": "name", "type": "string"},
                            {"name": "birthdate", "type": "date"},
                            {"name": "identifier", "type": "token"},
                        ],
                        "operation": [
                            {"name": "everything", "definition": "http://hl7.org/fhir/OperationDefinition/Patient-everything"},
                        ],
                    },
                    {
                        "type": "Observation",
                        "profile": "http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-observation-vitalsigns",
                        "interaction": [{"code": "read"}],
                    },
                    {
                        "type": "Encounter",
                        "profile": "http://fhir.ch/ig/ch-core/StructureDefinition/ch-core-encounter",
                        "interaction": [{"code": "read"}],
                    },
                    {
                        "type": "MedicationRequest",
                        "interaction": [{"code": "read"}],
                    },
                ],
            }
        ],
    }


@router.get("/Patient", response_model=None)
async def search_patients(
    db: DbSession,
    user: CurrentUser,
    name: str | None = Query(None, description="Patienten-Name (Vor- oder Nachname)"),
    birthdate: date | None = Query(None, description="Geburtsdatum (YYYY-MM-DD)"),
    identifier: str | None = Query(None, description="AHV-Nummer"),
) -> dict[str, Any]:
    """FHIR Patient-Suche mit Suchparametern."""
    patients = await search_fhir_patients(
        db, name=name, birthdate=birthdate, identifier=identifier,
    )
    return {
        "resourceType": "Bundle",
        "type": "searchset",
        "total": len(patients),
        "entry": [
            {"resource": p, "request": {"method": "GET", "url": f"Patient/{p['id']}"}}
            for p in patients
        ],
    }


@router.get("/Patient/{patient_id}", response_model=None)
async def get_patient(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> dict[str, Any]:
    """FHIR Patient Resource laden (CH Core Profile)."""
    result = await get_fhir_patient(db, patient_id)
    if not result:
        raise HTTPException(404, detail="Patient nicht gefunden")
    return result


@router.get("/Patient/{patient_id}/$everything", response_model=None)
async def patient_everything(
    patient_id: uuid.UUID,
    db: DbSession,
    user: CurrentUser,
) -> dict[str, Any]:
    """FHIR $everything — Alle Ressourcen eines Patienten als Bundle."""
    bundle = await get_fhir_patient_everything(db, patient_id)
    if bundle["total"] == 0:
        raise HTTPException(404, detail="Patient nicht gefunden oder keine Daten vorhanden")
    return bundle
