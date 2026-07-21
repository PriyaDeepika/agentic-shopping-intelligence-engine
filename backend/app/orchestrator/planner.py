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

# Budget extraction is split into two independent passes rather than one
# monolithic regex, because a single pattern can't reliably cover both
# "₹2000" (currency-adjacent) and "under 2000" / "below 3000" / "max 5000"
# (operator-adjacent, no currency symbol at all) at once — the previous
# single-pattern version silently returned no budget for the latter, which
# meant the budget constraint was dropped instead of respected.
_CURRENCY = r"(?:₹|rs\.?|inr|rupees?)"
_AMOUNT = r"([\d][\d,]*(?:\.\d+)?)"
_AMOUNT_WITH_CURRENCY_RE = re.compile(
    rf"(?:{_CURRENCY}\s*{_AMOUNT})|(?:{_AMOUNT}\s*{_CURRENCY})", re.IGNORECASE
)
_BARE_AMOUNT_RE = re.compile(_AMOUNT)
_BUDGET_OPERATOR_RE = re.compile(
    r"\bunder\b|\bbelow\b|\bmax(?:imum)?\b|\bup\s*to\b|\bless\s+than\b|\bwithin\b|\bbudget(?:\s+of)?\s*(?:is|:)?\b",
    re.IGNORECASE,
)
_AESTHETIC_KEYWORDS = [
    "y2k", "old money", "minimal", "streetwear", "korean", "boho", "quiet luxury",
]
_MODIFY_KEYWORDS = ["remove", "replace", "swap", "delete", "add more", "increase", "decrease"]
_BUDGET_ADJUST_KEYWORDS = ["reduce budget", "increase budget", "lower budget", "raise budget", "change budget"]


def _extract_budget(message: str) -> float | None:
    """
    Handles both orderings of currency + amount ("₹2000"/"2000 rupees") and,
    when an operator keyword is present but no currency symbol is ("under
    2000", "budget is 2500"), falls back to the first bare number in the
    message. Without this fallback, "under 2000" parsed to no budget at all.
    """
    match = _AMOUNT_WITH_CURRENCY_RE.search(message)
    if match:
        raw = (match.group(1) or match.group(2) or "").replace(",", "")
        if raw:
            try:
                return float(raw)
            except ValueError:
                pass
    if _BUDGET_OPERATOR_RE.search(message):
        bare = _BARE_AMOUNT_RE.search(message)
        if bare:
            try:
                return float(bare.group(1).replace(",", ""))
            except ValueError:
                pass
    return None


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

    result["budget"] = _extract_budget(message)

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
