"""
Planning step: intent classification + parameter extraction + dynamic agent
routing decision. This is deliberately NOT an agent itself — it's the
orchestrator's own reasoning, run before the graph fans out to specialist
agents, per the spec's "The orchestrator must perform planning before
execution" requirement.
"""
from __future__ import annotations

import re
from typing import Any

from app.services.llm_client import get_llm_client

_INTENT_SYSTEM_PROMPT = """You are the intent classification module of a shopping orchestrator.
Classify the user's shopping message into one of:
- build_outfits: user wants new outfit(s)/products found and assembled
- modify_cart: user wants to change an existing cart (swap/remove/add item)
- adjust_budget: user wants to change the budget and re-optimize
- search_only: user just wants to browse/search products
- wardrobe_update: user is describing items they already own

Extract budget (number, no currency symbol), aesthetic/style keyword, occasion,
and any owned_items mentioned. Return strict JSON:
{"intent": "...", "budget": <number|null>, "aesthetic": "<string|null>",
 "occasion": "<string|null>", "owned_items": ["..."], "deadline": "<string|null>"}
"""

_BUDGET_RE = re.compile(
    r"(?:₹|rs\.?|inr)\s?([\d,]+)"
    r"|([\d,]+)\s?(?:rupees|rs\.?)"
    r"|budget(?:\s+of)?\s*(?:is|:)?\s*(?:₹|rs\.?|inr)?\s*([\d,]+)",
    re.IGNORECASE,
)
_AESTHETIC_KEYWORDS = [
    "y2k", "old money", "minimal", "streetwear", "korean", "boho", "quiet luxury",
]
_MODIFY_KEYWORDS = ["remove", "replace", "swap", "delete", "add more", "increase", "decrease"]
_BUDGET_ADJUST_KEYWORDS = ["reduce budget", "increase budget", "lower budget", "raise budget", "change budget"]


async def classify_and_extract(message: str, prior_state: dict[str, Any] | None = None) -> dict[str, Any]:
    """
    Hybrid approach: fast deterministic regex/keyword pass first (cheap, no
    LLM round-trip, and reliable for structured asks), falling back to the LLM
    for anything ambiguous. This keeps latency low for the common case while
    staying robust for free-form phrasing.
    """
    prior_state = prior_state or {}
    lower = message.lower()

    result: dict[str, Any] = {
        "intent": None,
        "budget": None,
        "aesthetic": None,
        "occasion": None,
        "owned_items": [],
        "deadline": None,
    }

    budget_match = _BUDGET_RE.search(message)
    if budget_match:
        raw = (
            budget_match.group(1) or budget_match.group(2) or budget_match.group(3) or ""
        ).replace(",", "")
        if raw.isdigit():
            result["budget"] = float(raw)

    for kw in _AESTHETIC_KEYWORDS:
        if kw in lower:
            result["aesthetic"] = kw.title()
            break

    if "monday" in lower or "delivery before" in lower:
        m = re.search(r"before\s+(\w+)", lower)
        result["deadline"] = m.group(1) if m else None

    owned = re.findall(r"i (?:already )?own ([a-zA-Z\s]+?)(?:\.|,|$)", lower)
    if owned:
        result["owned_items"] = [o.strip() for o in owned]

    if any(kw in lower for kw in _BUDGET_ADJUST_KEYWORDS):
        result["intent"] = "adjust_budget"
    elif any(kw in lower for kw in _MODIFY_KEYWORDS) and prior_state.get("cart", {}).get("items"):
        result["intent"] = "modify_cart"
    elif "wardrobe" in lower or "i own" in lower:
        result["intent"] = "wardrobe_update"
    elif "outfit" in lower or "outfits" in lower or result["aesthetic"]:
        result["intent"] = "build_outfits"

    if result["intent"] is None:
        # Ambiguous — fall back to the LLM.
        llm = get_llm_client()
        parsed = await llm.complete_json(_INTENT_SYSTEM_PROMPT, message)
        for k, v in parsed.items():
            if result.get(k) in (None, [], "") and v not in (None, [], ""):
                result[k] = v
        if result["intent"] is None:
            result["intent"] = "search_only"

    return result


def build_plan(intent: str) -> list[str]:
    """
    Dynamic routing decision: which agent nodes to invoke, and in what order,
    for a given intent. The orchestrator uses this to configure LangGraph's
    conditional routing at runtime — no business logic lives here, just a
    routing table.
    """
    plans = {
        "build_outfits": [
            "search_agent",
            "trend_agent",
            "outfit_agent",
            "budget_agent",
            "coupon_agent",
            "cart_agent",
            "explanation_agent",
        ],
        "modify_cart": ["cart_agent", "budget_agent", "coupon_agent", "explanation_agent"],
        "adjust_budget": ["budget_agent", "coupon_agent", "cart_agent", "explanation_agent"],
        "search_only": ["search_agent", "trend_agent"],
        "wardrobe_update": ["wardrobe_agent"],
    }
    return plans.get(intent, ["search_agent", "explanation_agent"])
