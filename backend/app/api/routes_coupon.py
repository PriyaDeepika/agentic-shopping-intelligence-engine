from fastapi import APIRouter

from app.agents.coupon_agent import CouponAgent
from app.models.schemas import AgentTrace, CouponRequest, CouponResponse
from app.retrieval.product_loader import load_products

router = APIRouter(tags=["coupon"])
_agent = CouponAgent()


@router.post("/coupon", response_model=CouponResponse)
async def coupon(payload: CouponRequest) -> CouponResponse:
    # Reconstruct a lightweight product view purely to drive brand-matching logic.
    catalog = {p.brand for p in load_products() if p.id in payload.brand_ids} or set(payload.brand_ids)
    fake_products = [p for p in load_products() if p.brand in catalog][:10] or load_products()[:1]

    state = {
        "session_id": "coupon-standalone",
        "optimized_products": fake_products,
        "candidate_products": fake_products,
        "memory": {},
        "agent_timeline": [],
    }
    update = await _agent(state)
    trace = update["agent_timeline"][-1]

    # Re-scale savings estimate to the actual cart_total provided by the caller,
    # since we don't have their real product list here.
    coupons = update.get("coupons", [])
    for c in coupons:
        if c["type"] == "bundle":
            c["savings"] = round(payload.cart_total * 0.10, 2)
        elif c["type"] == "brand_loyalty":
            c["savings"] = round(payload.cart_total * 0.05, 2)

    best_savings = max((c["savings"] for c in coupons), default=0.0)
    return CouponResponse(applicable_coupons=coupons, best_savings=best_savings, agent_trace=AgentTrace(**trace))
