"""
Shared state object passed between LangGraph nodes (agents).

This is intentionally a plain, JSON-serializable dict-like TypedDict so it can be
checkpointed by LangGraph and persisted to Redis/Postgres between turns.
"""
from __future__ import annotations

from typing import Any, Optional, TypedDict

from app.models.product import Product


class AgentTraceDict(TypedDict, total=False):
    agent: str
    duration_seconds: float
    success: bool
    reasoning_summary: str
    confidence: float
    error: Optional[str]
    token_usage: int


class ShoppingState(TypedDict, total=False):
    # --- identity / conversation ---
    user_id: str
    session_id: str
    message: str
    intent: str  # e.g. "build_outfits", "modify_cart", "search", "adjust_budget"

    # --- plan produced by the orchestrator ---
    plan: list[str]  # ordered list of agent names to invoke

    # --- shopping goal parameters extracted from user message ---
    budget: Optional[float]
    aesthetic: Optional[str]
    occasion: Optional[str]
    owned_items: list[str]
    deadline: Optional[str]
    constraints: dict[str, Any]

    # --- working data passed agent to agent ---
    candidate_products: list[Product]
    outfits: list[dict[str, Any]]
    trend_tags: list[str]
    optimized_products: list[Product]
    coupons: list[dict[str, Any]]
    cart: dict[str, Any]
    wardrobe: list[dict[str, Any]]
    duplicate_warnings: list[str]
    explanations: list[dict[str, Any]]

    # --- diff-based update support ("remove jeans, replace with cargo") ---
    delta_only: bool
    affected_product_ids: list[str]

    # --- memory snapshot loaded at start of turn ---
    memory: dict[str, Any]

    # --- observability ---
    agent_timeline: list[AgentTraceDict]
    errors: list[str]

    # --- final output ---
    final_reply: str
