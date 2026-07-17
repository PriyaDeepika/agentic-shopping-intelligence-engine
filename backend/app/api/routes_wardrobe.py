from fastapi import APIRouter

from app.agents.wardrobe_agent import WardrobeAgent
from app.memory.memory_store import get_memory_store
from app.models.schemas import AgentTrace, WardrobeRequest, WardrobeResponse

router = APIRouter(tags=["wardrobe"])
_agent = WardrobeAgent()


@router.post("/wardrobe", response_model=WardrobeResponse)
async def wardrobe(payload: WardrobeRequest) -> WardrobeResponse:
    wardrobe_items = [item.model_dump() for item in payload.items]

    state = {
        "session_id": f"wardrobe-{payload.user_id}",
        "wardrobe": wardrobe_items,
        "candidate_products": [],
        "agent_timeline": [],
    }
    update = await _agent(state)

    memory_store = get_memory_store()
    memory_store.update(payload.user_id, {"wardrobe": [i["name"] for i in wardrobe_items]})

    trace = update["agent_timeline"][-1]
    return WardrobeResponse(
        wardrobe_size=len(wardrobe_items),
        duplicate_warnings=update.get("duplicate_warnings", []),
        complementary_recommendations=update.get("candidate_products", []),
        agent_trace=AgentTrace(**trace),
    )
