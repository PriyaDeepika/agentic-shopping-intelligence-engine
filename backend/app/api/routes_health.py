from fastapi import APIRouter

from app.utils.config import get_settings

router = APIRouter(tags=["health"])
settings = get_settings()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "service": settings.app_name,
        "environment": settings.environment,
        "llm_provider": settings.llm_provider,
    }
