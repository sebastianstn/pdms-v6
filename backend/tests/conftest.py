"""Test fixtures — TestClient, DB Session, Auth Mock."""

import uuid
from collections.abc import AsyncGenerator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app
from src.infrastructure.keycloak import get_current_user
from src.infrastructure.database import get_db


# ── User Fixtures ───────────────────────────────────────────────────

def _make_user(
    role: str = "arzt",
    username: str = "dr.test",
    extra_roles: list[str] | None = None,
) -> dict[str, Any]:
    """Create a mock Keycloak JWT payload."""
    roles = [role] + (extra_roles or [])
    return {
        "sub": str(uuid.uuid4()),
        "preferred_username": username,
        "email": f"{username}@pdms.local",
        "name": f"Dr. {username.title()}",
        "realm_access": {"roles": roles},
    }


@pytest.fixture
def mock_user() -> dict[str, Any]:
    """Mock Keycloak JWT payload (Arzt-Rolle)."""
    return _make_user("arzt", "dr.test")


@pytest.fixture
def mock_admin_user() -> dict[str, Any]:
    """Mock Admin-User."""
    return _make_user("admin", "admin.test", extra_roles=["arzt", "pflege"])


@pytest.fixture
def mock_pflege_user() -> dict[str, Any]:
    """Mock Pflege-User."""
    return _make_user("pflege", "pflege.test")


@pytest.fixture
def mock_readonly_user() -> dict[str, Any]:
    """Mock Readonly-User (keine spezielle Rolle)."""
    return _make_user("readonly", "readonly.test")


# ── Authenticated Client Fixtures ───────────────────────────────────

@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async test client for FastAPI app (no auth — only for /health etc.)."""
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def arzt_client(mock_user) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated client with Arzt role."""
    async def _override_user():
        return mock_user

    app.dependency_overrides[get_current_user] = _override_user
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
async def admin_client(mock_admin_user) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated client with Admin role."""
    async def _override_user():
        return mock_admin_user

    app.dependency_overrides[get_current_user] = _override_user
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
async def pflege_client(mock_pflege_user) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated client with Pflege role."""
    async def _override_user():
        return mock_pflege_user

    app.dependency_overrides[get_current_user] = _override_user
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture
async def readonly_client(mock_readonly_user) -> AsyncGenerator[AsyncClient, None]:
    """Authenticated client with Readonly role (kein arzt/pflege/admin)."""
    async def _override_user():
        return mock_readonly_user

    app.dependency_overrides[get_current_user] = _override_user
    transport = ASGITransport(app=app, raise_app_exceptions=False)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.pop(get_current_user, None)


# ── DB Mock Fixtures ────────────────────────────────────────────────

@pytest.fixture
def mock_db_session():
    """Mock AsyncSession für Unit-Tests ohne echte DB."""
    session = AsyncMock()
    session.commit = AsyncMock()
    session.flush = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    return session


@pytest.fixture(autouse=True)
async def override_db_dependency():
    """Override get_db um asyncpg-Verbindungsprobleme in Tests zu vermeiden.

    Mock-DB gibt leere Resultate zurück, damit Services mehr Code durchlaufen.
    List-Endpoints → leere Listen (200), Get-by-ID → None (404).
    """
    async def _mock_get_db():
        # Mock Result für execute()-Aufrufe
        mock_result = MagicMock()
        mock_result.scalar.return_value = 0
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalars.return_value = MagicMock(
            all=MagicMock(return_value=[]),
            first=MagicMock(return_value=None),
        )
        mock_result.fetchall.return_value = []
        mock_result.fetchone.return_value = None
        mock_result.first.return_value = None
        mock_result.all.return_value = []
        mock_result.unique.return_value = mock_result

        session = AsyncMock()
        session.execute = AsyncMock(return_value=mock_result)
        session.get = AsyncMock(return_value=None)
        session.scalar = AsyncMock(return_value=0)
        session.scalars = AsyncMock(return_value=MagicMock(
            all=MagicMock(return_value=[]),
            first=MagicMock(return_value=None),
        ))
        session.commit = AsyncMock()
        session.rollback = AsyncMock()
        session.flush = AsyncMock()
        session.close = AsyncMock()
        session.add = MagicMock()
        session.delete = MagicMock()
        session.refresh = AsyncMock()
        session.begin = MagicMock()
        session.begin_nested = MagicMock()
        yield session

    app.dependency_overrides[get_db] = _mock_get_db
    yield
    app.dependency_overrides.pop(get_db, None)


# ── Sample Data ─────────────────────────────────────────────────────

@pytest.fixture
def sample_patient_data() -> dict:
    """Gültige Patient-Erstellungsdaten."""
    return {
        "first_name": "Max",
        "last_name": "Muster",
        "date_of_birth": "1990-05-15",
        "gender": "male",
        "ahv_number": "756.1234.5678.90",
        "blood_type": "A+",
        "phone": "+41 79 123 45 67",
        "email": "max.muster@example.ch",
        "address_street": "Bahnhofstrasse 1",
        "address_zip": "8001",
        "address_city": "Zürich",
        "address_canton": "ZH",
        "language": "de",
    }


@pytest.fixture
def sample_vital_data() -> dict:
    """Gültige Vitalparameter-Daten."""
    return {
        "patient_id": str(uuid.uuid4()),
        "heart_rate": 72,
        "systolic_bp": 120,
        "diastolic_bp": 80,
        "spo2": 98.0,
        "temperature": 36.6,
        "respiratory_rate": 16,
    }


@pytest.fixture
def sample_vital_data_critical() -> dict:
    """Kritische Vitalparameter (sollten Alarm auslösen)."""
    return {
        "patient_id": str(uuid.uuid4()),
        "heart_rate": 180,       # Tachykardie
        "systolic_bp": 220,      # Hypertensive Krise
        "diastolic_bp": 130,     # Hypertensive Krise
        "spo2": 85.0,            # Hypoxie
        "temperature": 40.5,     # Hohes Fieber
        "respiratory_rate": 35,  # Tachypnoe
    }

