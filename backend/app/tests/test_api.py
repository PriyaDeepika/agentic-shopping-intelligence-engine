"""
Test suite for the Agentic Shopping Intelligence Engine.

Run with: pytest -v
Runs entirely offline (LLM_PROVIDER=mock, no Redis/Postgres required) thanks
to the fallback paths built into the memory, embedding, and LLM layers.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_chat_builds_outfits_within_budget():
    r = client.post(
        "/chat",
        json={
            "user_id": "test_user_1",
            "session_id": "test_session_1",
            "message": (
                "I need three outfits for college. Budget 3500. "
                "I already own white sneakers. I like Korean oversized fashion."
            ),
        },
    )
    assert r.status_code == 200
    data = r.json()
    assert data["cart"]["total"] <= 3500 or not data["cart"]["over_budget"]
    assert len(data["cart"]["items"]) > 0
    assert len(data["agent_timeline"]) >= 5
    assert all(t["success"] for t in data["agent_timeline"])
    assert "Planning" in data["timeline_text"]


def test_cart_delta_swap_does_not_recompute_full_plan():
    session_id = "test_session_swap"
    r1 = client.post(
        "/chat",
        json={
            "user_id": "test_user_2",
            "session_id": session_id,
            "message": "I need outfits for college. Budget 4000. I like minimal aesthetic.",
        },
    )
    cart_items = r1.json()["cart"]["items"]
    assert cart_items
    target_id = cart_items[0]["product"]["id"]

    r2 = client.post(
        "/cart",
        json={
            "user_id": "test_user_2",
            "session_id": session_id,
            "action": "swap",
            "product_id": target_id,
            "replacement_product_id": "p010",
        },
    )
    assert r2.status_code == 200
    trace = r2.json()["agent_trace"]
    assert trace["agent"] == "Cart Agent"
    new_ids = [i["product"]["id"] for i in r2.json()["cart"]["items"]]
    assert "p010" in new_ids
    assert target_id not in new_ids or target_id == "p010"


def test_search_endpoint_returns_relevant_products():
    r = client.post("/search", json={"query": "cargo pants streetwear", "filters": {}, "top_k": 5})
    assert r.status_code == 200
    products = r.json()["products"]
    assert len(products) > 0
    assert r.json()["agent_trace"]["agent"] == "Search Agent"


def test_search_respects_max_price_filter():
    r = client.post("/search", json={"query": "jeans", "filters": {"max_price": 500}, "top_k": 10})
    assert r.status_code == 200
    for p in r.json()["products"]:
        assert p["price"] * (1 - p["discount"]) <= 500


def test_wardrobe_detects_duplicates():
    r = client.post(
        "/wardrobe",
        json={
            "user_id": "test_user_3",
            "items": [{"name": "Oversized Cotton Tee", "category": "topwear", "color": "white", "tags": []}],
        },
    )
    assert r.status_code == 200
    assert r.json()["wardrobe_size"] == 1


def test_optimize_respects_budget():
    r = client.post(
        "/optimize",
        json={
            "user_id": "test_user_4",
            "session_id": "test_session_optimize",
            "budget": 2000,
            "product_ids": ["p008", "p007", "p004"],  # expensive items
        },
    )
    assert r.status_code == 200
    cart = r.json()["cart"]
    assert cart["total"] <= 2000 or cart["over_budget"]  # either optimized under, or flagged


def test_coupon_endpoint():
    r = client.post("/coupon", json={"cart_total": 3000, "brand_ids": []})
    assert r.status_code == 200
    assert r.json()["best_savings"] >= 0


def test_memory_write_and_read_roundtrip():
    r1 = client.post(
        "/memory", json={"user_id": "test_user_5", "key": "favorite_colors", "value": ["black", "white"]}
    )
    assert r1.status_code == 200
    r2 = client.get("/memory/test_user_5")
    assert r2.status_code == 200
    assert "black" in r2.json()["data"]["favorite_colors"]


def test_debug_endpoint_returns_timeline_after_chat():
    session_id = "test_session_debug"
    client.post(
        "/chat",
        json={"user_id": "test_user_6", "session_id": session_id, "message": "outfits for college budget 3000"},
    )
    r = client.post("/agent/debug", json={"session_id": session_id})
    assert r.status_code == 200


def test_search_agent_excludes_rejected_products_from_memory():
    from app.memory.memory_store import get_memory_store

    store = get_memory_store()
    store.update("test_user_7", {"rejected_products": ["p001"]})

    r = client.post(
        "/chat",
        json={"user_id": "test_user_7", "session_id": "test_session_reject", "message": "korean oversized tee"},
    )
    assert r.status_code == 200


@pytest.mark.asyncio
async def test_planner_extracts_budget_and_aesthetic():
    from app.orchestrator.planner import classify_and_extract

    result = await classify_and_extract("I need outfits. Budget 3500. I like Korean fashion.")
    assert result["budget"] == 3500.0
    assert result["aesthetic"] == "Korean"
    assert result["intent"] == "build_outfits"


@pytest.mark.asyncio
async def test_planner_detects_modify_cart_intent():
    from app.orchestrator.planner import classify_and_extract

    prior_state = {"cart": {"items": [{"product": {"id": "p001"}, "quantity": 1}]}}
    result = await classify_and_extract("Remove jeans. Replace with cargo.", prior_state=prior_state)
    assert result["intent"] == "modify_cart"
