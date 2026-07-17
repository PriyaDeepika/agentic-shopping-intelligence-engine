"""Helper that invokes the compiled LangGraph orchestrator and adapts the
resulting internal state into public API response schemas."""
from __future__ import annotations

from typing import Any

from app.models.product import Product
from app.models.schemas import AgentTrace, CartItem, CartState, ExplanationItem
from app.orchestrator.graph import get_graph
from app.retrieval.product_loader import get_product_by_id
from app.state.session_store import get_session_store
from app.utils.timing import TimedStep, render_timeline


async def run_turn(
    user_id: str,
    session_id: str,
    message: str,
    extra_constraints: dict[str, Any] | None = None,
) -> dict[str, Any]:
    session_store = get_session_store()
    session = session_store.get(session_id)

    initial_state: dict[str, Any] = {
        "user_id": user_id,
        "session_id": session_id,
        "message": message,
        "constraints": extra_constraints or {},
        "cart": session.get("cart", {}),
        "candidate_products": [],
        "outfits": [],
        "coupons": [],
        "wardrobe": session.get("last_state", {}).get("wardrobe", []),
        "agent_timeline": [],
        "errors": [],
    }

    graph = get_graph()
    final_state = await graph.ainvoke(initial_state)

    session_store.save(
        session_id,
        {
            "cart": final_state.get("cart", {}),
            "last_state": {
                k: v
                for k, v in final_state.items()
                if k in ("wardrobe", "budget", "aesthetic", "owned_items")
            },
            "agent_timeline": final_state.get("agent_timeline", []),
        },
    )

    return final_state


def to_cart_state(cart_dict: dict[str, Any]) -> CartState:
    items = [
        CartItem(product=Product(**i["product"]), quantity=i["quantity"])
        for i in cart_dict.get("items", [])
    ]
    return CartState(
        items=items,
        subtotal=cart_dict.get("subtotal", 0.0),
        discount_total=cart_dict.get("discount_total", 0.0),
        total=cart_dict.get("total", 0.0),
        budget=cart_dict.get("budget"),
        over_budget=cart_dict.get("over_budget", False),
    )


def to_explanations(explanations: list[dict[str, Any]]) -> list[ExplanationItem]:
    return [ExplanationItem(**e) for e in explanations]


def to_agent_timeline(timeline: list[dict[str, Any]]) -> list[AgentTrace]:
    return [AgentTrace(**t) for t in timeline]


def to_timeline_text(timeline: list[dict[str, Any]]) -> str:
    steps = [
        TimedStep(
            name=t["agent"],
            duration_seconds=t["duration_seconds"],
            success=t["success"],
            error=t.get("error"),
        )
        for t in timeline
    ]
    return render_timeline(steps)
