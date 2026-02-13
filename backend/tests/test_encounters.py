"""Encounter-Tests — Aufenthalte: Schema-Validierung, Endpoints, RBAC."""

import uuid
from datetime import date

import pytest
from httpx import AsyncClient


PATIENT_ID = str(uuid.uuid4())


# ── Sample Data ────────────────────────────────────────────────────

@pytest.fixture
def encounter_data() -> dict:
    """Gültige Encounter-Erstellungsdaten."""
    return {
        "patient_id": PATIENT_ID,
        "encounter_type": "home-care",
    }


# ── Endpoint-Erreichbarkeit ───────────────────────────────────────

class TestEncounterEndpoints:
    """Tests dass Encounter-Endpoints existieren."""

    @pytest.mark.asyncio
    async def test_meta_endpoint(self, arzt_client: AsyncClient):
        """GET /encounters/meta muss erreichbar sein."""
        r = await arzt_client.get("/api/v1/encounters/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_list_encounters(self, arzt_client: AsyncClient):
        """GET /patients/{id}/encounters muss erreichbar sein."""
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/encounters")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_active_encounters(self, arzt_client: AsyncClient):
        """GET /patients/{id}/encounters/active muss erreichbar sein."""
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/encounters/active")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_encounter_not_found(self, arzt_client: AsyncClient):
        """GET /encounters/{id} mit ungültiger ID."""
        r = await arzt_client.get(f"/api/v1/encounters/{uuid.uuid4()}")
        assert r.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_get_encounter_invalid_uuid(self, arzt_client: AsyncClient):
        """GET /encounters/invalid → 422."""
        r = await arzt_client.get("/api/v1/encounters/not-a-uuid")
        assert r.status_code == 422


# ── Schema-Validierung ────────────────────────────────────────────

class TestEncounterValidation:
    """Pydantic-Schema-Validierung für Encounter."""

    @pytest.mark.asyncio
    async def test_create_encounter_valid(self, arzt_client: AsyncClient, encounter_data):
        """Gültige Daten → kein 422."""
        r = await arzt_client.post("/api/v1/encounters/admit", json=encounter_data)
        assert r.status_code != 422, f"Schema rejected valid data: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_encounter_empty_body(self, arzt_client: AsyncClient):
        """Leerer Body → 422."""
        r = await arzt_client.post("/api/v1/encounters/admit", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_encounter_invalid_type(self, arzt_client: AsyncClient, encounter_data):
        """Ungültiger encounter_type → 422."""
        encounter_data["encounter_type"] = "invalid_type"
        r = await arzt_client.post("/api/v1/encounters/admit", json=encounter_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_encounter_all_types(self, arzt_client: AsyncClient, encounter_data):
        """Alle gültigen encounter_types werden akzeptiert."""
        for enc_type in ["hospitalization", "home-care", "ambulatory"]:
            encounter_data["encounter_type"] = enc_type
            r = await arzt_client.post("/api/v1/encounters/admit", json=encounter_data)
            assert r.status_code != 422, f"Type '{enc_type}' abgelehnt"

    @pytest.mark.asyncio
    async def test_create_encounter_invalid_patient_uuid(self, arzt_client: AsyncClient, encounter_data):
        """Ungültige Patient-UUID → 422."""
        encounter_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/encounters/admit", json=encounter_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_discharge_endpoint_exists(self, arzt_client: AsyncClient):
        """POST /encounters/{id}/discharge muss erreichbar sein."""
        r = await arzt_client.post(f"/api/v1/encounters/{uuid.uuid4()}/discharge", json={})
        assert r.status_code != 405  # Route existiert (404 = Ressource nicht gefunden)

    @pytest.mark.asyncio
    async def test_transfer_endpoint_exists(self, arzt_client: AsyncClient):
        """POST /encounters/{id}/transfer muss erreichbar sein."""
        r = await arzt_client.post(f"/api/v1/encounters/{uuid.uuid4()}/transfer", json={})
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_cancel_endpoint_exists(self, arzt_client: AsyncClient):
        """POST /encounters/{id}/cancel muss erreichbar sein."""
        r = await arzt_client.post(f"/api/v1/encounters/{uuid.uuid4()}/cancel")
        assert r.status_code != 405


# ── RBAC ──────────────────────────────────────────────────────────

class TestEncounterRBAC:
    """RBAC-Tests für Encounter-Endpoints."""

    @pytest.mark.asyncio
    async def test_arzt_can_admit(self, arzt_client: AsyncClient, encounter_data):
        """Arzt darf Patienten aufnehmen."""
        r = await arzt_client.post("/api/v1/encounters/admit", json=encounter_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_admin_can_admit(self, admin_client: AsyncClient, encounter_data):
        """Admin darf Patienten aufnehmen."""
        r = await admin_client.post("/api/v1/encounters/admit", json=encounter_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_cannot_admit(self, pflege_client: AsyncClient, encounter_data):
        """Pflege darf NICHT aufnehmen."""
        r = await pflege_client.post("/api/v1/encounters/admit", json=encounter_data)
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_readonly_cannot_admit(self, readonly_client: AsyncClient, encounter_data):
        """Readonly darf NICHT aufnehmen."""
        r = await readonly_client.post("/api/v1/encounters/admit", json=encounter_data)
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_pflege_can_read_encounters(self, pflege_client: AsyncClient):
        """Pflege darf Encounters lesen."""
        r = await pflege_client.get(f"/api/v1/patients/{PATIENT_ID}/encounters")
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_cannot_discharge(self, pflege_client: AsyncClient):
        """Pflege darf NICHT entlassen."""
        r = await pflege_client.post(
            f"/api/v1/encounters/{uuid.uuid4()}/discharge", json={}
        )
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_pflege_cannot_transfer(self, pflege_client: AsyncClient):
        """Pflege darf NICHT verlegen."""
        r = await pflege_client.post(
            f"/api/v1/encounters/{uuid.uuid4()}/transfer", json={}
        )
        assert r.status_code == 403
