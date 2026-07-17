from fastapi import APIRouter

from app.memory.memory_store import get_memory_store
from app.models.schemas import MemoryReadRequest, MemoryResponse, MemoryWriteRequest

router = APIRouter(tags=["memory"])


@router.post("/memory", response_model=MemoryResponse)
async def write_memory(payload: MemoryWriteRequest) -> MemoryResponse:
    store = get_memory_store()
    data = store.update(payload.user_id, {payload.key: payload.value})
    return MemoryResponse(user_id=payload.user_id, data=data)


@router.get("/memory/{user_id}", response_model=MemoryResponse)
async def read_memory(user_id: str) -> MemoryResponse:
    store = get_memory_store()
    data = store.get(user_id)
    return MemoryResponse(user_id=user_id, data=data)
