"""
Centralized configuration for the Agentic Shopping Intelligence Engine.
All values are overridable via environment variables (.env supported).
"""
from __future__ import annotations

import os
from functools import lru_cache
from pydantic import BaseModel


def _bool(name: str, default: bool) -> bool:
    return os.getenv(name, str(default)).strip().lower() in ("1", "true", "yes", "on")


class Settings(BaseModel):
    # --- App ---
    app_name: str = "Agentic Shopping Intelligence Engine"
    environment: str = os.getenv("ENVIRONMENT", "development")
    debug: bool = _bool("DEBUG", True)

    # --- LLM provider (OpenAI/Gemini compatible) ---
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock")  # "openai" | "gemini" | "mock"
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_base_url: str = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    llm_model: str = os.getenv("LLM_MODEL", "gpt-4o-mini")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")

    # --- Embeddings ---
    embedding_provider: str = os.getenv("EMBEDDING_PROVIDER", "local")  # "local" | "openai"
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    embedding_dim: int = int(os.getenv("EMBEDDING_DIM", "384"))

    # --- Storage ---
    postgres_dsn: str = os.getenv(
        "POSTGRES_DSN", "postgresql+asyncpg://ase:ase@localhost:5432/ase"
    )
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    products_path: str = os.getenv("PRODUCTS_PATH", "data/products.json")
    faiss_index_path: str = os.getenv("FAISS_INDEX_PATH", "data/faiss.index")

    # --- Memory ---
    memory_ttl_seconds: int = int(os.getenv("MEMORY_TTL_SECONDS", str(60 * 60 * 24 * 180)))  # 180 days

    # --- Observability ---
    langsmith_tracing: bool = _bool("LANGCHAIN_TRACING_V2", False)
    otel_enabled: bool = _bool("OTEL_ENABLED", False)
    otel_exporter_endpoint: str = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318")

    # --- API ---
    cors_origins: list[str] = os.getenv("CORS_ORIGINS", "*").split(",")


@lru_cache
def get_settings() -> Settings:
    return Settings()
