"""
Budget Optimization Agent — optimizes the cart to stay below budget while
maximizing outfit quality (rating-weighted) and minimizing price. Replaces
expensive items with cheaper, comparable alternatives when over budget, and
falls back to dropping the most expensive whole outfit(s) when substitutions
alone can't close the gap (rather than silently leaving the cart over
budget with a partially-swapped set of items).
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
        # Deep-copy each outfit dict (and its product_ids list) since
        # substitutions/drops below mutate them — the original state's
        # outfits must not be touched in place.
        outfits: list[dict[str, Any]] = [
            {**o, "product_ids": list(o.get("product_ids", [])), "pieces": dict(o.get("pieces", {}))}
            for o in state.get("outfits", [])
        ]

        if budget is None:
            return {
                "optimized_products": products,
                "outfits": state.get("outfits", []),
                "_reasoning_summary": "No budget constraint provided; skipping optimization.",
                "_confidence": 0.6,
            }

        total = sum(p.final_price for p in products)
        substitutions: dict[str, str] = {}
        used_ids = {p.id for p in products}
        by_id: dict[str, Product] = {p.id: p for p in products}

        # Pass 1: greedy replace-most-expensive-first with a cheaper,
        # comparable alternative, until under budget or no more
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
                    substitutions[p.id] = alt.id
                    by_id[alt.id] = alt
                    products[idx] = alt
                    replaced = True
                    break
            if not replaced:
                break

        # Keep `outfits` consistent with the substitutions above — without
        # this, ExplanationAgent's "Completes outfit #N" tagging and any
        # outfit-count-based reply text would still reference the
        # pre-substitution product ids.
        for outfit in outfits:
            outfit["product_ids"] = [substitutions.get(pid, pid) for pid in outfit["product_ids"]]
            outfit["pieces"] = {
                slot: (substitutions.get(pid, pid) if pid else pid)
                for slot, pid in outfit["pieces"].items()
            }
            outfit["total_price"] = round(
                sum(by_id[pid].final_price for pid in outfit["product_ids"] if pid in by_id), 2
            )

        dropped_outfit_numbers: list[int] = []

        # Pass 2: if item-level substitution alone still can't close the
        # gap (common with a small catalog — there may simply be no cheaper
        # alternative left in a category), drop the most expensive *whole*
        # outfit(s) rather than leaving a partially-swapped, still-over-budget
        # cart. This is a genuine cheaper combination, not just wording.
        while total > budget and len(outfits) > 1:
            outfits.sort(key=lambda o: o["total_price"], reverse=True)
            dropped = outfits.pop(0)
            dropped_outfit_numbers.append(dropped["outfit_number"])
            dropped_ids = set(dropped["product_ids"])
            total -= sum(by_id[pid].final_price for pid in dropped_ids if pid in by_id)
            products = [p for p in products if p.id not in dropped_ids]
            used_ids -= dropped_ids

        total = round(total, 2)
        over_budget = total > budget
        gap = round(total - budget, 2) if over_budget else 0.0

        summary = (
            f"Optimized to ₹{total:.0f} against a ₹{budget:.0f} budget via "
            f"{len(substitutions)} substitution(s)"
            + (f" and dropping {len(dropped_outfit_numbers)} outfit(s)" if dropped_outfit_numbers else "")
            + "."
        )
        if over_budget:
            summary += f" No combination within budget was available in the catalog; closest match is ₹{gap:.0f} over."

        return {
            "optimized_products": products,
            "outfits": outfits,
            "_reasoning_summary": summary,
            "_confidence": 0.9 if not over_budget else 0.5,
        }
