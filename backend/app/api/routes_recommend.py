from fastapi import APIRouter

from app.models.schemas import RecommendRequest, RecommendResponse
from app.orchestrator.runner import (
    run_turn,
    to_agent_timeline,
    to_cart_state,
    to_explanations,
    to_timeline_text,
)

router = APIRouter(tags=["recommend"])


@router.post("/recommend", response_model=RecommendResponse)
async def recommend(payload: RecommendRequest) -> RecommendResponse:
    constraints: dict = {}
    message = payload.goal
    if payload.budget is not None:
        message += f" Budget ₹{payload.budget:.0f}."
    if payload.aesthetic:
        message += f" I like {payload.aesthetic} fashion."

    final_state = await run_turn(
        user_id=payload.user_id,
        session_id=payload.session_id,
        message=message,
        extra_constraints=constraints,
    )

    timeline = final_state.get("agent_timeline", [])
    return RecommendResponse(
        cart=to_cart_state(final_state.get("cart", {})),
        explanations=to_explanations(final_state.get("explanations", [])),
        agent_timeline=to_agent_timeline(timeline),
        timeline_text=to_timeline_text(timeline),
    )
