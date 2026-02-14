"""Alarm-Tests — Schema, Endpoints, Caching."""

import uuid

import pytest
from httpx import AsyncClient

from src.domain.services.alarm_service import THRESHOLDS, _evaluate_severity


class TestAlarmEndpoints:
    """Alarm-Endpoint Erreichbarkeit."""

    @pytest.mark.asyncio
    async def test_list_alarms_endpoint_exists(self, arzt_client: AsyncClient):
        """GET /alarms muss erreichbar sein."""
        response = await arzt_client.get("/api/v1/alarms")
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_alarm_counts_endpoint_exists(self, arzt_client: AsyncClient):
        """GET /alarms/counts muss erreichbar sein."""
        response = await arzt_client.get("/api/v1/alarms/counts")
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_get_alarm_not_found(self, arzt_client: AsyncClient):
        """GET /alarms/{id} mit unbekannter ID → 404 oder 500 (DB)."""
        fake_id = str(uuid.uuid4())
        response = await arzt_client.get(f"/api/v1/alarms/{fake_id}")
        assert response.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_get_alarm_invalid_uuid(self, arzt_client: AsyncClient):
        """GET /alarms/invalid → 422."""
        response = await arzt_client.get("/api/v1/alarms/not-a-uuid")
        assert response.status_code == 422


class TestAlarmFiltering:
    """Alarm-Status-Filterung."""

    @pytest.mark.asyncio
    async def test_filter_active_alarms(self, arzt_client: AsyncClient):
        """Filterung nach status=active."""
        response = await arzt_client.get("/api/v1/alarms", params={"status": "active"})
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_filter_acknowledged_alarms(self, arzt_client: AsyncClient):
        """Filterung nach status=acknowledged."""
        response = await arzt_client.get("/api/v1/alarms", params={"status": "acknowledged"})
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_filter_resolved_alarms(self, arzt_client: AsyncClient):
        """Filterung nach status=resolved."""
        response = await arzt_client.get("/api/v1/alarms", params={"status": "resolved"})
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_filter_invalid_status(self, arzt_client: AsyncClient):
        """Filterung nach ungültigem Status → 422."""
        response = await arzt_client.get("/api/v1/alarms", params={"status": "invalid"})
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_pagination_params(self, arzt_client: AsyncClient):
        """Pagination-Parameter werden akzeptiert."""
        response = await arzt_client.get(
            "/api/v1/alarms", params={"page": 1, "per_page": 10}
        )
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_pagination_invalid_page(self, arzt_client: AsyncClient):
        """page=0 muss abgelehnt werden."""
        response = await arzt_client.get("/api/v1/alarms", params={"page": 0})
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_pagination_per_page_too_large(self, arzt_client: AsyncClient):
        """per_page über Maximum → 422."""
        response = await arzt_client.get("/api/v1/alarms", params={"per_page": 500})
        assert response.status_code == 422


class TestAlarmActions:
    """Alarm-Aktionen (Acknowledge, Resolve)."""

    @pytest.mark.asyncio
    async def test_acknowledge_not_found(self, arzt_client: AsyncClient):
        """Quittierung unbekannter Alarm → 404 oder 500."""
        fake_id = str(uuid.uuid4())
        response = await arzt_client.patch(f"/api/v1/alarms/{fake_id}/acknowledge")
        assert response.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_resolve_not_found(self, arzt_client: AsyncClient):
        """Auflösung unbekannter Alarm → 404 oder 500."""
        fake_id = str(uuid.uuid4())
        response = await arzt_client.patch(f"/api/v1/alarms/{fake_id}/resolve")
        assert response.status_code in (404, 500)


class TestAlarmThresholds:
    """Schwellenwert-Logik für Alarme."""

    def test_spo2_warning_threshold_is_90(self):
        """SpO2-Warnung muss bei Werten unter 90% greifen."""
        assert THRESHOLDS["spo2"]["warning"][0] == 90
        assert _evaluate_severity(89, THRESHOLDS["spo2"]) == "warning"
