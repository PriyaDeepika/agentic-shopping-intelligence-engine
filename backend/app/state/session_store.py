"""
Session-scoped state persistence — separate from long-term user memory.

Holds the current cart, wardrobe snapshot, and last agent timeline for a
session so that follow-up turns ("remove jeans, replace with cargo") can
apply a delta instead of recomputing the whole shopping plan.
"""
from __future__ import annotations

from typing import Any

from app.memory.redis_client import get_redis_client


def _key(session_id: str) -> str:
    return f"ase:session:{session_id}"


class SessionStore:
    def __init__(self):
        self.client = get_redis_client()

    def get(self, session_id: str) -> dict[str, Any]:
        return self.client.get_json(_key(session_id)) or {
            "cart": {"items": [], "subtotal": 0.0, "discount_total": 0.0, "total": 0.0, "budget": None},
            "last_state": {},
            "agent_timeline": [],
        }

    def save(self, session_id: str, session_data: dict[str, Any]) -> None:
        self.client.set_json(_key(session_id), session_data, ttl=60 * 60 * 24 * 30)

    def clear(self, session_id: str) -> None:
        self.client.delete(_key(session_id))


_store: SessionStore | None = None


def get_session_store() -> SessionStore:
    global _store
    if _store is None:
        _store = SessionStore()
    return _store
