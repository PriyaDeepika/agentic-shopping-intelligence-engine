"""
Redis client wrapper. Falls back to an in-process dict store if Redis is
unreachable or `redis` isn't installed, so local dev/tests never hard-depend
on infrastructure. Swap in real Redis in production via REDIS_URL.
"""
from __future__ import annotations

import json
import time
from functools import lru_cache
from typing import Any

from app.utils.config import get_settings

settings = get_settings()


class _InProcessStore:
    """Dict-based fallback with TTL emulation. NOT for multi-worker deployments."""

    def __init__(self):
        self._data: dict[str, tuple[str, float | None]] = {}

    def get(self, key: str) -> str | None:
        item = self._data.get(key)
        if item is None:
            return None
        value, expires_at = item
        if expires_at is not None and time.time() > expires_at:
            del self._data[key]
            return None
        return value

    def set(self, key: str, value: str, ex: int | None = None) -> None:
        expires_at = time.time() + ex if ex else None
        self._data[key] = (value, expires_at)

    def delete(self, key: str) -> None:
        self._data.pop(key, None)

    def keys(self, pattern: str) -> list[str]:
        prefix = pattern.rstrip("*")
        return [k for k in self._data if k.startswith(prefix)]


class RedisMemoryClient:
    def __init__(self):
        self._client = None
        self._fallback = _InProcessStore()
        try:
            import redis

            self._client = redis.Redis.from_url(settings.redis_url, decode_responses=True)
            self._client.ping()
        except Exception:  # noqa: BLE001
            self._client = None  # use fallback silently

    def get_json(self, key: str) -> dict[str, Any] | None:
        raw = self._client.get(key) if self._client else self._fallback.get(key)
        if raw is None:
            return None
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            return None

    def set_json(self, key: str, value: dict[str, Any], ttl: int | None = None) -> None:
        raw = json.dumps(value, default=str)
        ttl = ttl if ttl is not None else settings.memory_ttl_seconds
        if self._client:
            self._client.set(key, raw, ex=ttl)
        else:
            self._fallback.set(key, raw, ex=ttl)

    def delete(self, key: str) -> None:
        if self._client:
            self._client.delete(key)
        else:
            self._fallback.delete(key)

    def keys(self, pattern: str) -> list[str]:
        if self._client:
            return list(self._client.keys(pattern))
        return self._fallback.keys(pattern)


@lru_cache
def get_redis_client() -> RedisMemoryClient:
    return RedisMemoryClient()
