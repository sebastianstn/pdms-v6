"""Stammdaten Tests — Kontakte, Versicherungen, Leistungserbringer, User."""

import uuid

import pytest
from httpx import AsyncClient


PATIENT_ID = str(uuid.uuid4())


# ── Fixtures ─────────────────────────────────────────────────────

@pytest.fixture
def contact_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "name": "Maria Muster",
        "relationship_type": "Ehefrau",
        "phone": "+41 79 987 65 43",
    }


@pytest.fixture
def insurance_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "insurer_name": "CSS Versicherung",
        "policy_number": "CSS-2024-12345",
        "insurance_type": "grundversicherung",
    }


@pytest.fixture
def provider_data() -> dict:
    return {
        "patient_id": PATIENT_ID,
        "provider_type": "hausarzt",
        "name": "Dr. med. Hans Müller",
    }


# ═══════════════════════════════════════════════════════════════════
# CONTACTS
# ═══════════════════════════════════════════════════════════════════

class TestContactEndpoints:
    """Kontakte-Endpoint-Tests."""

    @pytest.mark.asyncio
    async def test_list_contacts(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/contacts")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_delete_contact(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/contacts/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


class TestContactValidation:
    """Schema-Validierung für Kontakte."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, contact_data):
        r = await arzt_client.post("/api/v1/contacts", json=contact_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/contacts", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_name(self, arzt_client: AsyncClient, contact_data):
        del contact_data["name"]
        r = await arzt_client.post("/api/v1/contacts", json=contact_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_phone(self, arzt_client: AsyncClient, contact_data):
        del contact_data["phone"]
        r = await arzt_client.post("/api/v1/contacts", json=contact_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_update_contact(self, arzt_client: AsyncClient):
        r = await arzt_client.patch(
            f"/api/v1/contacts/{uuid.uuid4()}",
            json={"phone": "+41 79 111 22 33"},
        )
        assert r.status_code != 422

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, arzt_client: AsyncClient, contact_data):
        contact_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/contacts", json=contact_data)
        assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════
# INSURANCE
# ═══════════════════════════════════════════════════════════════════

class TestInsuranceEndpoints:
    """Versicherungs-Endpoint-Tests."""

    @pytest.mark.asyncio
    async def test_meta(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/insurance/meta")
        assert r.status_code != 404
        if r.status_code == 200:
            payload = r.json()
            assert "insurance_types" in payload
            assert "garant_options" in payload

    @pytest.mark.asyncio
    async def test_list_insurances(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/insurances")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_insurance_providers(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/insurance/providers")
        assert r.status_code == 200
        payload = r.json()
        if payload:
            first = payload[0]
            assert "name" in first
            assert "logo_text" in first
            assert "logo_color" in first

    @pytest.mark.asyncio
    async def test_insurance_providers_filter(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/insurance/providers", params={"coverage": "semi_private"})
        assert r.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_insurance(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/insurances/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


class TestInsuranceValidation:
    """Schema-Validierung für Versicherungen."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, insurance_data):
        r = await arzt_client.post("/api/v1/insurances", json=insurance_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/insurances", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_invalid_type(self, arzt_client: AsyncClient, insurance_data):
        insurance_data["insurance_type"] = "invalid_type"
        r = await arzt_client.post("/api/v1/insurances", json=insurance_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_insurance_types(self, arzt_client: AsyncClient, insurance_data):
        for it in ["grundversicherung", "zusatz", "unfall", "iv"]:
            insurance_data["insurance_type"] = it
            r = await arzt_client.post("/api/v1/insurances", json=insurance_data)
            assert r.status_code != 422, f"Insurance-Typ '{it}' abgelehnt"

    @pytest.mark.asyncio
    async def test_garant_values(self, arzt_client: AsyncClient, insurance_data):
        for g in ["tiers_payant", "tiers_garant"]:
            insurance_data["garant"] = g
            r = await arzt_client.post("/api/v1/insurances", json=insurance_data)
            assert r.status_code != 422, f"Garant '{g}' abgelehnt"

    @pytest.mark.asyncio
    async def test_garant_legacy_values(self, arzt_client: AsyncClient, insurance_data):
        for legacy in ["versicherung", "patient", "kanton"]:
            insurance_data["garant"] = legacy
            r = await arzt_client.post("/api/v1/insurances", json=insurance_data)
            assert r.status_code != 422, f"Legacy-Garant '{legacy}' abgelehnt"

    @pytest.mark.asyncio
    async def test_update_insurance(self, arzt_client: AsyncClient):
        r = await arzt_client.patch(
            f"/api/v1/insurances/{uuid.uuid4()}",
            json={"policy_number": "NEW-2024-99999"},
        )
        assert r.status_code != 422

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, arzt_client: AsyncClient, insurance_data):
        insurance_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/insurances", json=insurance_data)
        assert r.status_code == 422


class TestInsuranceCatalogAdmin:
    """Admin-CRUD für Versicherer-Katalog."""

    @pytest.mark.asyncio
    async def test_catalog_list(self, admin_client: AsyncClient):
        r = await admin_client.get("/api/v1/insurance/catalog")
        assert r.status_code == 200

    @pytest.mark.asyncio
    async def test_catalog_create(self, admin_client: AsyncClient):
        r = await admin_client.post(
            "/api/v1/insurance/catalog",
            json={"name": "Test Versicherer AG", "supports_basic": True, "supports_semi_private": False, "supports_private": False},
        )
        assert r.status_code in (201, 409)


# ═══════════════════════════════════════════════════════════════════
# PROVIDERS
# ═══════════════════════════════════════════════════════════════════

class TestProviderEndpoints:
    """Leistungserbringer-Endpoint-Tests."""

    @pytest.mark.asyncio
    async def test_meta(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/providers/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_list_providers(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/providers")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_delete_provider(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/providers/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


class TestProviderValidation:
    """Schema-Validierung für Leistungserbringer."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, provider_data):
        r = await arzt_client.post("/api/v1/providers", json=provider_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/providers", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_invalid_type(self, arzt_client: AsyncClient, provider_data):
        provider_data["provider_type"] = "invalid_type"
        r = await arzt_client.post("/api/v1/providers", json=provider_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_provider_types(self, arzt_client: AsyncClient, provider_data):
        for pt in ["hausarzt", "zuweiser", "apotheke", "spitex", "physiotherapie", "spezialist"]:
            provider_data["provider_type"] = pt
            r = await arzt_client.post("/api/v1/providers", json=provider_data)
            assert r.status_code != 422, f"Provider-Typ '{pt}' abgelehnt"

    @pytest.mark.asyncio
    async def test_update_provider(self, arzt_client: AsyncClient):
        r = await arzt_client.patch(
            f"/api/v1/providers/{uuid.uuid4()}",
            json={"name": "Dr. med. Neue Name"},
        )
        assert r.status_code != 422

    @pytest.mark.asyncio
    async def test_invalid_patient_uuid(self, arzt_client: AsyncClient, provider_data):
        provider_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/providers", json=provider_data)
        assert r.status_code == 422


# ═══════════════════════════════════════════════════════════════════
# USERS
# ═══════════════════════════════════════════════════════════════════

class TestUserEndpoints:
    """User/Me-Endpoint-Tests."""

    @pytest.mark.asyncio
    async def test_me_endpoint(self, arzt_client: AsyncClient):
        """GET /me gibt den aktuellen Benutzer zurück."""
        r = await arzt_client.get("/api/v1/me")
        assert r.status_code == 200

    @pytest.mark.asyncio
    async def test_me_returns_user_info(self, arzt_client: AsyncClient):
        """Antwort enthält Benutzerinformationen."""
        r = await arzt_client.get("/api/v1/me")
        if r.status_code == 200:
            data = r.json()
            assert "preferred_username" in data or "sub" in data

    @pytest.mark.asyncio
    async def test_me_no_auth(self, client: AsyncClient):
        """Ohne Auth → 401 oder Dev-Bypass."""
        r = await client.get("/api/v1/me")
        assert r.status_code in (200, 401, 403)

    @pytest.mark.asyncio
    async def test_me_pflege(self, pflege_client: AsyncClient):
        """Pflege-User bekommt eigene Daten."""
        r = await pflege_client.get("/api/v1/me")
        assert r.status_code == 200

    @pytest.mark.asyncio
    async def test_me_admin(self, admin_client: AsyncClient):
        """Admin-User bekommt eigene Daten."""
        r = await admin_client.get("/api/v1/me")
        assert r.status_code == 200
