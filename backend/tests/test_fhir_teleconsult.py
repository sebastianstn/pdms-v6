"""Tests für FHIR R4 Endpoints und Teleconsult-Today."""

import pytest
from httpx import AsyncClient


# ═══════════════════════════════════════════════════════════════
# FHIR Endpoints
# ═══════════════════════════════════════════════════════════════


class TestFHIRMetadata:
    """Tests für /api/v1/fhir/metadata — CapabilityStatement."""

    @pytest.mark.anyio
    async def test_capability_statement(self, arzt_client: AsyncClient):
        """CapabilityStatement gibt korrekte FHIR-Version zurück."""
        resp = await arzt_client.get("/api/v1/fhir/metadata")
        assert resp.status_code == 200
        data = resp.json()
        assert data["resourceType"] == "CapabilityStatement"
        assert data["fhirVersion"] == "4.0.1"
        assert data["status"] == "active"
        assert data["kind"] == "instance"

    @pytest.mark.anyio
    async def test_capability_statement_has_resources(self, arzt_client: AsyncClient):
        """CapabilityStatement listet alle unterstützten Ressourcen auf."""
        resp = await arzt_client.get("/api/v1/fhir/metadata")
        assert resp.status_code == 200
        data = resp.json()
        rest = data["rest"]
        assert len(rest) == 1
        assert rest[0]["mode"] == "server"
        resource_types = [r["type"] for r in rest[0]["resource"]]
        assert "Patient" in resource_types
        assert "Observation" in resource_types
        assert "Encounter" in resource_types
        assert "MedicationRequest" in resource_types

    @pytest.mark.anyio
    async def test_capability_statement_ch_core_profiles(self, arzt_client: AsyncClient):
        """CapabilityStatement referenziert CH Core Profile URLs."""
        resp = await arzt_client.get("/api/v1/fhir/metadata")
        data = resp.json()
        patient_resource = next(
            r for r in data["rest"][0]["resource"] if r["type"] == "Patient"
        )
        assert "fhir.ch" in patient_resource["profile"]


class TestFHIRPatientSearch:
    """Tests für /api/v1/fhir/Patient — Patienten-Suche."""

    @pytest.mark.anyio
    async def test_search_patients_empty(self, arzt_client: AsyncClient):
        """Leere Patienten-Suche gibt leeres Bundle zurück."""
        resp = await arzt_client.get("/api/v1/fhir/Patient")
        assert resp.status_code == 200
        data = resp.json()
        assert data["resourceType"] == "Bundle"
        assert data["type"] == "searchset"
        assert data["total"] == 0
        assert data["entry"] == []

    @pytest.mark.anyio
    async def test_search_patients_with_name_filter(self, arzt_client: AsyncClient):
        """Patienten-Suche mit Name-Filter akzeptiert den Parameter."""
        resp = await arzt_client.get("/api/v1/fhir/Patient?name=Muster")
        assert resp.status_code == 200
        data = resp.json()
        assert data["resourceType"] == "Bundle"

    @pytest.mark.anyio
    async def test_search_patients_with_birthdate(self, arzt_client: AsyncClient):
        """Patienten-Suche mit birthdate Filter."""
        resp = await arzt_client.get("/api/v1/fhir/Patient?birthdate=1990-05-15")
        assert resp.status_code == 200
        data = resp.json()
        assert data["resourceType"] == "Bundle"

    @pytest.mark.anyio
    async def test_search_patients_with_identifier(self, arzt_client: AsyncClient):
        """Patienten-Suche mit AHV-Nummer."""
        resp = await arzt_client.get(
            "/api/v1/fhir/Patient?identifier=756.1234.5678.90"
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["resourceType"] == "Bundle"


class TestFHIRPatientRead:
    """Tests für /api/v1/fhir/Patient/{id} — Einzelner Patient."""

    @pytest.mark.anyio
    async def test_get_patient_not_found(self, arzt_client: AsyncClient):
        """Nicht existierender Patient gibt 404 zurück."""
        resp = await arzt_client.get(
            "/api/v1/fhir/Patient/00000000-0000-0000-0000-000000000001"
        )
        assert resp.status_code == 404

    @pytest.mark.anyio
    async def test_get_patient_invalid_uuid(self, arzt_client: AsyncClient):
        """Ungültige UUID gibt 422 zurück."""
        resp = await arzt_client.get("/api/v1/fhir/Patient/not-a-uuid")
        assert resp.status_code == 422


class TestFHIRPatientEverything:
    """Tests für /api/v1/fhir/Patient/{id}/$everything."""

    @pytest.mark.anyio
    async def test_everything_not_found(self, arzt_client: AsyncClient):
        """$everything für nicht existierenden Patient gibt 404 zurück."""
        resp = await arzt_client.get(
            "/api/v1/fhir/Patient/00000000-0000-0000-0000-000000000001/$everything"
        )
        assert resp.status_code == 404


# ═══════════════════════════════════════════════════════════════
# FHIR Service Unit Tests
# ═══════════════════════════════════════════════════════════════


class TestFHIRMappings:
    """Unit-Tests für die FHIR-Mapping-Funktionen."""

    def test_vital_loinc_map_complete(self):
        """Alle 8 Vitalparameter haben LOINC-Codes."""
        from src.domain.services.fhir_service import VITAL_LOINC_MAP

        expected_params = [
            "heart_rate", "systolic_bp", "diastolic_bp", "spo2",
            "temperature", "respiratory_rate", "gcs", "pain_score",
        ]
        for param in expected_params:
            assert param in VITAL_LOINC_MAP, f"LOINC-Code fehlt für {param}"
            assert "code" in VITAL_LOINC_MAP[param]
            assert "display" in VITAL_LOINC_MAP[param]
            assert "unit" in VITAL_LOINC_MAP[param]

    def test_gender_mapping(self):
        """Gender-Mapping konvertiert korrekt."""
        from src.domain.services.fhir_service import _map_gender

        assert _map_gender("männlich") == "male"
        assert _map_gender("male") == "male"
        assert _map_gender("m") == "male"
        assert _map_gender("weiblich") == "female"
        assert _map_gender("female") == "female"
        assert _map_gender("w") == "female"
        assert _map_gender("divers") == "other"
        assert _map_gender(None) == "unknown"
        assert _map_gender("xyz") == "unknown"

    def test_encounter_status_mapping(self):
        """Encounter-Status-Mapping konvertiert korrekt."""
        from src.domain.services.fhir_service import _map_encounter_status

        assert _map_encounter_status("active") == "in-progress"
        assert _map_encounter_status("discharged") == "finished"
        assert _map_encounter_status("transferred") == "finished"
        assert _map_encounter_status("cancelled") == "cancelled"
        assert _map_encounter_status("unknown_status") == "unknown"

    def test_medication_status_mapping(self):
        """Medication-Status-Mapping konvertiert korrekt."""
        from src.domain.services.fhir_service import _map_med_status

        assert _map_med_status("active") == "active"
        assert _map_med_status("discontinued") == "stopped"
        assert _map_med_status("completed") == "completed"
        assert _map_med_status("paused") == "on-hold"
        assert _map_med_status("xyz") == "unknown"


# ═══════════════════════════════════════════════════════════════
# Teleconsult Today Endpoint
# ═══════════════════════════════════════════════════════════════


class TestTeleconsultToday:
    """Tests für /api/v1/teleconsults/today."""

    @pytest.mark.anyio
    async def test_today_teleconsults_returns_200(self, arzt_client: AsyncClient):
        """Today-Endpoint gibt 200 mit korrekter Struktur zurück."""
        resp = await arzt_client.get("/api/v1/teleconsults/today")
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "completed" in data
        assert "active" in data
        assert "scheduled" in data
        assert "items" in data

    @pytest.mark.anyio
    async def test_today_teleconsults_counts(self, arzt_client: AsyncClient):
        """Today-Endpoint gibt numerische Zähler zurück."""
        resp = await arzt_client.get("/api/v1/teleconsults/today")
        data = resp.json()
        assert isinstance(data["total"], int)
        assert isinstance(data["completed"], int)
        assert isinstance(data["active"], int)
        assert isinstance(data["scheduled"], int)
        assert isinstance(data["items"], list)

    @pytest.mark.anyio
    async def test_today_teleconsults_pflege_access(self, pflege_client: AsyncClient):
        """Pflege-User kann Today-Endpoint aufrufen."""
        resp = await pflege_client.get("/api/v1/teleconsults/today")
        assert resp.status_code == 200

    @pytest.mark.anyio
    async def test_today_teleconsults_empty(self, arzt_client: AsyncClient):
        """Leere DB gibt total=0 zurück."""
        resp = await arzt_client.get("/api/v1/teleconsults/today")
        data = resp.json()
        assert data["total"] == 0
        assert data["completed"] == 0
        assert data["active"] == 0
        assert data["scheduled"] == 0
        assert data["items"] == []


# ═══════════════════════════════════════════════════════════════
# Audit Service Tests
# ═══════════════════════════════════════════════════════════════


class TestAuditService:
    """Tests für den implementierten Audit-Service."""

    @pytest.mark.anyio
    async def test_audit_log_admin_only(self, arzt_client: AsyncClient):
        """Nur Admin darf Audit-Logs lesen."""
        resp = await arzt_client.get("/api/v1/audit")
        assert resp.status_code == 403

    @pytest.mark.anyio
    async def test_audit_log_admin_access(self, admin_client: AsyncClient):
        """Admin kann Audit-Logs lesen."""
        resp = await admin_client.get("/api/v1/audit")
        assert resp.status_code == 200
        data = resp.json()
        assert "items" in data
        assert "total" in data

    @pytest.mark.anyio
    async def test_audit_log_pagination(self, admin_client: AsyncClient):
        """Audit-Logs unterstützen Pagination."""
        resp = await admin_client.get("/api/v1/audit?page=1&per_page=10")
        assert resp.status_code == 200
        data = resp.json()
        assert data["page"] == 1
        assert data["per_page"] == 10


# ═══════════════════════════════════════════════════════════════
# Schema Validation Tests
# ═══════════════════════════════════════════════════════════════


class TestAuthSchemas:
    """Tests für die Auth/User-Schemas."""

    def test_token_payload_roles(self):
        """TokenPayload extrahiert Rollen korrekt."""
        from src.domain.schemas.auth import TokenPayload

        payload = TokenPayload(
            sub="test-id",
            preferred_username="dr.test",
            realm_access={"roles": ["arzt", "pflege"]},
        )
        assert payload.user_id == "test-id"
        assert payload.roles == ["arzt", "pflege"]
        assert payload.has_role("arzt")
        assert not payload.has_role("admin")

    def test_token_payload_empty_roles(self):
        """TokenPayload ohne realm_access gibt leere Rollen zurück."""
        from src.domain.schemas.auth import TokenPayload

        payload = TokenPayload(sub="test-id")
        assert payload.roles == []
        assert not payload.has_role("arzt")

    def test_user_create_validation(self):
        """UserCreate validiert Rolle."""
        from src.domain.schemas.auth import UserCreate
        from pydantic import ValidationError

        user = UserCreate(
            username="test",
            email="test@pdms.local",
            role="arzt",
            password="secret123",
        )
        assert user.role == "arzt"

        with pytest.raises(ValidationError):
            UserCreate(
                username="test",
                email="test@pdms.local",
                role="invalid_role",
                password="secret123",
            )
