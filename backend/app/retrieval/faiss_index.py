"""
FAISS vector index over the product catalog, with graceful degradation to a
pure-numpy cosine-similarity search when the `faiss` package isn't installed
(e.g. constrained environments). Behavior is identical either way.
"""
from __future__ import annotations

from functools import lru_cache

import numpy as np

from app.embeddings.embedder import get_embedder
from app.models.product import Product
from app.retrieval.product_loader import load_products

try:
    import faiss  # type: ignore

    _HAS_FAISS = True
except Exception:  # noqa: BLE001
    _HAS_FAISS = False


class ProductIndex:
    def __init__(self, products: list[Product]):
        self.products = products
        self.embedder = get_embedder()
        texts = [p.searchable_text() for p in products] or [""]
        self.vectors = self.embedder.embed(texts) if products else np.zeros((0, self.embedder.dim), dtype="float32")

        self._faiss_index = None
        if _HAS_FAISS and len(products) > 0:
            index = faiss.IndexFlatIP(self.vectors.shape[1])
            index.add(self.vectors)
            self._faiss_index = index

    def search(self, query: str, top_k: int = 10, filters: dict | None = None) -> list[tuple[Product, float]]:
        if not self.products:
            return []
        candidates = self.products
        candidate_idxs = list(range(len(candidates)))

        if filters:
            candidate_idxs = [
                i for i in candidate_idxs if _matches_filters(candidates[i], filters)
            ]
        if not candidate_idxs:
            return []

        q_vec = self.embedder.embed([query])[0]

        if self._faiss_index is not None and not filters:
            scores, idxs = self._faiss_index.search(q_vec.reshape(1, -1), min(top_k, len(candidates)))
            return [(self.products[i], float(s)) for s, i in zip(scores[0], idxs[0]) if i != -1]

        # Fallback / filtered path: compute cosine similarity in numpy over the
        # filtered candidate subset (FAISS doesn't support arbitrary metadata
        # filters on a flat index without a pre/post-filter strategy).
        sub_vectors = self.vectors[candidate_idxs]
        sims = sub_vectors @ q_vec
        order = np.argsort(-sims)[:top_k]
        return [(candidates[candidate_idxs[i]], float(sims[i])) for i in order]


def _matches_filters(product: Product, filters: dict) -> bool:
    for key, value in filters.items():
        if value in (None, "", []):
            continue
        if key == "max_price" and product.final_price > value:
            return False
        if key == "min_price" and product.final_price < value:
            return False
        if key == "category" and product.category.lower() != str(value).lower():
            return False
        if key == "brand" and product.brand.lower() != str(value).lower():
            return False
        if key == "color" and product.color.lower() != str(value).lower():
            return False
        if key == "size" and value not in product.sizes:
            return False
        if key == "style" and str(value).lower() not in product.style.lower():
            return False
    return True


@lru_cache
def get_product_index() -> ProductIndex:
    return ProductIndex(load_products())


def rebuild_index() -> ProductIndex:
    get_product_index.cache_clear()
    return get_product_index()
