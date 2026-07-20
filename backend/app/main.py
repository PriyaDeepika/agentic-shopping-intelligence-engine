"""
Agentic Shopping Intelligence Engine — FastAPI entrypoint.

This is a pure AI backend: no frontend, no e-commerce storefront. It exposes
the API surface described in the spec so any existing shopping website
(Next.js or otherwise) can plug in over HTTP.
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    routes_cart,
    routes_chat,
    routes_coupon,
    routes_debug,
    routes_health,
    routes_memory,
    routes_optimize,
    routes_products,
    routes_recommend,
    routes_search,
    routes_wardrobe,
)
from app.services.logger_service import init_observability
from app.utils.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_observability()
    yield


app = FastAPI(
    title=settings.app_name,
    description="Multi-agent AI shopping backend: search, trend reasoning, outfit "
    "assembly, budget optimization, coupons, cart management, wardrobe awareness, "
    "and explainable recommendations — orchestrated via LangGraph.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(routes_health.router)
app.include_router(routes_products.router)
app.include_router(routes_chat.router)
app.include_router(routes_search.router)
app.include_router(routes_optimize.router)
app.include_router(routes_cart.router)
app.include_router(routes_wardrobe.router)
app.include_router(routes_recommend.router)
app.include_router(routes_coupon.router)
app.include_router(routes_memory.router)
app.include_router(routes_debug.router)
