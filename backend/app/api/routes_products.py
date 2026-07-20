"""
Plain product-catalog endpoints.

The engine already exposes a *semantic* `/search` (query required, ranked by
embedding similarity). The storefront also needs a simple catalog browse
(list all / filter / paginate) and a stable "get one product by id" lookup
for product-detail pages — neither existed as HTTP endpoints before (they
were only used internally by other agents/routes). This module adds both,
purely as thin wrappers around the existing `product_loader` module, so no
business logic is duplicated.
"""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.models.product import Product
from app.models.schemas import ProductListResponse
from app.retrieval.product_loader import get_product_by_id, load_products

router = APIRouter(tags=["products"])


@router.get("/products", response_model=ProductListResponse)
async def list_products(
    q: Optional[str] = Query(None, description="Free-text match on name/brand/description/tags"),
    category: Optional[str] = Query(None),
    brand: Optional[str] = Query(None),
    color: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    sort: str = Query("featured", pattern="^(featured|price_asc|price_desc|rating|newest)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
) -> ProductListResponse:
    products = load_products()

    if q:
        needle = q.lower().strip()
        products = [
            p
            for p in products
            if needle in p.name.lower()
            or needle in p.brand.lower()
            or needle in p.description.lower()
            or needle in p.category.lower()
            or any(needle in t.lower() for t in p.tags)
        ]
    if category:
        products = [p for p in products if p.category.lower() == category.lower()]
    if brand:
        products = [p for p in products if p.brand.lower() == brand.lower()]
    if color:
        products = [p for p in products if p.color.lower() == color.lower()]
    if min_price is not None:
        products = [p for p in products if p.final_price >= min_price]
    if max_price is not None:
        products = [p for p in products if p.final_price <= max_price]

    if sort == "price_asc":
        products = sorted(products, key=lambda p: p.final_price)
    elif sort == "price_desc":
        products = sorted(products, key=lambda p: p.final_price, reverse=True)
    elif sort == "rating":
        products = sorted(products, key=lambda p: p.rating, reverse=True)
    elif sort == "newest":
        products = list(reversed(products))
    # "featured" keeps catalog order

    total = len(products)
    start = (page - 1) * page_size
    page_items = products[start : start + page_size]

    return ProductListResponse(
        items=page_items,
        total=total,
        page=page,
        page_size=page_size,
        categories=sorted({p.category for p in load_products()}),
        brands=sorted({p.brand for p in load_products()}),
    )


@router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str) -> Product:
    product = get_product_by_id(product_id)
    if product is None:
        raise HTTPException(status_code=404, detail=f"Product '{product_id}' not found")
    return product
