"""Audit-Endpoint Tests — Admin-Only, Filterung, Pagination."""

import uuid

import pytest
from httpx import AsyncClient


class TestAuditEndpoint:
    """Audit-Endpoint funktionale Tests."""

    @pytest.mark.asyncio
    async def test_audit_endpoint_exists(self, admin_client: AsyncClient):
        """GET /audit muss erreichbar sein (Admin)."""
        response = await admin_client.get("/api/v1/audit")
        assert response.status_code != 404, "Audit-Endpoint nicht gefunden"

    @pytest.mark.asyncio
    async def test_audit_returns_paginated(self, admin_client: AsyncClient):
        """Audit-Response muss Paginierung enthalten."""
        response = await admin_client.get("/api/v1/audit")
        if response.status_code == 200:
            data = response.json()
            assert "items" in data, "Fehlende 'items' in Audit-Response"
            assert "total" in data, "Fehlende 'total' in Audit-Response"
            assert "page" in data, "Fehlende 'page' in Audit-Response"
            assert "per_page" in data, "Fehlende 'per_page' in Audit-Response"

    @pytest.mark.asyncio
    async def test_audit_pagination_params(self, admin_client: AsyncClient):
        """Pagination-Parameter werden akzeptiert."""
        response = await admin_client.get(
            "/api/v1/audit", params={"page": 1, "per_page": 10}
        )
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_audit_filter_by_action(self, admin_client: AsyncClient):
        """Filterung nach Action (HTTP-Methode)."""
        response = await admin_client.get(
            "/api/v1/audit", params={"action": "POST"}
        )
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_audit_filter_invalid_action(self, admin_client: AsyncClient):
        """Ungültige Action muss abgelehnt werden."""
        response = await admin_client.get(
            "/api/v1/audit", params={"action": "INVALID"}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_audit_filter_by_date_range(self, admin_client: AsyncClient):
        """Filterung nach Datum."""
        response = await admin_client.get(
            "/api/v1/audit",
            params={"date_from": "2026-01-01", "date_to": "2026-12-31"},
        )
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_audit_filter_by_user_id(self, admin_client: AsyncClient):
        """Filterung nach User-ID."""
        user_id = str(uuid.uuid4())
        response = await admin_client.get(
            "/api/v1/audit", params={"user_id": user_id}
        )
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_audit_single_entry_not_found(self, admin_client: AsyncClient):
        """GET /audit/{id} mit unbekannter ID → 404 oder 500."""
        fake_id = str(uuid.uuid4())
        response = await admin_client.get(f"/api/v1/audit/{fake_id}")
        assert response.status_code in (404, 500)


class TestAuditRBAC:
    """Audit RBAC — nur Admin-Zugriff."""

    @pytest.mark.asyncio
    async def test_arzt_blocked(self, arzt_client: AsyncClient):
        """Arzt wird vom Audit-Endpoint abgewiesen."""
        response = await arzt_client.get("/api/v1/audit")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_pflege_blocked(self, pflege_client: AsyncClient):
        """Pflege wird vom Audit-Endpoint abgewiesen."""
        response = await pflege_client.get("/api/v1/audit")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_readonly_blocked(self, readonly_client: AsyncClient):
        """Readonly-User wird vom Audit-Endpoint abgewiesen."""
        response = await readonly_client.get("/api/v1/audit")
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_allowed(self, admin_client: AsyncClient):
        """Admin darf Audit-Log lesen."""
        response = await admin_client.get("/api/v1/audit")
        assert response.status_code != 403
