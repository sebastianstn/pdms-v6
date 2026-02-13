"""Clinical Notes Tests — Klinische Notizen: Schema, Endpoints, RBAC."""

import uuid

import pytest
from httpx import AsyncClient


PATIENT_ID = str(uuid.uuid4())


@pytest.fixture
def note_data() -> dict:
    """Gültige klinische Notiz."""
    return {
        "patient_id": PATIENT_ID,
        "note_type": "progress_note",
        "title": "Täglicher Verlauf",
        "content": "Patient stabil, Vitalzeichen unauffällig.",
    }


# ── Endpoint-Erreichbarkeit ───────────────────────────────────────

class TestClinicalNoteEndpoints:
    """Tests dass Clinical-Note-Endpoints existieren."""

    @pytest.mark.asyncio
    async def test_meta_endpoint(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/clinical-notes/meta")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_list_notes(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/patients/{PATIENT_ID}/clinical-notes")
        assert r.status_code != 404

    @pytest.mark.asyncio
    async def test_get_note_not_found(self, arzt_client: AsyncClient):
        r = await arzt_client.get(f"/api/v1/clinical-notes/{uuid.uuid4()}")
        assert r.status_code in (404, 500)

    @pytest.mark.asyncio
    async def test_get_note_invalid_uuid(self, arzt_client: AsyncClient):
        r = await arzt_client.get("/api/v1/clinical-notes/not-a-uuid")
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_finalize_endpoint_exists(self, arzt_client: AsyncClient):
        r = await arzt_client.post(
            f"/api/v1/clinical-notes/{uuid.uuid4()}/finalize", json={}
        )
        assert r.status_code != 405  # Route existiert (404 = Notiz nicht gefunden)

    @pytest.mark.asyncio
    async def test_cosign_endpoint_exists(self, arzt_client: AsyncClient):
        r = await arzt_client.post(
            f"/api/v1/clinical-notes/{uuid.uuid4()}/co-sign", json={}
        )
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_amend_endpoint_exists(self, arzt_client: AsyncClient):
        r = await arzt_client.post(
            f"/api/v1/clinical-notes/{uuid.uuid4()}/amend"
        )
        assert r.status_code != 405

    @pytest.mark.asyncio
    async def test_delete_endpoint_exists(self, arzt_client: AsyncClient):
        r = await arzt_client.delete(f"/api/v1/clinical-notes/{uuid.uuid4()}")
        assert r.status_code in (404, 500)


# ── Schema-Validierung ────────────────────────────────────────────

class TestClinicalNoteValidation:
    """Schema-Validierung für klinische Notizen."""

    @pytest.mark.asyncio
    async def test_create_valid(self, arzt_client: AsyncClient, note_data):
        r = await arzt_client.post("/api/v1/clinical-notes", json=note_data)
        assert r.status_code != 422, f"Schema rejected: {r.json()}"

    @pytest.mark.asyncio
    async def test_create_empty_body(self, arzt_client: AsyncClient):
        r = await arzt_client.post("/api/v1/clinical-notes", json={})
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_content(self, arzt_client: AsyncClient, note_data):
        del note_data["content"]
        r = await arzt_client.post("/api/v1/clinical-notes", json=note_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_missing_title(self, arzt_client: AsyncClient, note_data):
        del note_data["title"]
        r = await arzt_client.post("/api/v1/clinical-notes", json=note_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_create_invalid_note_type(self, arzt_client: AsyncClient, note_data):
        note_data["note_type"] = "invalid_type"
        r = await arzt_client.post("/api/v1/clinical-notes", json=note_data)
        assert r.status_code == 422

    @pytest.mark.asyncio
    async def test_all_note_types(self, arzt_client: AsyncClient, note_data):
        """Alle gültigen note_types müssen akzeptiert werden."""
        valid_types = [
            "progress_note", "admission_note", "discharge_summary",
            "consultation", "procedure_note", "handoff",
        ]
        for nt in valid_types:
            note_data["note_type"] = nt
            r = await arzt_client.post("/api/v1/clinical-notes", json=note_data)
            assert r.status_code != 422, f"Note type '{nt}' abgelehnt"

    @pytest.mark.asyncio
    async def test_create_invalid_patient_uuid(self, arzt_client: AsyncClient, note_data):
        note_data["patient_id"] = "not-a-uuid"
        r = await arzt_client.post("/api/v1/clinical-notes", json=note_data)
        assert r.status_code == 422


# ── RBAC ──────────────────────────────────────────────────────────

class TestClinicalNoteRBAC:
    """RBAC für klinische Notizen — nur Arzt/Admin dürfen schreiben."""

    @pytest.mark.asyncio
    async def test_arzt_can_create(self, arzt_client: AsyncClient, note_data):
        r = await arzt_client.post("/api/v1/clinical-notes", json=note_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_admin_can_create(self, admin_client: AsyncClient, note_data):
        r = await admin_client.post("/api/v1/clinical-notes", json=note_data)
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_cannot_create(self, pflege_client: AsyncClient, note_data):
        r = await pflege_client.post("/api/v1/clinical-notes", json=note_data)
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_readonly_cannot_create(self, readonly_client: AsyncClient, note_data):
        r = await readonly_client.post("/api/v1/clinical-notes", json=note_data)
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_pflege_can_read(self, pflege_client: AsyncClient):
        r = await pflege_client.get(f"/api/v1/patients/{PATIENT_ID}/clinical-notes")
        assert r.status_code != 403

    @pytest.mark.asyncio
    async def test_pflege_cannot_delete(self, pflege_client: AsyncClient):
        r = await pflege_client.delete(f"/api/v1/clinical-notes/{uuid.uuid4()}")
        assert r.status_code == 403

    @pytest.mark.asyncio
    async def test_pflege_cannot_finalize(self, pflege_client: AsyncClient):
        r = await pflege_client.post(
            f"/api/v1/clinical-notes/{uuid.uuid4()}/finalize", json={}
        )
        assert r.status_code == 403
