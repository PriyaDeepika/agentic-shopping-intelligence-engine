"""Pydantic request/response schemas for the public API surface."""
from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, Field

from app.models.product import Product


# ---------- Common ----------

class AgentTrace(BaseModel):
    agent: str
    duration_seconds: float
    success: bool
    reasoning_summary: str = ""
    confidence: float = 0.0
    error: Optional[str] = None
    token_usage: int = 0


class ExplanationItem(BaseModel):
    product_id: str
    reasons: list[str]


class CartItem(BaseModel):
    product: Product
    quantity: int = 1


class CartState(BaseModel):
    items: list[CartItem] = Field(default_factory=list)
    subtotal: float = 0.0
    discount_total: float = 0.0
    total: float = 0.0
    budget: Optional[float] = None
    over_budget: bool = False


# ---------- /chat ----------

class ChatRequest(BaseModel):
    user_id: str
    session_id: str
    message: str
    context: dict[str, Any] = Field(default_factory=dict)


class ChatResponse(BaseModel):
    session_id: str
    reply: str
    cart: CartState
    explanations: list[ExplanationItem] = Field(default_factory=list)
    agent_timeline: list[AgentTrace] = Field(default_factory=list)
    timeline_text: str = ""


# ---------- /search ----------

class SearchRequest(BaseModel):
    query: str
    filters: dict[str, Any] = Field(default_factory=dict)
    top_k: int = 10


class SearchResponse(BaseModel):
    products: list[Product]
    agent_trace: AgentTrace


# ---------- /optimize ----------

class OptimizeRequest(BaseModel):
    user_id: str
    session_id: str
    budget: float
    product_ids: list[str] = Field(default_factory=list)


class OptimizeResponse(BaseModel):
    cart: CartState
    agent_trace: AgentTrace


# ---------- /cart ----------

class CartActionRequest(BaseModel):
    user_id: str
    session_id: str
    action: str  # add | remove | swap | increase_quantity | decrease_quantity
    product_id: Optional[str] = None
    replacement_product_id: Optional[str] = None
    quantity: Optional[int] = None


class CartActionResponse(BaseModel):
    cart: CartState
    agent_trace: AgentTrace


# ---------- /wardrobe ----------

class WardrobeItem(BaseModel):
    name: str
    category: str
    color: str = ""
    tags: list[str] = Field(default_factory=list)


class WardrobeRequest(BaseModel):
    user_id: str
    items: list[WardrobeItem]


class WardrobeResponse(BaseModel):
    wardrobe_size: int
    duplicate_warnings: list[str]
    complementary_recommendations: list[Product]
    agent_trace: AgentTrace


# ---------- /recommend ----------

class RecommendRequest(BaseModel):
    user_id: str
    session_id: str
    goal: str
    budget: Optional[float] = None
    aesthetic: Optional[str] = None


class RecommendResponse(BaseModel):
    cart: CartState
    explanations: list[ExplanationItem]
    agent_timeline: list[AgentTrace]
    timeline_text: str


# ---------- /coupon ----------

class CouponRequest(BaseModel):
    cart_total: float
    brand_ids: list[str] = Field(default_factory=list)


class CouponResponse(BaseModel):
    applicable_coupons: list[dict[str, Any]]
    best_savings: float
    agent_trace: AgentTrace


# ---------- /memory ----------

class MemoryWriteRequest(BaseModel):
    user_id: str
    key: str
    value: Any


class MemoryReadRequest(BaseModel):
    user_id: str
    key: Optional[str] = None


class MemoryResponse(BaseModel):
    user_id: str
    data: dict[str, Any]


# ---------- /products ----------

class ProductListResponse(BaseModel):
    items: list[Product]
    total: int
    page: int
    page_size: int
    categories: list[str] = Field(default_factory=list)
    brands: list[str] = Field(default_factory=list)


# ---------- /agent/debug ----------

class DebugRequest(BaseModel):
    session_id: str


class DebugResponse(BaseModel):
    session_id: str
    last_state: dict[str, Any]
    agent_timeline: list[AgentTrace]
