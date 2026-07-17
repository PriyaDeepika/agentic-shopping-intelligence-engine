from fastapi import APIRouter

from app.agents.cart_agent import CartAgent
from app.models.schemas import AgentTrace, CartActionRequest, CartActionResponse
from app.orchestrator.runner import to_cart_state
from app.state.session_store import get_session_store

router = APIRouter(tags=["cart"])
_agent = CartAgent()


@router.post("/cart", response_model=CartActionResponse)
async def cart_action(payload: CartActionRequest) -> CartActionResponse:
    session_store = get_session_store()
    session = session_store.get(payload.session_id)

    state = {
        "session_id": payload.session_id,
        "cart": session.get("cart", {}),
        "delta_only": True,
        "constraints": {
            "cart_action": payload.action,
            "product_id": payload.product_id,
            "replacement_product_id": payload.replacement_product_id,
            "quantity": payload.quantity,
        },
        "coupons": [],
        "agent_timeline": [],
    }
    update = await _agent(state)

    session["cart"] = update.get("cart", {})
    session_store.save(payload.session_id, session)

    trace = update["agent_timeline"][-1]
    return CartActionResponse(cart=to_cart_state(update.get("cart", {})), agent_trace=AgentTrace(**trace))
