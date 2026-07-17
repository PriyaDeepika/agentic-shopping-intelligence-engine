"""
Recommendation Explanation Agent — generates human explanations for why each
product was selected (budget fit, aesthetic match, outfit completion, trend
alignment, etc.), per the spec's example:
"Selected because: Matches Korean fashion / Fits your budget / Works with
selected jeans / Trending aesthetic / Completes outfit."
"""
from __future__ import annotations

from typing import Any

from app.models.product import Product
from app.agents.base import BaseAgent
from app.state.models import ShoppingState


class ExplanationAgent(BaseAgent):
    name = "Explanation Agent"

    async def run(self, state: ShoppingState) -> dict[str, Any]:
        products: list[Product] = state.get("optimized_products") or state.get("candidate_products", [])
        aesthetic = state.get("aesthetic")
        budget = state.get("budget")
        trend_tags = state.get("trend_tags", [])
        outfits = state.get("outfits", [])

        outfit_by_product: dict[str, int] = {}
        for outfit in outfits:
            for pid in outfit.get("product_ids", []):
                outfit_by_product[pid] = outfit["outfit_number"]

        explanations: list[dict[str, Any]] = []
        for p in products:
            reasons: list[str] = []
            if aesthetic and (aesthetic.lower() in p.style.lower() or aesthetic.lower() in p.searchable_text().lower()):
                reasons.append(f"Matches {aesthetic} aesthetic")
            if trend_tags:
                reasons.append(f"Aligned with trending tags: {', '.join(trend_tags[:2])}")
            if budget is not None:
                reasons.append("Fits your budget" if p.final_price <= budget else "Best available option near your budget")
            if p.id in outfit_by_product:
                reasons.append(f"Completes outfit #{outfit_by_product[p.id]}")
            if p.rating >= 4.0:
                reasons.append(f"Highly rated ({p.rating}★)")
            if not reasons:
                reasons.append("Relevant to your search")

            explanations.append({"product_id": p.id, "reasons": reasons})

        return {
            "explanations": explanations,
            "_reasoning_summary": f"Generated explanations for {len(explanations)} product(s).",
            "_confidence": 0.9,
        }
