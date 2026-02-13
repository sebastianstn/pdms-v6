"""Legal Tests — Einwilligungen, Patientenverfügungen, Todesfallmeldungen."""

import uuid

import pytest
from httpx import AsyncClient


PATIENT_ID = str(uuid.uuid4())


# ── Fixtures ─────────────────────────────────────────────────────

@pytest.fixture
def consent_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "consent_type": "home_spital",
    }


@pytest.fixture
def directive_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "directive_type": "patientenverfuegung",
    }


@pytest.fixture
def death_notification_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "contact_name": "Maria Muster",
    }


# ═══════════════════════════════════════════════════════════════════
# CONSENTS
# ═══════════════════════════════════════════════════════════════════

class TestConsentEndpoints:
    """Einwilligungs-Endpoints existieren."""

    @pytest.mark.asyncio
    async def test_meta(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/consents/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_list(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/consents")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_not_found(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/consents/{uuid.uuid4()}")
        assert r.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_revoke_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.post(f"/api/v1/consents/{uuid.uuid4()}/revoke")
        assert r.status_code != 405  # Route existiert

    @pytest.mark.asyncio
    async def test_delete_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/consents/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


class TestConsentValidation:
    """Schema-Validierung für Einwilligungen."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, consent_data):
        r = await arzt_client.post("/api/v1/consents", json=consent_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/consents", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_invalid_type(self, arzt_client: AsyncClient, consent_data):
        consent_data["consent_type"] = "invalid_type"
        r = await arzt_client.post("/api/v1/consents", json=consent_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_consent_types(self, arzt_client: AsyncClient, consent_data):
        for ct in ["home_spital", "iv_antibiotics", "telemedizin", "ndsg", "epdg", "thromboprophylaxe"]:
            consent_data["consent_type"] = ct
            r = await arzt_client.post("/api/v1/consents", json=consent_data)
            assert r.status_code != 422, f"Consent-Typ '{ct}' abgelehnt"

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, arzt_client: AsyncClient, consent_data):
        consent_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/consents", json=consent_data)
        assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════
# DIRECTIVES
# ═══════════════════════════════════════════════════════════════════

class TestDirectiveEndpoints:
    """Patientenverfügungs-Endpoints."""

    @pytest.mark.asyncio
    async def test_meta(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/directives/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_list(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/directives")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_delete(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/directives/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


class TestDirectiveValidation:
    """Schema-Validierung für Patientenverfügungen."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, directive_data):
        r = await arzt_client.post("/api/v1/directives", json=directive_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/directives", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_invalid_type(self, arzt_client: AsyncClient, directive_data):
        directive_data["directive_type"] = "invalid_type"
        r = await arzt_client.post("/api/v1/directives", json=directive_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_directive_types(self, arzt_client: AsyncClient, directive_data):
        for dt in ["patientenverfuegung", "vorsorgeauftrag"]:
            directive_data["directive_type"] = dt
            r = await arzt_client.post("/api/v1/directives", json=directive_data)
            assert r.status_code != 422, f"Directive-Typ '{dt}' abgelehnt"


# ═══════════════════════════════════════════════════════════════════
# WISHES & PALLIATIVE
# ═══════════════════════════════════════════════════════════════════

class TestWishesEndpoints:
    """Patientenwünsche-Endpoints."""

    @pytest.mark.asyncio
    async def test_get_wishes(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/wishes")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_put_wishes(self, arzt_client: AsyncClient):
        r = await arzt_client.put(
            f"/api/v1/patients/{PATIENT_ID}/wishes",
            json={"comfort_measures": "Schmerztherapie priorisieren"},
        )
        assert r.status_code != 422


class TestPalliativeEndpoints:
    """Palliative-Care-Endpoints."""

    @pytest.mark.asyncio
    async def test_get_palliative(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/palliative")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_put_palliative(self, arzt_client: AsyncClient):
        r = await arzt_client.put(
            f"/api/v1/patients/{PATIENT_ID}/palliative",
            json={"symptom_management": "Morphin p.o. bei Bedarf"},
        )
        assert r.status_code != 422


# ═══════════════════════════════════════════════════════════════════
# DEATH NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════

class TestDeathNotificationEndpoints:
    """Todesfallmeldungs-Endpoints."""

    @pytest.mark.asyncio
    async def test_list(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/death-notifications")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_delete(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/death-notifications/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


class TestDeathNotificationValidation:
    """Schema-Validierung für Todesfallmeldungen."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, death_notification_data):
        r = await arzt_client.post("/api/v1/death-notifications", json=death_notification_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/death-notifications", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_contact_name(self, arzt_client: AsyncClient, death_notification_data):
        del death_notification_data["contact_name"]
        r = await arzt_client.post("/api/v1/death-notifications", json=death_notification_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, arzt_client: AsyncClient, death_notification_data):
        death_notification_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/death-notifications", json=death_notification_data)
        assert r.status_code == 422
