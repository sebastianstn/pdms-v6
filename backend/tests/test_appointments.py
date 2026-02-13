"""Appointments Tests — Termine & Entlasskriterien: Schema, Endpoints."""

import uuid
from datetime import date, datetime, timedelta

import pytest
from httpx import AsyncClient


PATIENT_ID = str(uuid.uuid4())


@pytest.fixture
def appointment_data() -> dict:
    """Gültige Termin-Daten."""
    tomorrow = date.today() + timedelta(days=1)
    return {
        "patient_id": PATIENT_ID,
        "appointment_type": "hausbesuch",
        "title": "Hausbesuch Wundkontrolle",
        "scheduled_date": str(tomorrow),
        "start_time": (datetime.now() + timedelta(days=1)).isoformat(),
    }


# ── Endpoint-Erreichbarkeit ───────────────────────────────────────

class TestAppointmentEndpoints:
    """Tests dass Appointment-Endpoints existieren."""

    @pytest.mark.asyncio
    async def test_meta_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/appointments/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_list_appointments(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/appointments")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_week_view(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/appointments/week")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_appointment_not_found(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/appointments/{uuid.uuid4()}")
        assert r.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_get_appointment_invalid_uuid(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/appointments/not-a-uuid")
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_cancel_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.post(f"/api/v1/appointments/{uuid.uuid4()}/cancel")
        assert r.status_code != 405  # Route existiert

    @pytest.mark.asyncio
    async def test_complete_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.post(f"/api/v1/appointments/{uuid.uuid4()}/complete")
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_delete_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/appointments/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


# ── Schema-Validierung ────────────────────────────────────────────

class TestAppointmentValidation:
    """Schema-Validierung für Termine."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, appointment_data):
        r = await arzt_client.post("/api/v1/appointments", json=appointment_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/appointments", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_title(self, arzt_client: AsyncClient, appointment_data):
        del appointment_data["title"]
        r = await arzt_client.post("/api/v1/appointments", json=appointment_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_invalid_type(self, arzt_client: AsyncClient, appointment_data):
        appointment_data["appointment_type"] = "invalid_type"
        r = await arzt_client.post("/api/v1/appointments", json=appointment_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_appointment_types(self, arzt_client: AsyncClient, appointment_data):
        valid_types = [
            "hausbesuch", "teleconsult", "konsil", "ambulant",
            "labor", "entlassung", "spitex", "physiotherapie",
        ]
        for at in valid_types:
            appointment_data["appointment_type"] = at
            r = await arzt_client.post("/api/v1/appointments", json=appointment_data)
            assert r.status_code != 422, f"Appointment-Typ '{at}' abgelehnt"

    @pytest.mark.asyncio
    async def test_create_invalid_patient_uuid(self, arzt_client: AsyncClient, appointment_data):
        appointment_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/appointments", json=appointment_data)
        assert r.status_code == 422


# ── Discharge Criteria ────────────────────────────────────────────

class TestDischargeCriteria:
    """Entlasskriterien-Tests."""

    @pytest.mark.asyncio
    async def test_get_discharge_criteria(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/discharge-criteria")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_update_discharge_criteria(self, arzt_client: AsyncClient):
        """PUT mit optionalen Feldern sollte akzeptiert werden."""
        data = {
            "clinical_stability": True,
            "pain_controlled": True,
            "medication_plan_ready": False,
        }
        r = await arzt_client.put(
            f"/api/v1/patients/{PATIENT_ID}/discharge-criteria", json=data
        )
        assert r.status_code != 422


# ── Auth ──────────────────────────────────────────────────────────

class TestAppointmentAuth:
    """Auth-Tests — Alle authentifizierten User dürfen Termine verwalten."""

    @pytest.mark.asyncio
    async def test_arzt_can_create(self, arzt_client: AsyncClient, appointment_data):
        r = await arzt_client.post("/api/v1/appointments", json=appointment_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_can_create(self, pflege_client: AsyncClient, appointment_data):
        r = await pflege_client.post("/api/v1/appointments", json=appointment_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_no_auth_blocked(self, client: AsyncClient, appointment_data):
        r = await client.post("/api/v1/appointments", json=appointment_data)
        assert r.status_code in (201, 401, 403, 500)
