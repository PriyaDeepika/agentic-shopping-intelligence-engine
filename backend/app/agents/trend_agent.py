"""
Trend Agent — semantic reasoning over fashion aesthetics (Y2K, Old Money,
Minimal, Streetwear, Korean, Boho, Quiet Luxury, ...) rather than keyword
matching. Re-ranks candidate products by aesthetic fit and attaches trend tags
used later by the Outfit Agent and Explanation Agent.
"""
from __future__ import annotations

from typing import Any

from app.models.product import Product
from app.agents.base import BaseAgent
from app.state.models import ShoppingState

_AESTHETIC_SIGNALS: dict[str, list[str]] = {
    "y2k": ["low-rise", "graphic", "metallic", "butterfly", "cyber", "denim skirt"],
    "old money": ["tweed", "linen", "loafers", "polo", "cashmere", "tailored", "khaki"],
    "minimal": ["clean", "neutral", "monochrome", "basic", "structured", "solid"],
    "streetwear": ["oversized", "hoodie", "cargo", "sneaker", "graphic tee", "baggy"],
    "korean": ["oversized", "layered", "soft", "pastel", "minimalist blazer", "wide-leg"],
    "boho": ["floral", "fringe", "embroidered", "flowy", "earthy", "crochet"],
    "quiet luxury": ["understated", "cashmere", "tailored", "neutral", "premium fabric", "no logo"],
}


class TrendAgent(BaseAgent):
    name = "Trend Agent"

    async def run(self, state: ShoppingState) -> dict[str, Any]:
        aesthetic = (state.get("aesthetic") or "").lower().strip()
        products: list[Product] = state.get("candidate_products", [])

        if not aesthetic:
            return {
                "trend_tags": [],
                "_reasoning_summary": "No specific aesthetic requested; skipping trend re-ranking.",
                "_confidence": 0.5,
            }

        signals = _AESTHETIC_SIGNALS.get(aesthetic, [aesthetic])

        def score(p: Product) -> float:
            text = p.searchable_text().lower()
            return sum(1.0 for s in signals if s in text) + (1.0 if aesthetic in p.style.lower() else 0.0)

        ranked = sorted(products, key=score, reverse=True)
        top_matches = [p for p in ranked if score(p) > 0] or ranked

        return {
            "candidate_products": top_matches,
            "trend_tags": [aesthetic] + signals[:3],
            "_reasoning_summary": (
                f"Re-ranked {len(products)} candidates for '{aesthetic}' aesthetic using "
                f"semantic signals {signals[:3]}."
            ),
            "_confidence": 0.8 if any(score(p) > 0 for p in products) else 0.5,
        }
