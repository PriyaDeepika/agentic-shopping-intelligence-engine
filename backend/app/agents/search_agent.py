"""Search Agent — semantic search, filtering, ranking, similarity search."""
from __future__ import annotations

from typing import Any

from app.agents.base import BaseAgent
from app.retrieval.faiss_index import get_product_index
from app.state.models import ShoppingState


class SearchAgent(BaseAgent):
    name = "Search Agent"

    async def run(self, state: ShoppingState) -> dict[str, Any]:
        query = state.get("message", "")
        constraints = state.get("constraints", {}) or {}

        filters = {
            "max_price": state.get("budget"),
            "category": constraints.get("category"),
            "brand": constraints.get("brand"),
            "color": constraints.get("color"),
            "size": constraints.get("size"),
        }
        filters = {k: v for k, v in filters.items() if v not in (None, "", [])}

        # Exclude items the user previously rejected (from long-term memory).
        rejected = set((state.get("memory") or {}).get("rejected_products", []))

        index = get_product_index()
        results = index.search(query, top_k=30, filters=filters)
        products = [p for p, _score in results if p.id not in rejected][:20]

        return {
            "candidate_products": products,
            "_reasoning_summary": (
                f"Semantic search for '{query}' returned {len(products)} candidates "
                f"after applying filters {filters} and excluding {len(rejected)} rejected items."
            ),
            "_confidence": 0.9 if products else 0.4,
        }
