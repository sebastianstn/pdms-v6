"""Valkey (Redis-compatible) caching layer.

Provides:
- Connection lifecycle (connect / close / health check)
- Generic cache helpers: get_cached(), set_cached(), invalidate()
- Domain-specific helpers: cached_patient(), cached_alarm_counts()
- Cache key patterns for consistent invalidation
"""

import json
import logging
from typing import Any

import redis.asyncio as redis

from src.config import settings

logger = logging.getLogger("pdms.valkey")

_pool: redis.ConnectionPool | None = None
_client: redis.Redis | None = None

# ─── TTLs (seconds) ────────────────────────────────────────────

TTL_PATIENT = 300          # 5 min — individual patient
TTL_PATIENT_LIST = 60      # 1 min — patient list (changes often)
TTL_ALARM_COUNTS = 15      # 15 sec — alarm dashboard badge
TTL_ALARM_LIST = 30        # 30 sec — alarm list
TTL_SESSION = 3600         # 1h — JWT session state


# ─── Key Patterns ──────────────────────────────────────────────

class CacheKeys:
    """Centralized cache key patterns."""

    @staticmethod
    def patient(patient_id: str) -> str:
        return f"patient:{patient_id}"

    @staticmethod
    def patient_list(page: int, per_page: int, search: str | None = None) -> str:
        s = search or ""
        return f"patients:list:{page}:{per_page}:{s}"

    @staticmethod
    def alarm_counts() -> str:
        return "alarms:counts"

    @staticmethod
    def alarm_list(status: str | None, patient_id: str | None, page: int) -> str:
        return f"alarms:list:{status or 'all'}:{patient_id or 'all'}:{page}"

    # Patterns for bulk invalidation (used with SCAN + DELETE)
    PATIENT_ALL = "patient:*"
    PATIENT_LIST_ALL = "patients:list:*"
    ALARM_ALL = "alarms:*"


# ─── Connection Lifecycle ──────────────────────────────────────


async def connect_valkey() -> redis.Redis:
    """Create connection pool and return a client."""
    global _pool, _client
    if _client is not None:
        return _client
    _pool = redis.ConnectionPool.from_url(
        settings.valkey_url,
        decode_responses=True,
        max_connections=20,
    )
    _client = redis.Redis(connection_pool=_pool)
    # Ping to verify
    await _client.ping()
    logger.info("Valkey connected (%s)", settings.valkey_url)
    return _client


async def close_valkey() -> None:
    """Gracefully close Valkey connection pool."""
    global _pool, _client
    if _client:
        await _client.aclose()
        _client = None
    if _pool:
        await _pool.aclose()
        _pool = None
    logger.info("Valkey connection closed")


async def get_valkey() -> redis.Redis:
    """FastAPI dependency: return Valkey client (creates if needed)."""
    if _client is None:
        return await connect_valkey()
    return _client


async def valkey_health() -> dict[str, Any]:
    """Health check for Valkey."""
    try:
        client = await get_valkey()
        info = await client.info("server")
        return {
            "status": "ok",
            "version": info.get("redis_version", "unknown"),
            "connected_clients": info.get("connected_clients", 0),
        }
    except Exception as exc:
        return {"status": "error", "detail": str(exc)}


# ─── Generic Cache Helpers ─────────────────────────────────────


async def get_cached(key: str) -> Any | None:
    """Get a value from cache. Returns None on miss or error."""
    try:
        client = await get_valkey()
        raw = await client.get(key)
        if raw is not None:
            logger.debug("Cache HIT: %s", key)
            return json.loads(raw)
        logger.debug("Cache MISS: %s", key)
        return None
    except Exception as exc:
        logger.warning("Valkey get failed (%s): %s", key, exc)
        return None


async def set_cached(key: str, value: Any, ttl: int = 300) -> None:
    """Store a value in cache with TTL."""
    try:
        client = await get_valkey()
        await client.set(key, json.dumps(value, default=str), ex=ttl)
        logger.debug("Cache SET: %s (ttl=%ds)", key, ttl)
    except Exception as exc:
        logger.warning("Valkey set failed (%s): %s", key, exc)


async def invalidate(*patterns: str) -> int:
    """Delete cache keys matching patterns (supports wildcards via SCAN).

    Returns number of keys deleted.
    """
    deleted = 0
    try:
        client = await get_valkey()
        for pattern in patterns:
            if "*" in pattern:
                # Use SCAN for wildcard patterns
                async for key in client.scan_iter(match=pattern, count=100):
                    await client.delete(key)
                    deleted += 1
            else:
                result = await client.delete(pattern)
                deleted += result
        if deleted:
            logger.debug("Cache INVALIDATED: %d keys for %s", deleted, patterns)
    except Exception as exc:
        logger.warning("Valkey invalidate failed (%s): %s", patterns, exc)
    return deleted
