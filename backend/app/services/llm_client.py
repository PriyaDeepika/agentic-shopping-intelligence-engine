"""
Thin LLM client abstraction. Supports:
  - "openai"  : any OpenAI-compatible endpoint (OpenAI, Azure OpenAI, local vLLM, etc.)
  - "gemini"  : Google Gemini
  - "mock"    : deterministic offline responder used for tests / demos without API keys

The rest of the codebase should depend only on `LLMClient.complete()` /
`LLMClient.complete_json()` and never talk to a provider SDK directly, so swapping
providers or adding new ones (Anthropic, etc.) is a one-file change.
"""
from __future__ import annotations

import json
import re
from typing import Any

from app.utils.config import get_settings

settings = get_settings()


class LLMClient:
    def __init__(self, provider: str | None = None):
        self.provider = provider or settings.llm_provider
        self._client = None
        if self.provider == "openai" and settings.openai_api_key:
            from openai import AsyncOpenAI  # lazy import, optional dependency

            self._client = AsyncOpenAI(
                api_key=settings.openai_api_key, base_url=settings.openai_base_url
            )
        elif self.provider == "gemini" and settings.gemini_api_key:
            import google.generativeai as genai  # lazy import, optional dependency

            genai.configure(api_key=settings.gemini_api_key)
            self._client = genai.GenerativeModel(settings.gemini_model)

    async def complete(self, system: str, user: str, temperature: float = 0.3) -> str:
        if self.provider == "openai" and self._client is not None:
            resp = await self._client.chat.completions.create(
                model=settings.llm_model,
                temperature=temperature,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
            )
            return resp.choices[0].message.content or ""

        if self.provider == "gemini" and self._client is not None:
            resp = await self._client.generate_content_async(f"{system}\n\n{user}")
            return resp.text or ""

        # --- mock provider: deterministic, offline, good enough to drive the demo ---
        return self._mock_complete(system, user)

    async def complete_json(self, system: str, user: str, temperature: float = 0.2) -> dict[str, Any]:
        raw = await self.complete(
            system + "\nRespond ONLY with valid JSON. No prose, no markdown fences.",
            user,
            temperature=temperature,
        )
        return self._safe_parse_json(raw)

    @staticmethod
    def _safe_parse_json(raw: str) -> dict[str, Any]:
        cleaned = re.sub(r"^```(json)?|```$", "", raw.strip(), flags=re.MULTILINE).strip()
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", cleaned, re.DOTALL)
            if match:
                try:
                    return json.loads(match.group(0))
                except json.JSONDecodeError:
                    pass
            return {}

    @staticmethod
    def _mock_complete(system: str, user: str) -> str:
        """
        Deterministic offline responder. Used when no API key is configured
        (LLM_PROVIDER=mock, the default) so the whole pipeline is runnable/testable
        without network access or billing.
        """
        if "intent classification" in system.lower():
            return json.dumps(
                {
                    "intent": "build_outfits",
                    "budget": None,
                    "aesthetic": None,
                    "occasion": None,
                    "owned_items": [],
                }
            )
        if "explanation" in system.lower():
            return "Selected for fit, budget, and aesthetic match."
        return f"[mock-llm] Acknowledged: {user[:120]}"


def get_llm_client() -> LLMClient:
    return LLMClient()
