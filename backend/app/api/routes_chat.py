from fastapi import APIRouter

from app.models.schemas import ChatRequest, ChatResponse
from app.orchestrator.runner import (
    run_turn,
    to_agent_timeline,
    to_cart_state,
    to_explanations,
    to_timeline_text,
)

router = APIRouter(tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> ChatResponse:
    final_state = await run_turn(
        user_id=payload.user_id,
        session_id=payload.session_id,
        message=payload.message,
        extra_constraints=payload.context,
    )

    timeline = final_state.get("agent_timeline", [])
    return ChatResponse(
        session_id=payload.session_id,
        reply=final_state.get("final_reply", ""),
        cart=to_cart_state(final_state.get("cart", {})),
        explanations=to_explanations(final_state.get("explanations", [])),
        agent_timeline=to_agent_timeline(timeline),
        timeline_text=to_timeline_text(timeline),
    )
