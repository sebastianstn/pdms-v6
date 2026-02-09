"""Test fixtures — TestClient, DB Session, Auth Mock."""

import uuid
from typing import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

from src.main import app


@pytest.fixture
def mock_user() -> dict:
    """Mock Keycloak JWT payload."""
    return {
        "sub": str(uuid.uuid4()),
        "preferred_username": "dr.test",
        "email": "dr.test@pdms.local",
        "name": "Dr. Test",
        "realm_access": {"roles": ["arzt"]},
    }


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async test client for FastAPI app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
