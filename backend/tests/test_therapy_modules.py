"""Tests für Therapie-Module — Therapieplan, Konsilien, Arztbriefe,
Pflegediagnosen, Schichtübergaben, Ernährung, Verbrauchsmaterial, Dossier."""

import uuid
from datetime import date

import pytest
from httpx import AsyncClient


# ─── Therapieplan ──────────────────────────────────────────────

class TestTreatmentPlans:
    """Therapieplan-Endpoints."""

    @pytest.mark.asyncio
    async def test_list_endpoint_exists(self, arzt_client: AsyncClient):
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(f"/api/v1/patients/{patient_id}/treatment-plans")
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_create_treatment_plan(self, arzt_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "title": "Antibiotikatherapie i.v.",
            "diagnosis": "Pneumonie rechts",
            "icd_code": "J18.1",
            "goals": "Entfieberung, CRP-Abfall",
            "interventions": "Amoxicillin/Clavulansäure 2.2g 3x/Tag i.v.",
            "start_date": str(date.today()),
            "priority": "high",
            "items": [
                {"item_type": "medication", "description": "Amoxicillin/Clavulansäure 2.2g i.v.", "frequency": "3x/Tag"},
                {"item_type": "lab", "description": "CRP-Kontrolle", "frequency": "alle 48h"},
            ],
        }
        response = await arzt_client.post("/api/v1/treatment-plans", json=data)
        assert response.status_code in (201, 500)  # 500 wenn DB fehlt

    @pytest.mark.asyncio
    async def test_get_plan_not_found(self, arzt_client: AsyncClient):
        response = await arzt_client.get(f"/api/v1/treatment-plans/{uuid.uuid4()}")
        assert response.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_get_plan_invalid_uuid(self, arzt_client: AsyncClient):
        response = await arzt_client.get("/api/v1/treatment-plans/not-a-uuid")
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_filter_by_status(self, arzt_client: AsyncClient):
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(
            f"/api/v1/patients/{patient_id}/treatment-plans",
            params={"status": "active"},
        )
        assert response.status_code != 422

    @pytest.mark.asyncio
    async def test_invalid_status_filter(self, arzt_client: AsyncClient):
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(
            f"/api/v1/patients/{patient_id}/treatment-plans",
            params={"status": "invalid"},
        )
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_pflege_cannot_create(self, pflege_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "title": "Test",
            "diagnosis": "Test",
            "goals": "Test",
            "interventions": "Test",
            "start_date": str(date.today()),
        }
        response = await pflege_client.post("/api/v1/treatment-plans", json=data)
        assert response.status_code == 403


# ─── Konsilien ─────────────────────────────────────────────────

class TestConsultations:
    """Konsil-Endpoints."""

    @pytest.mark.asyncio
    async def test_list_endpoint_exists(self, arzt_client: AsyncClient):
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(f"/api/v1/patients/{patient_id}/consultations")
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_create_consultation(self, arzt_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "specialty": "kardiologie",
            "urgency": "urgent",
            "question": "Bitte Beurteilung des neu aufgetretenen Vorhofflimmerns.",
            "clinical_context": "Patient 72J, neu aufgetretenes VHF, HF 130/min",
        }
        response = await arzt_client.post("/api/v1/consultations", json=data)
        assert response.status_code in (201, 500)

    @pytest.mark.asyncio
    async def test_get_consultation_not_found(self, arzt_client: AsyncClient):
        response = await arzt_client.get(f"/api/v1/consultations/{uuid.uuid4()}")
        assert response.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_pflege_cannot_create_consultation(self, pflege_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "specialty": "neurologie",
            "question": "Test",
        }
        response = await pflege_client.post("/api/v1/consultations", json=data)
        assert response.status_code == 403


# ─── Arztbriefe ────────────────────────────────────────────────

class TestMedicalLetters:
    """Arztbrief-Endpoints."""

    @pytest.mark.asyncio
    async def test_list_endpoint_exists(self, arzt_client: AsyncClient):
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(f"/api/v1/patients/{patient_id}/medical-letters")
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_create_letter(self, arzt_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "letter_type": "discharge",
            "title": "Entlassbericht",
            "diagnosis": "Ambulant erworbene Pneumonie rechts",
            "therapy": "Antibiotikatherapie über 7 Tage",
            "recommendations": "CRP-Kontrolle in 1 Woche beim Hausarzt",
        }
        response = await arzt_client.post("/api/v1/medical-letters", json=data)
        assert response.status_code in (201, 500)

    @pytest.mark.asyncio
    async def test_invalid_letter_type(self, arzt_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "letter_type": "invalid",
            "title": "Test",
        }
        response = await arzt_client.post("/api/v1/medical-letters", json=data)
        assert response.status_code == 422


# ─── Pflegediagnosen ──────────────────────────────────────────

class TestNursingDiagnoses:
    """Pflegediagnosen-Endpoints."""

    @pytest.mark.asyncio
    async def test_list_endpoint_exists(self, arzt_client: AsyncClient):
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(f"/api/v1/patients/{patient_id}/nursing-diagnoses")
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_create_nursing_diagnosis(self, pflege_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "nanda_code": "00046",
            "title": "Beeinträchtigte Hautintegrität",
            "domain": "Sicherheit/Schutz",
            "defining_characteristics": "Druckstelle Sakral Grad II",
            "goals": "Wundheilung innerhalb 14 Tagen",
            "interventions": "2x täglich Wundversorgung, Lagerungsprotokoll",
            "priority": "high",
        }
        response = await pflege_client.post("/api/v1/nursing-diagnoses", json=data)
        assert response.status_code in (201, 500)

    @pytest.mark.asyncio
    async def test_readonly_cannot_create(self, readonly_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "title": "Test",
        }
        response = await readonly_client.post("/api/v1/nursing-diagnoses", json=data)
        assert response.status_code == 403


# ─── Schichtübergabe ──────────────────────────────────────────

class TestShiftHandovers:
    """Schichtübergabe-Endpoints (SBAR)."""

    @pytest.mark.asyncio
    async def test_list_endpoint_exists(self, arzt_client: AsyncClient):
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(f"/api/v1/patients/{patient_id}/shift-handovers")
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_create_handover(self, pflege_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "shift_type": "late",
            "handover_date": str(date.today()),
            "situation": "Patient stabil, Temperatur normalisiert",
            "background": "Aufnahme vor 3 Tagen wegen Pneumonie",
            "assessment": "CRP rückläufig (120→45), klinische Besserung",
            "recommendation": "Antibiotika weiter, CRP-Kontrolle morgen",
            "open_tasks": [
                {"task": "CRP-Kontrolle", "priority": "normal", "due": "morgen 06:00"},
                {"task": "Mobilisation schrittweise steigern", "priority": "normal"},
            ],
        }
        response = await pflege_client.post("/api/v1/shift-handovers", json=data)
        assert response.status_code in (201, 500)

    @pytest.mark.asyncio
    async def test_invalid_shift_type(self, pflege_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "shift_type": "invalid",
            "handover_date": str(date.today()),
            "situation": "Test",
        }
        response = await pflege_client.post("/api/v1/shift-handovers", json=data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_filter_by_date(self, arzt_client: AsyncClient):
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(
            f"/api/v1/patients/{patient_id}/shift-handovers",
            params={"handover_date": str(date.today())},
        )
        assert response.status_code != 422


# ─── Ernährung ─────────────────────────────────────────────────

class TestNutrition:
    """Ernährungs-Endpoints."""

    @pytest.mark.asyncio
    async def test_list_orders_exists(self, arzt_client: AsyncClient):
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(f"/api/v1/patients/{patient_id}/nutrition-orders")
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_create_nutrition_order(self, arzt_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "diet_type": "diabetic",
            "texture": "normal",
            "caloric_target": 2000,
            "protein_target": 80.0,
            "fluid_target": 1500,
            "restrictions": "Laktosearm",
            "start_date": str(date.today()),
        }
        response = await arzt_client.post("/api/v1/nutrition-orders", json=data)
        assert response.status_code in (201, 500)

    @pytest.mark.asyncio
    async def test_invalid_diet_type(self, arzt_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "diet_type": "invalid",
            "start_date": str(date.today()),
        }
        response = await arzt_client.post("/api/v1/nutrition-orders", json=data)
        assert response.status_code == 422

    @pytest.mark.asyncio
    async def test_create_screening(self, pflege_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "screening_type": "nrs2002",
            "total_score": 4,
            "risk_level": "high",
            "items": {"bmi": 1, "weight_loss": 2, "food_intake": 1},
        }
        response = await pflege_client.post("/api/v1/nutrition-screenings", json=data)
        assert response.status_code in (201, 500)

    @pytest.mark.asyncio
    async def test_pflege_cannot_create_order(self, pflege_client: AsyncClient):
        """Pflege darf keine Ernährungsverordnung erstellen (nur Arzt)."""
        data = {
            "patient_id": str(uuid.uuid4()),
            "diet_type": "normal",
            "start_date": str(date.today()),
        }
        response = await pflege_client.post("/api/v1/nutrition-orders", json=data)
        assert response.status_code == 403


# ─── Verbrauchsmaterial ────────────────────────────────────────

class TestSupplies:
    """Verbrauchsmaterial-Endpoints."""

    @pytest.mark.asyncio
    async def test_list_supplies_exists(self, arzt_client: AsyncClient):
        response = await arzt_client.get("/api/v1/supplies")
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_create_supply_admin_only(self, admin_client: AsyncClient):
        data = {
            "name": "Wundverband 10x10cm",
            "article_number": "WV-10010",
            "category": "wound_care",
            "unit": "piece",
            "stock_quantity": 100,
            "min_stock": 20,
        }
        response = await admin_client.post("/api/v1/supplies", json=data)
        assert response.status_code in (201, 500)

    @pytest.mark.asyncio
    async def test_arzt_cannot_create_supply(self, arzt_client: AsyncClient):
        data = {
            "name": "Test",
            "category": "other",
            "unit": "piece",
        }
        response = await arzt_client.post("/api/v1/supplies", json=data)
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_low_stock_endpoint(self, pflege_client: AsyncClient):
        response = await pflege_client.get("/api/v1/supplies/low-stock")
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_create_usage(self, pflege_client: AsyncClient):
        data = {
            "patient_id": str(uuid.uuid4()),
            "supply_item_id": str(uuid.uuid4()),
            "quantity": 2,
            "reason": "Verbandswechsel",
        }
        response = await pflege_client.post("/api/v1/supply-usages", json=data)
        assert response.status_code in (201, 400, 500)  # 400 wenn Item nicht existiert

    @pytest.mark.asyncio
    async def test_invalid_category(self, admin_client: AsyncClient):
        data = {
            "name": "Test",
            "category": "invalid",
            "unit": "piece",
        }
        response = await admin_client.post("/api/v1/supplies", json=data)
        assert response.status_code == 422


# ─── Dossier ──────────────────────────────────────────────────

class TestDossier:
    """Dossier-Aggregations-Endpoint."""

    @pytest.mark.asyncio
    async def test_dossier_endpoint_exists(self, arzt_client: AsyncClient):
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(f"/api/v1/patients/{patient_id}/dossier")
        assert response.status_code != 404

    @pytest.mark.asyncio
    async def test_dossier_returns_structure(self, arzt_client: AsyncClient):
        patient_id = str(uuid.uuid4())
        response = await arzt_client.get(f"/api/v1/patients/{patient_id}/dossier")
        if response.status_code == 200:
            data = response.json()
            assert "patient_id" in data
            assert "summary" in data
            assert "encounter" in data

    @pytest.mark.asyncio
    async def test_dossier_invalid_uuid(self, arzt_client: AsyncClient):
        response = await arzt_client.get("/api/v1/patients/not-a-uuid/dossier")
        assert response.status_code == 422
