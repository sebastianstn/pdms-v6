"""Valkey (Redis-compatible) client for caching and pub/sub."""

import redis.asyncio as redis

from src.config import settings

valkey = redis.from_url(settings.valkey_url, decode_responses=True)


async def get_valkey() -> redis.Redis:
    """Dependency: yields Valkey client."""
    return valkey
