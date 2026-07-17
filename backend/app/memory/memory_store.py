"""
Long-term shopping memory.

Remembers, per user_id, across sessions:
  budget, favorite_brands, favorite_colors, sizes, rejected_products,
  wardrobe, preferences, conversation_summaries.

Backed by Redis (or in-process fallback) so memory survives multiple
conversations, per the spec's MEMORY section.
"""
from __future__ import annotations

from typing import Any

from app.memory.redis_client import get_redis_client

_DEFAULT_MEMORY: dict[str, Any] = {
    "budget": None,
    "favorite_brands": [],
    "favorite_colors": [],
    "sizes": {},
    "rejected_products": [],
    "wardrobe": [],
    "preferences": {},
    "conversation_summaries": [],
}


def _key(user_id: str) -> str:
    return f"ase:memory:{user_id}"


class MemoryStore:
    def __init__(self):
        self.client = get_redis_client()

    def get(self, user_id: str) -> dict[str, Any]:
        data = self.client.get_json(_key(user_id))
        if data is None:
            return dict(_DEFAULT_MEMORY)
        merged = dict(_DEFAULT_MEMORY)
        merged.update(data)
        return merged

    def update(self, user_id: str, patch: dict[str, Any]) -> dict[str, Any]:
        current = self.get(user_id)
        for k, v in patch.items():
            if isinstance(v, list) and isinstance(current.get(k), list):
                # merge lists, de-duplicated, preserving order
                merged_list = current[k] + [x for x in v if x not in current[k]]
                current[k] = merged_list
            elif isinstance(v, dict) and isinstance(current.get(k), dict):
                current[k] = {**current[k], **v}
            else:
                current[k] = v
        self.client.set_json(_key(user_id), current)
        return current

    def remember_rejection(self, user_id: str, product_id: str) -> None:
        self.update(user_id, {"rejected_products": [product_id]})

    def remember_preferences_from_state(self, user_id: str, state: dict[str, Any]) -> None:
        patch: dict[str, Any] = {}
        if state.get("budget") is not None:
            patch["budget"] = state["budget"]
        if state.get("aesthetic"):
            patch["preferences"] = {"aesthetic": state["aesthetic"]}
        if state.get("owned_items"):
            patch["wardrobe"] = list(state["owned_items"])
        if patch:
            self.update(user_id, patch)

    def clear(self, user_id: str) -> None:
        self.client.delete(_key(user_id))


_store: MemoryStore | None = None


def get_memory_store() -> MemoryStore:
    global _store
    if _store is None:
        _store = MemoryStore()
    return _store
