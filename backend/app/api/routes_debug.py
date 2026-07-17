from fastapi import APIRouter

from app.models.schemas import AgentTrace, DebugRequest, DebugResponse
from app.state.session_store import get_session_store

router = APIRouter(prefix="/agent", tags=["debug"])


@router.post("/debug", response_model=DebugResponse)
async def debug(payload: DebugRequest) -> DebugResponse:
    session_store = get_session_store()
    session = session_store.get(payload.session_id)
    timeline = session.get("agent_timeline", [])

    return DebugResponse(
        session_id=payload.session_id,
        last_state=session.get("last_state", {}),
        agent_timeline=[AgentTrace(**t) for t in timeline],
    )
