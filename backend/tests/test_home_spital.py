"""Home-Spital Tests — Hausbesuche, Telekonsultationen, Remote-Geräte, Selbstmedikation."""

import uuid
from datetime import date, datetime, timedelta

import pytest
from httpx import AsyncClient


PATIENT_ID = str(uuid.uuid4())


# ── Fixtures ─────────────────────────────────────────────────────

@pytest.fixture
def home_visit_data() -> dict:
    tomorrow = date.today() + timedelta(days=1)
    return {
        "patient_id": PATIENT_ID,
        "planned_date": str(tomorrow),
        "planned_start": (datetime.now() + timedelta(days=1)).isoformat(),
    }


@pytest.fixture
def teleconsult_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "scheduled_start": (datetime.now() + timedelta(hours=2)).isoformat(),
    }


@pytest.fixture
def device_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "device_type": "pulsoximeter",
        "device_name": "Beurer PO 80",
    }


@pytest.fixture
def self_med_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "medication_id": str(uuid.uuid4()),
        "scheduled_time": datetime.now().isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════
# HOME VISITS
# ═══════════════════════════════════════════════════════════════════

class TestHomeVisitEndpoints:
    """Hausbesuch-Endpoints."""

    @pytest.mark.asyncio
    async def test_meta(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/home-visits/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_today(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/home-visits/today")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_list(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/home-visits")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_not_found(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/home-visits/{uuid.uuid4()}")
        assert r.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_get_invalid_uuid(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/home-visits/not-a-uuid")
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_start_travel(self, arzt_client: AsyncClient):
        r = await arzt_client.post(f"/api/v1/home-visits/{uuid.uuid4()}/start-travel")
        assert r.status_code != 405  # Route existiert

    @pytest.mark.asyncio
    async def test_arrive(self, arzt_client: AsyncClient):
        r = await arzt_client.post(f"/api/v1/home-visits/{uuid.uuid4()}/arrive")
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_complete(self, arzt_client: AsyncClient):
        r = await arzt_client.post(
            f"/api/v1/home-visits/{uuid.uuid4()}/complete", json={}
        )
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_delete(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/home-visits/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


class TestHomeVisitValidation:
    """Schema-Validierung für Hausbesuche."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, home_visit_data):
        r = await arzt_client.post("/api/v1/home-visits", json=home_visit_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/home-visits", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_planned_date(self, arzt_client: AsyncClient, home_visit_data):
        del home_visit_data["planned_date"]
        r = await arzt_client.post("/api/v1/home-visits", json=home_visit_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, arzt_client: AsyncClient, home_visit_data):
        home_visit_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/home-visits", json=home_visit_data)
        assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════
# TELECONSULTS
# ═══════════════════════════════════════════════════════════════════

class TestTeleconsultEndpoints:
    """Telekonsultations-Endpoints."""

    @pytest.mark.asyncio
    async def test_meta(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/teleconsults/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_list(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/teleconsults")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_not_found(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/teleconsults/{uuid.uuid4()}")
        assert r.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_start_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.post(f"/api/v1/teleconsults/{uuid.uuid4()}/start")
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_end_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.post(f"/api/v1/teleconsults/{uuid.uuid4()}/end")
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_delete(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/teleconsults/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


class TestTeleconsultValidation:
    """Schema-Validierung für Telekonsultationen."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, teleconsult_data):
        r = await arzt_client.post("/api/v1/teleconsults", json=teleconsult_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/teleconsults", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_with_platform(self, arzt_client: AsyncClient, teleconsult_data):
        for platform in ["zoom", "teams", "hin_talk", "other"]:
            teleconsult_data["meeting_platform"] = platform
            r = await arzt_client.post("/api/v1/teleconsults", json=teleconsult_data)
            assert r.status_code != 422, f"Platform '{platform}' abgelehnt"

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, arzt_client: AsyncClient, teleconsult_data):
        teleconsult_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/teleconsults", json=teleconsult_data)
        assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════
# REMOTE DEVICES
# ═══════════════════════════════════════════════════════════════════

class TestRemoteDeviceEndpoints:
    """Remote-Geräte-Endpoints."""

    @pytest.mark.asyncio
    async def test_meta(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/remote-devices/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_list(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/remote-devices")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_not_found(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/remote-devices/{uuid.uuid4()}")
        assert r.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_reading_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.post(
            f"/api/v1/remote-devices/{uuid.uuid4()}/reading",
            json={"value": "97", "unit": "%"},
        )
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_offline_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.post(f"/api/v1/remote-devices/{uuid.uuid4()}/offline")
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_delete(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/remote-devices/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


class TestRemoteDeviceValidation:
    """Schema-Validierung für Remote-Geräte."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, device_data):
        r = await arzt_client.post("/api/v1/remote-devices", json=device_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/remote-devices", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_invalid_device_type(self, arzt_client: AsyncClient, device_data):
        device_data["device_type"] = "invalid_type"
        r = await arzt_client.post("/api/v1/remote-devices", json=device_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_device_types(self, arzt_client: AsyncClient, device_data):
        for dt in ["pulsoximeter", "blood_pressure", "scale", "thermometer", "glucometer"]:
            device_data["device_type"] = dt
            r = await arzt_client.post("/api/v1/remote-devices", json=device_data)
            assert r.status_code != 422, f"Device-Typ '{dt}' abgelehnt"

    @pytest.mark.asyncio
    async def test_reading_valid(self, arzt_client: AsyncClient):
        r = await arzt_client.post(
            f"/api/v1/remote-devices/{uuid.uuid4()}/reading",
            json={"value": "120/80", "unit": "mmHg"},
        )
        assert r.status_code != 422

    @pytest.mark.asyncio
    async def test_reading_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post(
            f"/api/v1/remote-devices/{uuid.uuid4()}/reading", json={}
        )
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, arzt_client: AsyncClient, device_data):
        device_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/remote-devices", json=device_data)
        assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════
# SELF-MEDICATION
# ═══════════════════════════════════════════════════════════════════

class TestSelfMedicationEndpoints:
    """Selbstmedikations-Endpoints."""

    @pytest.mark.asyncio
    async def test_meta(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/self-medication/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_list(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/self-medication")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_confirm_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.post(f"/api/v1/self-medication/{uuid.uuid4()}/confirm")
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_miss_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.post(f"/api/v1/self-medication/{uuid.uuid4()}/miss")
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_skip_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.post(f"/api/v1/self-medication/{uuid.uuid4()}/skip")
        assert r.status_code != 405


class TestSelfMedicationValidation:
    """Schema-Validierung für Selbstmedikation."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, self_med_data):
        r = await arzt_client.post("/api/v1/self-medication", json=self_med_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/self-medication", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, arzt_client: AsyncClient, self_med_data):
        self_med_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/self-medication", json=self_med_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_medication_uuid(self, arzt_client: AsyncClient, self_med_data):
        self_med_data["medication_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/self-medication", json=self_med_data)
        assert r.status_code == 422
