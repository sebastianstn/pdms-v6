"""Patient CRUD tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    """Health endpoint should return 200."""
    response = await client.get("/health")
    if response.status_code != 200:
        pytest.fail(f"Expected status 200, got {response.status_code}")
    data = response.json()
    if data.get("status") != "ok":
        pytest.fail(f"Expected status 'ok', got {data.get('status')!r}")


# TODO: Add tests with mocked auth
# @pytest.mark.asyncio
# async def test_create_patient(client, mock_user):
#     ...
