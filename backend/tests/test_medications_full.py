"""Medications Tests — Medikamente: Schema, Endpoints, RBAC, Verabreichungen."""

import uuid
from datetime import date

import pytest
from httpx import AsyncClient


PATIENT_ID = str(uuid.uuid4())
MEDICATION_ID = str(uuid.uuid4())


@pytest.fixture
def medication_data() -> dict:
    """Gültige Medikament-Daten."""
    return {
        "patient_id": PATIENT_ID,
        "name": "Amoxicillin",
        "dose": "500",
        "dose_unit": "mg",
        "frequency": "3x täglich",
        "start_date": str(date.today()),
    }


@pytest.fixture
def administration_data() -> dict:
    """Gültige Verabreichungs-Daten."""
    return {
        "medication_id": MEDICATION_ID,
        "patient_id": PATIENT_ID,
        "dose_given": "500",
        "dose_unit": "mg",
    }


# ── Endpoint-Erreichbarkeit ───────────────────────────────────────

class TestMedicationEndpoints:
    """Medikamenten-Endpoints existieren."""

    @pytest.mark.asyncio
    async def test_list_medications(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/medications")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_medication_not_found(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/medications/{uuid.uuid4()}")
        assert r.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_get_medication_invalid_uuid(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/medications/not-a-uuid")
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_discontinue_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.patch(f"/api/v1/medications/{uuid.uuid4()}/discontinue")
        assert r.status_code != 405  # Route existiert

    @pytest.mark.asyncio
    async def test_list_administrations(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/medications/{MEDICATION_ID}/administrations")
        assert r.status_code != 404


# ── Schema-Validierung ────────────────────────────────────────────

class TestMedicationValidation:
    """Schema-Validierung für Medikamente."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, medication_data):
        r = await arzt_client.post("/api/v1/medications", json=medication_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/medications", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_missing_name(self, arzt_client: AsyncClient, medication_data):
        del medication_data["name"]
        r = await arzt_client.post("/api/v1/medications", json=medication_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_missing_dose_unit(self, arzt_client: AsyncClient, medication_data):
        del medication_data["dose_unit"]
        r = await arzt_client.post("/api/v1/medications", json=medication_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_dose_units(self, arzt_client: AsyncClient, medication_data):
        for unit in ["mg", "ml", "IE", "mcg", "g", "Tropfen", "Hübe", "Stk"]:
            medication_data["dose_unit"] = unit
            r = await arzt_client.post("/api/v1/medications", json=medication_data)
            assert r.status_code != 422, f"Dose-Unit '{unit}' abgelehnt"

    @pytest.mark.asyncio
    async def test_invalid_dose_unit(self, arzt_client: AsyncClient, medication_data):
        medication_data["dose_unit"] = "invalid_unit"
        r = await arzt_client.post("/api/v1/medications", json=medication_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_routes(self, arzt_client: AsyncClient, medication_data):
        for route in ["oral", "iv", "sc", "im", "topisch", "inhalativ", "rektal", "sublingual"]:
            medication_data["route"] = route
            r = await arzt_client.post("/api/v1/medications", json=medication_data)
            assert r.status_code != 422, f"Route '{route}' abgelehnt"

    @pytest.mark.asyncio
    async def test_invalid_route(self, arzt_client: AsyncClient, medication_data):
        medication_data["route"] = "invalid_route"
        r = await arzt_client.post("/api/v1/medications", json=medication_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, arzt_client: AsyncClient, medication_data):
        medication_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/medications", json=medication_data)
        assert r.status_code == 422


# ── Administration-Schema ────────────────────────────────────────

class TestAdministrationValidation:
    """Schema-Validierung für Medikamenten-Verabreichungen."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, administration_data):
        r = await arzt_client.post(
            f"/api/v1/medications/{MEDICATION_ID}/administrations",
            json=administration_data,
        )
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post(
            f"/api/v1/medications/{MEDICATION_ID}/administrations", json={}
        )
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_statuses(self, arzt_client: AsyncClient, administration_data):
        for status in ["completed", "refused", "held", "not-given"]:
            administration_data["status"] = status
            r = await arzt_client.post(
                f"/api/v1/medications/{MEDICATION_ID}/administrations",
                json=administration_data,
            )
            assert r.status_code != 422, f"Status '{status}' abgelehnt"


# ── RBAC ──────────────────────────────────────────────────────────

class TestMedicationRBAC:
    """RBAC für Medikamente — nur Arzt/Admin dürfen verschreiben."""

    @pytest.mark.asyncio
    async def test_arzt_can_create(self, arzt_client: AsyncClient, medication_data):
        r = await arzt_client.post("/api/v1/medications", json=medication_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_admin_can_create(self, admin_client: AsyncClient, medication_data):
        r = await admin_client.post("/api/v1/medications", json=medication_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_cannot_prescribe(self, pflege_client: AsyncClient, medication_data):
        r = await pflege_client.post("/api/v1/medications", json=medication_data)
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_readonly_cannot_prescribe(self, readonly_client: AsyncClient, medication_data):
        r = await readonly_client.post("/api/v1/medications", json=medication_data)
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_pflege_can_administer(self, pflege_client: AsyncClient, administration_data):
        """Pflege darf Medikamente verabreichen."""
        r = await pflege_client.post(
            f"/api/v1/medications/{MEDICATION_ID}/administrations",
            json=administration_data,
        )
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_can_read(self, pflege_client: AsyncClient):
        r = await pflege_client.get(f"/api/v1/patients/{PATIENT_ID}/medications")
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_cannot_discontinue(self, pflege_client: AsyncClient):
        r = await pflege_client.patch(f"/api/v1/medications/{uuid.uuid4()}/discontinue")
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_readonly_cannot_discontinue(self, readonly_client: AsyncClient):
        r = await readonly_client.patch(f"/api/v1/medications/{uuid.uuid4()}/discontinue")
        assert r.status_code == 403
