"""
Cart Agent — the single source of truth for the shopping cart. Maintains the
cart, applies swaps/removals/quantity changes, and tracks running totals and
budget status.

Supports delta-only updates ("remove jeans, replace with cargo") so the
orchestrator doesn't have to recompute the entire shopping plan for small
edits, per the spec's STATE MANAGEMENT requirement.
"""
from __future__ import annotations

from typing import Any

from app.models.product import Product
from app.retrieval.product_loader import get_product_by_id
from app.agents.base import BaseAgent
from app.state.models import ShoppingState


def _recompute_cart(items: list[dict[str, Any]], budget: float | None, best_coupon_savings: float = 0.0) -> dict[str, Any]:
    subtotal = sum(i["product"]["price"] * i["quantity"] for i in items)
    discount_total = sum(
        i["product"]["price"] * i["product"].get("discount", 0.0) * i["quantity"] for i in items
    ) + best_coupon_savings
    total = round(max(subtotal - discount_total, 0.0), 2)
    return {
        "items": items,
        "subtotal": round(subtotal, 2),
        "discount_total": round(discount_total, 2),
        "total": total,
        "budget": budget,
        "over_budget": budget is not None and total > budget,
    }


class CartAgent(BaseAgent):
    name = "Cart Agent"

    async def run(self, state: ShoppingState) -> dict[str, Any]:
        budget = state.get("budget")
        best_coupon_savings = max((c.get("savings", 0.0) for c in state.get("coupons", [])), default=0.0)
        existing_cart = state.get("cart") or {"items": []}
        items = list(existing_cart.get("items", []))

        # Delta path: targeted single-item modification.
        if state.get("delta_only"):
            action = (state.get("constraints") or {}).get("cart_action", "add")
            target_id = (state.get("constraints") or {}).get("product_id")
            replacement_id = (state.get("constraints") or {}).get("replacement_product_id")
            quantity = (state.get("constraints") or {}).get("quantity")

            if action == "remove" and target_id:
                items = [i for i in items if i["product"]["id"] != target_id]
            elif action == "swap" and target_id and replacement_id:
                new_product = get_product_by_id(replacement_id)
                if new_product:
                    items = [
                        {"product": new_product.model_dump(), "quantity": i["quantity"]}
                        if i["product"]["id"] == target_id
                        else i
                        for i in items
                    ]
            elif action in ("increase_quantity", "decrease_quantity") and target_id:
                delta = quantity or 1
                delta = delta if action == "increase_quantity" else -delta
                for i in items:
                    if i["product"]["id"] == target_id:
                        i["quantity"] = max(1, i["quantity"] + delta)
            elif action == "add" and target_id:
                new_product = get_product_by_id(target_id)
                if new_product and not any(i["product"]["id"] == target_id for i in items):
                    items.append({"product": new_product.model_dump(), "quantity": quantity or 1})

            cart = _recompute_cart(items, budget, best_coupon_savings)
            return {
                "cart": cart,
                "_reasoning_summary": f"Applied delta action '{action}' without recomputing the full plan.",
                "_confidence": 0.95,
            }

        # Full path: rebuild the cart from the optimized product list.
        products: list[Product] = state.get("optimized_products") or state.get("candidate_products", [])
        items = [{"product": p.model_dump(), "quantity": 1} for p in products]
        cart = _recompute_cart(items, budget, best_coupon_savings)

        return {
            "cart": cart,
            "_reasoning_summary": f"Built cart with {len(items)} item(s), total ₹{cart['total']:.0f}.",
            "_confidence": 0.9,
        }
