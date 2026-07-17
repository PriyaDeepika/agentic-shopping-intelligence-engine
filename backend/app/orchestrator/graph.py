"""
Shopping Orchestrator Agent — built on LangGraph.

Responsibilities (per spec): understand intent, maintain shopping state,
decide which agents to invoke, merge outputs, handle retries/failures,
produce the final response. Contains NO business logic itself — that lives
in the individual agents; this module only wires them into a graph and
routes between them.

Graph shape:

    START -> planner -> (conditional fan-out based on plan) -> ... -> merge -> END

Each specialist agent is a graph node. Routing between nodes is computed
dynamically from `state["plan"]` (built by the planner), so different
intents take different paths through the same graph, and a retry can re-enter
a node without restarting the whole plan.
"""
from __future__ import annotations

from typing import Any

from langgraph.graph import StateGraph, START, END

from app.agents.search_agent import SearchAgent
from app.agents.trend_agent import TrendAgent
from app.agents.outfit_agent import OutfitAgent
from app.agents.budget_agent import BudgetAgent
from app.agents.coupon_agent import CouponAgent
from app.agents.cart_agent import CartAgent
from app.agents.wardrobe_agent import WardrobeAgent
from app.agents.explanation_agent import ExplanationAgent
from app.orchestrator.planner import build_plan, classify_and_extract
from app.memory.memory_store import get_memory_store
from app.state.models import ShoppingState

MAX_RETRIES_PER_AGENT = 1

_AGENT_REGISTRY = {
    "search_agent": SearchAgent(),
    "trend_agent": TrendAgent(),
    "outfit_agent": OutfitAgent(),
    "budget_agent": BudgetAgent(),
    "coupon_agent": CouponAgent(),
    "cart_agent": CartAgent(),
    "wardrobe_agent": WardrobeAgent(),
    "explanation_agent": ExplanationAgent(),
}


async def planning_node(state: ShoppingState) -> dict[str, Any]:
    """Understand intent, extract shopping parameters, load memory, build the plan."""
    memory_store = get_memory_store()
    memory = memory_store.get(state["user_id"])

    extracted = await classify_and_extract(state.get("message", ""), prior_state=state)

    budget = extracted.get("budget") if extracted.get("budget") is not None else (
        state.get("budget") or memory.get("budget")
    )
    aesthetic = extracted.get("aesthetic") or state.get("aesthetic") or (memory.get("preferences") or {}).get("aesthetic")

    plan = build_plan(extracted["intent"])

    return {
        "intent": extracted["intent"],
        "plan": plan,
        "budget": budget,
        "aesthetic": aesthetic,
        "occasion": extracted.get("occasion") or state.get("occasion"),
        "owned_items": extracted.get("owned_items") or state.get("owned_items", []),
        "deadline": extracted.get("deadline"),
        "memory": memory,
        "delta_only": extracted["intent"] == "modify_cart",
    }


def _make_agent_node(agent_name: str):
    agent = _AGENT_REGISTRY[agent_name]

    async def _node(state: ShoppingState) -> dict[str, Any]:
        attempt = 0
        last_update: dict[str, Any] = {}
        while attempt <= MAX_RETRIES_PER_AGENT:
            last_update = await agent(state)
            # Retry once if the agent recorded an error for this run.
            timeline = last_update.get("agent_timeline", [])
            latest = timeline[-1] if timeline else {}
            if latest.get("success", True):
                break
            attempt += 1
        return last_update

    return _node


def _route_after_planning(state: ShoppingState) -> str:
    plan = state.get("plan", [])
    return plan[0] if plan else "merge"


def _make_router(current_agent: str):
    """Builds a conditional-edge function that advances to the next step in
    `state['plan']`, enabling dynamic routing decided by the orchestrator."""

    def _router(state: ShoppingState) -> str:
        plan = state.get("plan", [])
        if current_agent not in plan:
            return "merge"
        idx = plan.index(current_agent)
        if idx + 1 < len(plan):
            return plan[idx + 1]
        return "merge"

    return _router


async def merge_node(state: ShoppingState) -> dict[str, Any]:
    """Merge agent outputs into the final shopping plan / reply and persist memory."""
    memory_store = get_memory_store()
    memory_store.remember_preferences_from_state(state["user_id"], state)

    cart = state.get("cart", {})
    outfits = state.get("outfits", [])
    errors = state.get("errors", [])

    if outfits:
        reply = f"I've put together {len(outfits)} outfit(s) for you, totaling ₹{cart.get('total', 0):.0f}."
    elif cart.get("items"):
        reply = f"Your cart is updated — {len(cart['items'])} item(s), total ₹{cart.get('total', 0):.0f}."
    else:
        reply = "Here are the products I found for you."

    if cart.get("over_budget"):
        reply += " Note: this is still slightly over your budget — I can trim further if you'd like."
    if errors:
        reply += f" ({len(errors)} agent(s) hit issues; see the debug endpoint for details.)"

    return {"final_reply": reply}


def build_graph():
    graph = StateGraph(ShoppingState)

    graph.add_node("planner", planning_node)
    for name in _AGENT_REGISTRY:
        graph.add_node(name, _make_agent_node(name))
    graph.add_node("merge", merge_node)

    graph.add_edge(START, "planner")
    graph.add_conditional_edges(
        "planner", _route_after_planning, {**{n: n for n in _AGENT_REGISTRY}, "merge": "merge"}
    )
    for name in _AGENT_REGISTRY:
        graph.add_conditional_edges(
            name, _make_router(name), {**{n: n for n in _AGENT_REGISTRY}, "merge": "merge"}
        )
    graph.add_edge("merge", END)

    return graph.compile()


_compiled_graph = None


def get_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
    return _compiled_graph
