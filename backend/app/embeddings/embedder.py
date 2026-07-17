"""
Embedding provider abstraction.

Priority order:
  1. sentence-transformers (local, free, no API key) — default.
  2. OpenAI embeddings API — if EMBEDDING_PROVIDER=openai and key is set.
  3. Deterministic hashing-based fallback — guarantees the system still runs
     (with degraded semantic quality) even with zero dependencies installed,
     so CI/tests never hard-fail on missing model downloads.
"""
from __future__ import annotations

import hashlib
import math
from functools import lru_cache

import numpy as np

from app.utils.config import get_settings

settings = get_settings()


class Embedder:
    def __init__(self):
        self._model = None
        self._mode = "hash"
        if settings.embedding_provider == "local":
            try:
                from sentence_transformers import SentenceTransformer

                self._model = SentenceTransformer(settings.embedding_model)
                self._mode = "local"
            except Exception:  # noqa: BLE001
                self._mode = "hash"
        elif settings.embedding_provider == "openai" and settings.openai_api_key:
            self._mode = "openai"

    @property
    def dim(self) -> int:
        if self._mode == "local" and self._model is not None:
            return self._model.get_sentence_embedding_dimension()
        return settings.embedding_dim

    def embed(self, texts: list[str]) -> np.ndarray:
        if self._mode == "local" and self._model is not None:
            vecs = self._model.encode(texts, normalize_embeddings=True)
            return np.asarray(vecs, dtype="float32")
        if self._mode == "openai":
            return self._embed_openai(texts)
        return np.asarray([self._hash_embed(t) for t in texts], dtype="float32")

    def _embed_openai(self, texts: list[str]) -> np.ndarray:
        import openai

        client = openai.OpenAI(api_key=settings.openai_api_key, base_url=settings.openai_base_url)
        resp = client.embeddings.create(model="text-embedding-3-small", input=texts)
        vecs = np.asarray([d.embedding for d in resp.data], dtype="float32")
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        return vecs / np.clip(norms, 1e-8, None)

    def _hash_embed(self, text: str) -> list[float]:
        """Deterministic bag-of-tokens hashing embedding — a dependency-free fallback."""
        dim = settings.embedding_dim
        vec = np.zeros(dim, dtype="float32")
        tokens = text.lower().replace("|", " ").split()
        for tok in tokens:
            h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
            idx = h % dim
            sign = 1.0 if (h // dim) % 2 == 0 else -1.0
            vec[idx] += sign
        norm = math.sqrt(float(np.dot(vec, vec))) or 1.0
        return (vec / norm).tolist()


@lru_cache
def get_embedder() -> Embedder:
    return Embedder()
