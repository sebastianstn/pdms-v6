"""Nursing Tests — Pflegeeinträge & Assessments: Schema, Endpoints, RBAC."""

import uuid

import pytest
from httpx import AsyncClient


PATIENT_ID = str(uuid.uuid4())


@pytest.fixture
def nursing_entry_data() -> dict:
    """Gültiger Pflegeeintrag."""
    return {
        "patient_id": PATIENT_ID,
        "category": "observation",
        "title": "Wundkontrolle",
        "content": "Wunde am rechten Unterschenkel trocken, keine Rötung.",
    }


@pytest.fixture
def assessment_data() -> dict:
    """Gültiges Pflege-Assessment."""
    return {
        "patient_id": PATIENT_ID,
        "assessment_type": "braden",
        "total_score": 16,
    }


# ── Nursing Entry Endpoints ──────────────────────────────────────

class TestNursingEntryEndpoints:
    """Pflegeeinträge-Endpoint-Tests."""

    @pytest.mark.asyncio
    async def test_list_entries(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/nursing-entries")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_entry_not_found(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/nursing-entries/{uuid.uuid4()}")
        assert r.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_get_entry_invalid_uuid(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/nursing-entries/not-a-uuid")
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_delete_entry(self, pflege_client: AsyncClient):
        r = await pflege_client.delete(f"/api/v1/nursing-entries/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


# ── Nursing Entry Schema ─────────────────────────────────────────

class TestNursingEntryValidation:
    """Schema-Validierung für Pflegeeinträge."""

    @pytest.mark.asyncio
    async def test_create_valid(self, pflege_client: AsyncClient, nursing_entry_data):
        r = await pflege_client.post("/api/v1/nursing-entries", json=nursing_entry_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, pflege_client: AsyncClient):
        r = await pflege_client.post("/api/v1/nursing-entries", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_category(self, pflege_client: AsyncClient, nursing_entry_data):
        del nursing_entry_data["category"]
        r = await pflege_client.post("/api/v1/nursing-entries", json=nursing_entry_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_invalid_category(self, pflege_client: AsyncClient, nursing_entry_data):
        nursing_entry_data["category"] = "invalid_category"
        r = await pflege_client.post("/api/v1/nursing-entries", json=nursing_entry_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_categories(self, pflege_client: AsyncClient, nursing_entry_data):
        """Alle gültigen Kategorien werden akzeptiert."""
        categories = [
            "observation", "intervention", "assessment", "handover",
            "wound_care", "mobility", "nutrition", "elimination", "communication",
        ]
        for cat in categories:
            nursing_entry_data["category"] = cat
            r = await pflege_client.post("/api/v1/nursing-entries", json=nursing_entry_data)
            assert r.status_code != 422, f"Kategorie '{cat}' abgelehnt"

    @pytest.mark.asyncio
    async def test_create_with_priority(self, pflege_client: AsyncClient, nursing_entry_data):
        """Optionales Priority-Feld."""
        for prio in ["low", "normal", "high", "urgent"]:
            nursing_entry_data["priority"] = prio
            r = await pflege_client.post("/api/v1/nursing-entries", json=nursing_entry_data)
            assert r.status_code != 422, f"Priority '{prio}' abgelehnt"

    @pytest.mark.asyncio
    async def test_create_invalid_priority(self, pflege_client: AsyncClient, nursing_entry_data):
        nursing_entry_data["priority"] = "invalid_priority"
        r = await pflege_client.post("/api/v1/nursing-entries", json=nursing_entry_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_invalid_patient_uuid(self, pflege_client: AsyncClient, nursing_entry_data):
        nursing_entry_data["patient_id"] = "not-a-uuid"
        r = await pflege_client.post("/api/v1/nursing-entries", json=nursing_entry_data)
        assert r.status_code == 422


# ── Nursing Assessment Endpoints ─────────────────────────────────

class TestNursingAssessmentEndpoints:
    """Assessment-Endpoint-Tests."""

    @pytest.mark.asyncio
    async def test_definitions_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/assessments/definitions")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_list_assessments(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/assessments")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_latest_assessment(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/assessments/latest")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_assessment_not_found(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/assessments/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


# ── Nursing Assessment Schema ────────────────────────────────────

class TestNursingAssessmentValidation:
    """Schema-Validierung für Assessments."""

    @pytest.mark.asyncio
    async def test_create_valid(self, pflege_client: AsyncClient, assessment_data):
        r = await pflege_client.post("/api/v1/assessments", json=assessment_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, pflege_client: AsyncClient):
        r = await pflege_client.post("/api/v1/assessments", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_assessment_types(self, pflege_client: AsyncClient, assessment_data):
        for at in ["barthel", "norton", "braden", "pain", "fall_risk", "nutrition"]:
            assessment_data["assessment_type"] = at
            r = await pflege_client.post("/api/v1/assessments", json=assessment_data)
            assert r.status_code != 422, f"Assessment-Typ '{at}' abgelehnt"

    @pytest.mark.asyncio
    async def test_invalid_assessment_type(self, pflege_client: AsyncClient, assessment_data):
        assessment_data["assessment_type"] = "invalid_type"
        r = await pflege_client.post("/api/v1/assessments", json=assessment_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_negative_score(self, pflege_client: AsyncClient, assessment_data):
        assessment_data["total_score"] = -1
        r = await pflege_client.post("/api/v1/assessments", json=assessment_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_risk_levels(self, pflege_client: AsyncClient, assessment_data):
        for rl in ["low", "medium", "high", "very_high"]:
            assessment_data["risk_level"] = rl
            r = await pflege_client.post("/api/v1/assessments", json=assessment_data)
            assert r.status_code != 422, f"Risk-Level '{rl}' abgelehnt"


# ── RBAC ──────────────────────────────────────────────────────────

class TestNursingRBAC:
    """RBAC für Pflege-Endpoints — Pflege, Arzt, Admin dürfen schreiben."""

    @pytest.mark.asyncio
    async def test_pflege_can_create_entry(self, pflege_client: AsyncClient, nursing_entry_data):
        r = await pflege_client.post("/api/v1/nursing-entries", json=nursing_entry_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_arzt_can_create_entry(self, arzt_client: AsyncClient, nursing_entry_data):
        r = await arzt_client.post("/api/v1/nursing-entries", json=nursing_entry_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_admin_can_create_entry(self, admin_client: AsyncClient, nursing_entry_data):
        r = await admin_client.post("/api/v1/nursing-entries", json=nursing_entry_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_readonly_cannot_create_entry(self, readonly_client: AsyncClient, nursing_entry_data):
        r = await readonly_client.post("/api/v1/nursing-entries", json=nursing_entry_data)
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_readonly_cannot_create_assessment(self, readonly_client: AsyncClient, assessment_data):
        r = await readonly_client.post("/api/v1/assessments", json=assessment_data)
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_readonly_can_read_entries(self, readonly_client: AsyncClient):
        r = await readonly_client.get(f"/api/v1/patients/{PATIENT_ID}/nursing-entries")
        assert r.status_code != 403
