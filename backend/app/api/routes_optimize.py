from fastapi import APIRouter

from app.agents.budget_agent import BudgetAgent
from app.agents.cart_agent import CartAgent
from app.models.schemas import AgentTrace, OptimizeRequest, OptimizeResponse
from app.orchestrator.runner import to_cart_state
from app.retrieval.product_loader import get_product_by_id

router = APIRouter(tags=["optimize"])
_budget_agent = BudgetAgent()
_cart_agent = CartAgent()


@router.post("/optimize", response_model=OptimizeResponse)
async def optimize(payload: OptimizeRequest) -> OptimizeResponse:
    products = [p for p in (get_product_by_id(pid) for pid in payload.product_ids) if p is not None]

    state = {
        "session_id": payload.session_id,
        "budget": payload.budget,
        "candidate_products": products,
        "outfits": [],
        "coupons": [],
        "cart": {},
        "agent_timeline": [],
    }
    update = await _budget_agent(state)
    state.update(update)
    cart_update = await _cart_agent(state)
    state.update(cart_update)

    trace = state["agent_timeline"][-1]
    return OptimizeResponse(cart=to_cart_state(state.get("cart", {})), agent_trace=AgentTrace(**trace))
