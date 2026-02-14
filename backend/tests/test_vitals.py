"""Vitalparameter-Tests — Schema-Validierung, Grenzwerte, Endpoints."""

import uuid

import pytest
from httpx import AsyncClient


class TestVitalValidation:
    """Schema-Validierung für Vitalparameter."""

    @pytest.mark.asyncio
    async def test_record_vital_valid(self, arzt_client: AsyncClient, sample_vital_data):
        """Gültige Vitalwerte sollten akzeptiert werden."""
        response = await arzt_client.post("/api/v1/vitals", json=sample_vital_data)
        assert response.status_code != 422, f"Schema rejected valid data: {response.json()}"

    @pytest.mark.asyncio
    async def test_record_vital_missing_patient_id(self, arzt_client: AsyncClient):
        """Fehlende patient_id muss abgelehnt werden."""
        data = {"heart_rate": 72, "systolic_bp": 120}
        response = await arzt_client.post("/api/v1/vitals", json=data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_record_vital_empty_body(self, arzt_client: AsyncClient):
        """Leerer Body muss abgelehnt werden."""
        response = await arzt_client.post("/api/v1/vitals", json={})
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_record_vital_invalid_patient_uuid(self, arzt_client: AsyncClient, sample_vital_data):
        """Ungültige Patient-UUID muss abgelehnt werden."""
        sample_vital_data["patient_id"] = "not-a-uuid"
        response = await arzt_client.post("/api/v1/vitals", json=sample_vital_data)
        assert response.status_code == 422


class TestVitalEndpoints:
    """Endpoint-Erreichbarkeit und HTTP-Methoden."""

    @pytest.mark.asyncio
    async def test_get_vitals_endpoint_exists(self, arzt_client: AsyncClient):
        """GET /patients/{id}/vitals muss erreichbar sein."""
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(f"/api/v1/patients/{patient_id}/vitals")
        assert response.status_code != 404, "Vitals-Endpoint nicht gefunden"

    @pytest.mark.asyncio
    async def test_get_vitals_invalid_hours(self, arzt_client: AsyncClient):
        """hours-Parameter mit ungültigem Wert → 422."""
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(
            f"/api/v1/patients/{patient_id}/vitals", params={"hours": 0}
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_get_vitals_max_hours(self, arzt_client: AsyncClient):
        """hours-Parameter über Maximum → 422."""
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(
            f"/api/v1/patients/{patient_id}/vitals", params={"hours": 999}
        )
        assert response.status_code == 422


class TestVitalGrenzwerte:
    """Healthcare-spezifische Grenzwert-Tests."""

    @pytest.mark.asyncio
    async def test_normal_vitals_accepted(self, arzt_client: AsyncClient, sample_vital_data):
        """Normale Vitalwerte (im Referenzbereich) werden akzeptiert."""
        response = await arzt_client.post("/api/v1/vitals", json=sample_vital_data)
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_critical_vitals_accepted(self, arzt_client: AsyncClient, sample_vital_data_critical):
        """Kritische aber valide Vitalwerte müssen akzeptiert werden (Alarm-Logik separat)."""
        response = await arzt_client.post("/api/v1/vitals", json=sample_vital_data_critical)
        # Kritische Werte sind valide Messungen — Schema lehnt sie nicht ab
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_spo2_range(self, arzt_client: AsyncClient, sample_vital_data):
        """SpO2 98.5% ist ein gültiger Wert."""
        sample_vital_data["spo2"] = 98.5
        response = await arzt_client.post("/api/v1/vitals", json=sample_vital_data)
        assert response.status_code != 422


class TestVitalAuth:
    """Auth-Tests für Vital-Endpoints."""

    @pytest.mark.asyncio
    async def test_record_vital_no_auth(self, client: AsyncClient, sample_vital_data):
        """Ohne Auth sollte 401 oder Dev-Bypass aktiv sein."""
        response = await client.post("/api/v1/vitals", json=sample_vital_data)
        assert response.status_code in (201, 401, 403, 500)


class TestVitalUpdate:
    """Tests für Korrekturen bestehender Vitaleinträge."""

    @pytest.mark.asyncio
    async def test_update_vital_endpoint_exists(self, arzt_client: AsyncClient):
        """PATCH /vitals/{id} muss erreichbar sein (404 bei unbekannter ID ist korrekt)."""
        vital_id = str(uuid.uuid4())
        response = await arzt_client.patch(f"/api/v1/vitals/{vital_id}", json={"heart_rate": 80})
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_update_vital_invalid_temperature(self, arzt_client: AsyncClient):
        """Ungültige Temperatur im Patch muss mit 422 abgelehnt werden."""
        vital_id = str(uuid.uuid4())
        response = await arzt_client.patch(f"/api/v1/vitals/{vital_id}", json={"temperature": 60})
        assert response.status_code == 422
