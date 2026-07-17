"""
Outfit Agent — assembles complete outfits from candidate products: color
matching, aesthetic coherence, occasion reasoning, accessory suggestions.
"""
from __future__ import annotations

from typing import Any

from app.models.product import Product
from app.agents.base import BaseAgent
from app.state.models import ShoppingState

_TOPWEAR = {"top", "shirt", "t-shirt", "tshirt", "blouse", "hoodie", "sweater", "jacket"}
_BOTTOMWEAR = {"jeans", "trousers", "pants", "cargo", "skirt", "shorts"}
_FOOTWEAR = {"sneakers", "shoes", "boots", "heels", "sandals"}
_ACCESSORY = {"bag", "belt", "cap", "jewelry", "watch", "scarf", "sunglasses"}

_NEUTRALS = {"white", "black", "beige", "grey", "gray", "cream", "navy", "brown"}


def _bucket(product: Product) -> str:
    sub = (product.subcategory or product.category or "").lower()
    if any(k in sub for k in _TOPWEAR):
        return "top"
    if any(k in sub for k in _BOTTOMWEAR):
        return "bottom"
    if any(k in sub for k in _FOOTWEAR):
        return "footwear"
    if any(k in sub for k in _ACCESSORY):
        return "accessory"
    return "other"


def _colors_compatible(c1: str, c2: str) -> bool:
    c1, c2 = c1.lower(), c2.lower()
    if not c1 or not c2:
        return True
    if c1 == c2:
        return True
    if c1 in _NEUTRALS or c2 in _NEUTRALS:
        return True
    return False


class OutfitAgent(BaseAgent):
    name = "Outfit Agent"

    async def run(self, state: ShoppingState) -> dict[str, Any]:
        products: list[Product] = state.get("candidate_products", [])
        owned_items = [o.lower() for o in state.get("owned_items", [])]
        num_outfits = 3  # default per the spec's worked example; could be parsed from message

        buckets: dict[str, list[Product]] = {"top": [], "bottom": [], "footwear": [], "accessory": [], "other": []}
        for p in products:
            buckets[_bucket(p)].append(p)

        # If the user already owns footwear (e.g. "white sneakers"), don't
        # re-buy it — free up more of the budget for new pieces.
        skip_footwear = any("sneaker" in o or "shoe" in o for o in owned_items)

        outfits: list[dict[str, Any]] = []
        used_ids: set[str] = set()

        for i in range(num_outfits):
            top = next((p for p in buckets["top"] if p.id not in used_ids), None)
            bottom = next(
                (
                    p
                    for p in buckets["bottom"]
                    if p.id not in used_ids and (top is None or _colors_compatible(top.color, p.color))
                ),
                None,
            )
            footwear = None
            if not skip_footwear:
                footwear = next((p for p in buckets["footwear"] if p.id not in used_ids), None)
            accessory = next((p for p in buckets["accessory"] if p.id not in used_ids), None)

            pieces = [p for p in [top, bottom, footwear, accessory] if p is not None]
            if not pieces:
                break
            for p in pieces:
                used_ids.add(p.id)

            outfits.append(
                {
                    "outfit_number": i + 1,
                    "product_ids": [p.id for p in pieces],
                    "pieces": {
                        "top": top.id if top else None,
                        "bottom": bottom.id if bottom else None,
                        "footwear": footwear.id if footwear else ("owned" if skip_footwear else None),
                        "accessory": accessory.id if accessory else None,
                    },
                    "total_price": round(sum(p.final_price for p in pieces), 2),
                }
            )

        surviving_products = [p for p in products if p.id in used_ids]

        return {
            "outfits": outfits,
            "candidate_products": surviving_products or products,
            "_reasoning_summary": (
                f"Assembled {len(outfits)} outfit(s) from {len(products)} candidates, "
                f"honoring color compatibility{' and reusing owned footwear' if skip_footwear else ''}."
            ),
            "_confidence": 0.85 if outfits else 0.3,
        }
