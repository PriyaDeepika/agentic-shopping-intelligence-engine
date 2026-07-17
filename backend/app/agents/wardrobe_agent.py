"""
Wardrobe Agent — understands a user's existing wardrobe, detects duplicate
purchases, recommends complementary items, and maintains wardrobe memory.
"""
from __future__ import annotations

from typing import Any

from app.agents.base import BaseAgent
from app.retrieval.faiss_index import get_product_index
from app.state.models import ShoppingState

_COMPLEMENT_MAP = {
    "top": ["bottom", "footwear"],
    "bottom": ["top", "footwear"],
    "footwear": ["top", "bottom"],
    "outerwear": ["top", "bottom"],
}


class WardrobeAgent(BaseAgent):
    name = "Wardrobe Agent"

    async def run(self, state: ShoppingState) -> dict[str, Any]:
        wardrobe = state.get("wardrobe", []) or []
        candidate_products = state.get("candidate_products", [])

        owned_names = {w.get("name", "").lower() for w in wardrobe}
        duplicate_warnings = [
            f"You already own something similar to '{p.name}'."
            for p in candidate_products
            if p.name.lower() in owned_names
        ]

        index = get_product_index()
        complementary: list[Any] = []
        seen_ids = set()
        for w in wardrobe:
            query = f"{w.get('color', '')} {w.get('category', '')} {' '.join(w.get('tags', []))}".strip()
            if not query:
                continue
            for product, _score in index.search(query, top_k=3):
                if product.id not in seen_ids and product.name.lower() not in owned_names:
                    complementary.append(product)
                    seen_ids.add(product.id)

        return {
            "wardrobe": wardrobe,
            "candidate_products": complementary[:10] or candidate_products,
            "_reasoning_summary": (
                f"Cross-referenced {len(wardrobe)} wardrobe item(s); found "
                f"{len(duplicate_warnings)} potential duplicate(s) and "
                f"{len(complementary)} complementary suggestion(s)."
            ),
            "_confidence": 0.8,
            "duplicate_warnings": duplicate_warnings,
        }
