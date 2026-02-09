"""Patient CRUD tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    """Health endpoint should return 200."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


# TODO: Add tests with mocked auth
# @pytest.mark.asyncio
# async def test_create_patient(client, mock_user):
#     ...
