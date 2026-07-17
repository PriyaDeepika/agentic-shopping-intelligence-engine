"""
Loads the product catalog from products.json (default) or Postgres.

In production, swap `load_products()`'s branch to always hit Postgres; the
JSON path exists so the engine is runnable/demoable with zero infrastructure.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.models.product import Product
from app.utils.config import get_settings

settings = get_settings()


def _resolve_products_path() -> Path:
    p = Path(settings.products_path)
    if p.is_absolute() and p.exists():
        return p
    # Resolve relative to project root (parent of `app/`)
    root = Path(__file__).resolve().parents[2]
    candidate = root / settings.products_path
    return candidate


@lru_cache
def load_products() -> list[Product]:
    path = _resolve_products_path()
    if not path.exists():
        return []
    with open(path, "r", encoding="utf-8") as f:
        raw = json.load(f)
    return [Product(**item) for item in raw]


def reload_products() -> list[Product]:
    load_products.cache_clear()
    return load_products()


def get_product_by_id(product_id: str) -> Product | None:
    for p in load_products():
        if p.id == product_id:
            return p
    return None
