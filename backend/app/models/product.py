"""Product domain model. Mirrors the schema described in the spec."""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class Product(BaseModel):
    id: str
    name: str
    price: float
    brand: str
    category: str
    subcategory: str = ""
    color: str = ""
    style: str = ""
    occasion: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    description: str = ""
    sizes: list[str] = Field(default_factory=list)
    image_url: str = ""
    embedding: Optional[list[float]] = None
    inventory: int = 0
    discount: float = 0.0  # fraction, e.g. 0.2 == 20% off
    rating: float = 0.0

    @property
    def final_price(self) -> float:
        return round(self.price * (1 - self.discount), 2)

    def searchable_text(self) -> str:
        """Text blob used to build embeddings for semantic search."""
        parts = [
            self.name,
            self.brand,
            self.category,
            self.subcategory,
            self.color,
            self.style,
            " ".join(self.occasion),
            " ".join(self.tags),
            self.description,
        ]
        return " | ".join(p for p in parts if p)
