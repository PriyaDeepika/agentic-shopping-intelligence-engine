"""
Budget Optimization Agent — optimizes the cart to stay below budget while
maximizing outfit quality (rating-weighted) and minimizing price. Replaces
expensive items with cheaper, comparable alternatives when over budget.
"""
from __future__ import annotations

from typing import Any

from app.models.product import Product
from app.agents.base import BaseAgent
from app.retrieval.product_loader import load_products
from app.state.models import ShoppingState


def _quality_score(p: Product) -> float:
    # Reward rating, lightly penalize price so cheaper-but-similar items win ties.
    return p.rating - (p.final_price / 10000.0)


def _find_cheaper_alternative(product: Product, exclude_ids: set[str]) -> Product | None:
    catalog = load_products()
    same_bucket = [
        c
        for c in catalog
        if c.id != product.id
        and c.id not in exclude_ids
        and c.category == product.category
        and (c.subcategory == product.subcategory or not product.subcategory)
        and c.final_price < product.final_price
    ]
    if not same_bucket:
        return None
    # Prefer the highest-quality option among cheaper alternatives.
    return max(same_bucket, key=_quality_score)


class BudgetAgent(BaseAgent):
    name = "Budget Agent"

    async def run(self, state: ShoppingState) -> dict[str, Any]:
        budget = state.get("budget")
        products: list[Product] = list(state.get("candidate_products", []))
        outfits = state.get("outfits", [])

        if budget is None:
            return {
                "optimized_products": products,
                "_reasoning_summary": "No budget constraint provided; skipping optimization.",
                "_confidence": 0.6,
            }

        total = sum(p.final_price for p in products)
        substitutions: list[dict[str, str]] = []
        used_ids = {p.id for p in products}

        # Greedy replace-most-expensive-first until under budget or no more
        # substitutions are possible.
        guard = 0
        while total > budget and guard < 20:
            guard += 1
            products.sort(key=lambda p: p.final_price, reverse=True)
            replaced = False
            for idx, p in enumerate(products):
                alt = _find_cheaper_alternative(p, used_ids)
                if alt:
                    total = total - p.final_price + alt.final_price
                    used_ids.discard(p.id)
                    used_ids.add(alt.id)
                    substitutions.append({"replaced": p.id, "with": alt.id})
                    products[idx] = alt
                    replaced = True
                    break
            if not replaced:
                break

        over_budget = total > budget

        return {
            "optimized_products": products,
            "_reasoning_summary": (
                f"Optimized {len(products)} items to ₹{total:.0f} against a ₹{budget:.0f} budget "
                f"via {len(substitutions)} substitution(s)."
                + (" Budget could not be fully met; consider removing an item." if over_budget else "")
            ),
            "_confidence": 0.9 if not over_budget else 0.5,
        }
