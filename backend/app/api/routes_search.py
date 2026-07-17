import time

from fastapi import APIRouter

from app.agents.search_agent import SearchAgent
from app.models.schemas import AgentTrace, SearchRequest, SearchResponse

router = APIRouter(tags=["search"])
_agent = SearchAgent()


@router.post("/search", response_model=SearchResponse)
async def search(payload: SearchRequest) -> SearchResponse:
    state = {
        "session_id": "search-standalone",
        "message": payload.query,
        "constraints": payload.filters,
        "budget": payload.filters.get("max_price"),
        "memory": {},
        "agent_timeline": [],
    }
    update = await _agent(state)
    products = update.get("candidate_products", [])[: payload.top_k]
    trace = update["agent_timeline"][-1]

    return SearchResponse(products=products, agent_trace=AgentTrace(**trace))
