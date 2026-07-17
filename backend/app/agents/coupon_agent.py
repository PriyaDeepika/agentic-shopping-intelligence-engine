"""
Coupon Agent — finds coupons, offers, and bundle discounts and calculates
best checkout savings.

In production this would call a real coupon/offers service. Here it applies a
deterministic, explainable rule set so the whole pipeline is runnable and
testable without an external offers API.
"""
from __future__ import annotations

from typing import Any

from app.models.product import Product
from app.agents.base import BaseAgent
from app.state.models import ShoppingState

_BUNDLE_THRESHOLD_ITEMS = 3
_BUNDLE_DISCOUNT = 0.10
_BRAND_LOYALTY_DISCOUNT = 0.05
_FIRST_TIME_FLAT = 100.0


class CouponAgent(BaseAgent):
    name = "Coupon Agent"

    async def run(self, state: ShoppingState) -> dict[str, Any]:
        products: list[Product] = state.get("optimized_products") or state.get("candidate_products", [])
        favorite_brands = set((state.get("memory") or {}).get("favorite_brands", []))

        subtotal = sum(p.final_price for p in products)
        coupons: list[dict[str, Any]] = []

        if len(products) >= _BUNDLE_THRESHOLD_ITEMS:
            coupons.append(
                {
                    "code": "BUNDLE10",
                    "type": "bundle",
                    "description": f"{int(_BUNDLE_DISCOUNT * 100)}% off for {_BUNDLE_THRESHOLD_ITEMS}+ items",
                    "savings": round(subtotal * _BUNDLE_DISCOUNT, 2),
                }
            )

        brand_matches = {p.brand for p in products if p.brand in favorite_brands}
        if brand_matches:
            coupons.append(
                {
                    "code": "LOYALTY5",
                    "type": "brand_loyalty",
                    "description": f"5% loyalty discount on {', '.join(brand_matches)}",
                    "savings": round(subtotal * _BRAND_LOYALTY_DISCOUNT, 2),
                }
            )

        coupons.append(
            {
                "code": "WELCOME100",
                "type": "flat",
                "description": "Flat ₹100 off checkout",
                "savings": _FIRST_TIME_FLAT,
            }
        )

        best_savings = max((c["savings"] for c in coupons), default=0.0)

        return {
            "coupons": coupons,
            "_reasoning_summary": (
                f"Evaluated {len(coupons)} offer(s) against a ₹{subtotal:.0f} subtotal; "
                f"best single savings ₹{best_savings:.0f}."
            ),
            "_confidence": 0.75,
        }
