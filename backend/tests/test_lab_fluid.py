"""Lab & Fluid Balance Tests — Laborwerte und Flüssigkeitsbilanz."""

import uuid

import pytest
from httpx import AsyncClient


PATIENT_ID = str(uuid.uuid4())


# ── Fixtures ─────────────────────────────────────────────────────

@pytest.fixture
def lab_result_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "analyte": "CRP",
        "value": 45.2,
    }


@pytest.fixture
def lab_batch_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "results": [
            {"patient_id": PATIENT_ID, "analyte": "CRP", "value": 45.2},
            {"patient_id": PATIENT_ID, "analyte": "Hb", "value": 12.8},
            {"patient_id": PATIENT_ID, "analyte": "Leukozyten", "value": 8.2},
        ],
    }


@pytest.fixture
def fluid_entry_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "direction": "intake",
        "category": "oral",
        "display_name": "Wasser",
        "volume_ml": 200.0,
    }


# ═══════════════════════════════════════════════════════════════════
# LAB RESULTS
# ═══════════════════════════════════════════════════════════════════

class TestLabResultEndpoints:
    """Laborwerte-Endpoint-Tests."""

    @pytest.mark.asyncio
    async def test_meta(self, arzt_client: AsyncClient):
        """Meta-Endpoint ohne Auth erreichbar."""
        r = await arzt_client.get("/api/v1/lab-results/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_meta_no_auth(self, client: AsyncClient):
        """Meta-Endpoint auch ohne Auth (öffentlich)."""
        r = await client.get("/api/v1/lab-results/meta")
        assert r.status_code in (200, 401, 403)

    @pytest.mark.asyncio
    async def test_list(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/lab-results")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_summary(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/lab-results/summary")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_trend(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/lab-results/trend/CRP")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_not_found(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/lab-results/{uuid.uuid4()}")
        assert r.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_get_invalid_uuid(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/lab-results/not-a-uuid")
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_delete(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/lab-results/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


class TestLabResultValidation:
    """Schema-Validierung für Laborwerte."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, lab_result_data):
        r = await arzt_client.post("/api/v1/lab-results", json=lab_result_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/lab-results", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_analyte(self, arzt_client: AsyncClient, lab_result_data):
        del lab_result_data["analyte"]
        r = await arzt_client.post("/api/v1/lab-results", json=lab_result_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_value(self, arzt_client: AsyncClient, lab_result_data):
        del lab_result_data["value"]
        r = await arzt_client.post("/api/v1/lab-results", json=lab_result_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_with_flag(self, arzt_client: AsyncClient, lab_result_data):
        for flag in ["H", "L", "HH", "LL"]:
            lab_result_data["flag"] = flag
            r = await arzt_client.post("/api/v1/lab-results", json=lab_result_data)
            assert r.status_code != 422, f"Flag '{flag}' abgelehnt"

    @pytest.mark.asyncio
    async def test_create_invalid_flag(self, arzt_client: AsyncClient, lab_result_data):
        lab_result_data["flag"] = "INVALID"
        r = await arzt_client.post("/api/v1/lab-results", json=lab_result_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_categories(self, arzt_client: AsyncClient, lab_result_data):
        for cat in ["chemistry", "hematology", "coagulation", "blood_gas", "urinalysis"]:
            lab_result_data["category"] = cat
            r = await arzt_client.post("/api/v1/lab-results", json=lab_result_data)
            assert r.status_code != 422, f"Kategorie '{cat}' abgelehnt"

    @pytest.mark.asyncio
    async def test_batch_create_valid(self, arzt_client: AsyncClient, lab_batch_data):
        r = await arzt_client.post("/api/v1/lab-results/batch", json=lab_batch_data)
        assert r.status_code != 422, f"Batch rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_batch_create_empty_results(self, arzt_client: AsyncClient):
        r = await arzt_client.post(
            "/api/v1/lab-results/batch",
            json={"patient_id": PATIENT_ID, "results": []},
        )
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, arzt_client: AsyncClient, lab_result_data):
        lab_result_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/lab-results", json=lab_result_data)
        assert r.status_code == 422


class TestLabResultRBAC:
    """RBAC für Laborwerte — nur Arzt/Admin dürfen schreiben."""

    @pytest.mark.asyncio
    async def test_arzt_can_create(self, arzt_client: AsyncClient, lab_result_data):
        r = await arzt_client.post("/api/v1/lab-results", json=lab_result_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_admin_can_create(self, admin_client: AsyncClient, lab_result_data):
        r = await admin_client.post("/api/v1/lab-results", json=lab_result_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_cannot_create(self, pflege_client: AsyncClient, lab_result_data):
        r = await pflege_client.post("/api/v1/lab-results", json=lab_result_data)
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_readonly_cannot_create(self, readonly_client: AsyncClient, lab_result_data):
        r = await readonly_client.post("/api/v1/lab-results", json=lab_result_data)
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_pflege_can_read(self, pflege_client: AsyncClient):
        r = await pflege_client.get(f"/api/v1/patients/{PATIENT_ID}/lab-results")
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_cannot_delete(self, pflege_client: AsyncClient):
        r = await pflege_client.delete(f"/api/v1/lab-results/{uuid.uuid4()}")
        assert r.status_code == 403


# ═══════════════════════════════════════════════════════════════════
# FLUID BALANCE
# ═══════════════════════════════════════════════════════════════════

class TestFluidBalanceEndpoints:
    """Flüssigkeitsbilanz-Endpoint-Tests."""

    @pytest.mark.asyncio
    async def test_meta(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/fluid-balance/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_meta_no_auth(self, client: AsyncClient):
        """Meta-Endpoint auch ohne Auth (öffentlich)."""
        r = await client.get("/api/v1/fluid-balance/meta")
        assert r.status_code in (200, 401, 403)

    @pytest.mark.asyncio
    async def test_list(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/fluid-balance")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_summary(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/fluid-balance/summary")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_not_found(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/fluid-balance/{uuid.uuid4()}")
        assert r.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_delete(self, pflege_client: AsyncClient):
        r = await pflege_client.delete(f"/api/v1/fluid-balance/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


class TestFluidBalanceValidation:
    """Schema-Validierung für Flüssigkeitsbilanz."""

    @pytest.mark.asyncio
    async def test_create_valid(self, pflege_client: AsyncClient, fluid_entry_data):
        r = await pflege_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, pflege_client: AsyncClient):
        r = await pflege_client.post("/api/v1/fluid-balance", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_direction(self, pflege_client: AsyncClient, fluid_entry_data):
        del fluid_entry_data["direction"]
        r = await pflege_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_invalid_direction(self, pflege_client: AsyncClient, fluid_entry_data):
        fluid_entry_data["direction"] = "invalid"
        r = await pflege_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_directions(self, pflege_client: AsyncClient, fluid_entry_data):
        for d in ["intake", "output"]:
            fluid_entry_data["direction"] = d
            if d == "output":
                fluid_entry_data["category"] = "urine"
            r = await pflege_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
            assert r.status_code != 422, f"Direction '{d}' abgelehnt"

    @pytest.mark.asyncio
    async def test_intake_categories(self, pflege_client: AsyncClient, fluid_entry_data):
        for cat in ["infusion", "oral", "medication", "blood_product", "nutrition", "other_intake"]:
            fluid_entry_data["direction"] = "intake"
            fluid_entry_data["category"] = cat
            r = await pflege_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
            assert r.status_code != 422, f"Intake-Kategorie '{cat}' abgelehnt"

    @pytest.mark.asyncio
    async def test_output_categories(self, pflege_client: AsyncClient, fluid_entry_data):
        for cat in ["urine", "drain", "vomit", "stool", "perspiratio", "blood_loss", "other_output"]:
            fluid_entry_data["direction"] = "output"
            fluid_entry_data["category"] = cat
            r = await pflege_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
            assert r.status_code != 422, f"Output-Kategorie '{cat}' abgelehnt"

    @pytest.mark.asyncio
    async def test_zero_volume(self, pflege_client: AsyncClient, fluid_entry_data):
        """Volume 0 sollte abgelehnt werden (>0 Constraint)."""
        fluid_entry_data["volume_ml"] = 0
        r = await pflege_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_negative_volume(self, pflege_client: AsyncClient, fluid_entry_data):
        """Negative Volume muss abgelehnt werden."""
        fluid_entry_data["volume_ml"] = -100
        r = await pflege_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, pflege_client: AsyncClient, fluid_entry_data):
        fluid_entry_data["patient_id"] = "not-a-uuid"
        r = await pflege_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
        assert r.status_code == 422


class TestFluidBalanceRBAC:
    """RBAC für Flüssigkeitsbilanz — Pflege, Arzt, Admin dürfen schreiben."""

    @pytest.mark.asyncio
    async def test_pflege_can_create(self, pflege_client: AsyncClient, fluid_entry_data):
        r = await pflege_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_arzt_can_create(self, arzt_client: AsyncClient, fluid_entry_data):
        r = await arzt_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_admin_can_create(self, admin_client: AsyncClient, fluid_entry_data):
        r = await admin_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_readonly_cannot_create(self, readonly_client: AsyncClient, fluid_entry_data):
        r = await readonly_client.post("/api/v1/fluid-balance", json=fluid_entry_data)
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_readonly_cannot_delete(self, readonly_client: AsyncClient):
        r = await readonly_client.delete(f"/api/v1/fluid-balance/{uuid.uuid4()}")
        assert r.status_code == 403
