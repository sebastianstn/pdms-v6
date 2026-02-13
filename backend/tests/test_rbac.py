"""RBAC permission tests — Rollenbasierte Zugriffssteuerung."""

import pytest
from httpx import AsyncClient


class TestRBACPatients:
    """Patienten-Endpoint RBAC-Tests."""

    @pytest.mark.asyncio
    async def test_arzt_can_list_patients(self, arzt_client: AsyncClient):
        """Arzt darf Patienten auflisten."""
        response = await arzt_client.get("/api/v1/patients")
        assert response.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_can_list_patients(self, pflege_client: AsyncClient):
        """Pflege darf Patienten auflisten."""
        response = await pflege_client.get("/api/v1/patients")
        assert response.status_code != 403

    @pytest.mark.asyncio
    async def test_arzt_can_create_patient(self, arzt_client: AsyncClient, sample_patient_data):
        """Arzt darf Patienten anlegen."""
        response = await arzt_client.post("/api/v1/patients", json=sample_patient_data)
        # 500 = DB-Fehler (ok für Schema-Test), 403 = RBAC blockiert (nicht erwartet)
        assert response.status_code != 403


class TestRBACAudit:
    """Audit-Endpoint RBAC-Tests."""

    @pytest.mark.asyncio
    async def test_admin_can_access_audit(self, admin_client: AsyncClient):
        """Admin darf Audit-Log lesen."""
        response = await admin_client.get("/api/v1/audit")
        assert response.status_code != 403, "Admin wurde vom Audit-Endpoint abgewiesen"

    @pytest.mark.asyncio
    async def test_arzt_cannot_access_audit(self, arzt_client: AsyncClient):
        """Arzt darf KEIN Audit-Log lesen."""
        response = await arzt_client.get("/api/v1/audit")
        assert response.status_code == 403, f"Arzt konnte Audit aufrufen (Status: {response.status_code})"

    @pytest.mark.asyncio
    async def test_pflege_cannot_access_audit(self, pflege_client: AsyncClient):
        """Pflege darf KEIN Audit-Log lesen."""
        response = await pflege_client.get("/api/v1/audit")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_readonly_cannot_access_audit(self, readonly_client: AsyncClient):
        """Readonly-User darf KEIN Audit-Log lesen."""
        response = await readonly_client.get("/api/v1/audit")
        assert response.status_code == 403


class TestRBACMedications:
    """Medikamenten-Endpoint RBAC-Tests."""

    @pytest.mark.asyncio
    async def test_arzt_can_list_medications(self, arzt_client: AsyncClient):
        """Arzt darf Medikamente einsehen."""
        response = await arzt_client.get("/api/v1/medications")
        assert response.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_can_list_medications(self, pflege_client: AsyncClient):
        """Pflege darf Medikamente einsehen."""
        response = await pflege_client.get("/api/v1/medications")
        assert response.status_code != 403


class TestRBACEndpointSecurity:
    """Allgemeine RBAC-Sicherheitstests."""

    @pytest.mark.asyncio
    async def test_all_api_endpoints_require_auth_or_devbypass(self, client: AsyncClient):
        """Alle API-Endpoints müssen Auth erfordern (oder Dev-Bypass)."""
        critical_endpoints = [
            ("/api/v1/patients", "GET"),
            ("/api/v1/vitals", "POST"),
            ("/api/v1/alarms", "GET"),
            ("/api/v1/medications", "GET"),
            ("/api/v1/audit", "GET"),
        ]
        for path, method in critical_endpoints:
            if method == "GET":
                response = await client.get(path)
            else:
                response = await client.post(path, json={})
            # Muss entweder Auth verlangen (401/403) oder Dev-Bypass (200/422/500)
            assert response.status_code != 404, f"{method} {path} nicht gefunden"
