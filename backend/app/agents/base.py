"""
Base class for all specialized agents (graph nodes).

Every concrete agent implements `run(state) -> partial_state_update` and gets
timing, structured logging, confidence/reasoning capture, and error isolation
for free via `__call__`, which is what LangGraph actually invokes as the node
function. A failing agent never crashes the graph — it records the error into
`state["errors"]` and `state["agent_timeline"]` and lets the orchestrator
decide how to proceed (retry/fallback/skip).
"""
from __future__ import annotations

import time
from abc import ABC, abstractmethod
from typing import Any

from app.services.logger_service import get_tracer, log_agent_run
from app.state.models import ShoppingState


class BaseAgent(ABC):
    name: str = "BaseAgent"

    @abstractmethod
    async def run(self, state: ShoppingState) -> dict[str, Any]:
        """Return a partial state update (dict) to be merged into ShoppingState."""
        raise NotImplementedError

    async def __call__(self, state: ShoppingState) -> dict[str, Any]:
        tracer = get_tracer()
        start = time.perf_counter()
        reasoning_summary = ""
        confidence = 0.0
        error: str | None = None
        update: dict[str, Any] = {}

        with tracer.start_as_current_span(self.name):
            try:
                update = await self.run(state)
                reasoning_summary = update.pop("_reasoning_summary", "") if update else ""
                confidence = update.pop("_confidence", 0.85) if update else 0.0
                success = True
            except Exception as exc:  # noqa: BLE001 — isolate agent failures
                success = False
                error = str(exc)
                update = {}

        duration = round(time.perf_counter() - start, 4)
        trace = log_agent_run(
            agent=self.name,
            session_id=state.get("session_id", "unknown"),
            duration_seconds=duration,
            success=success,
            reasoning_summary=reasoning_summary,
            confidence=confidence,
            error=error,
        )

        timeline = list(state.get("agent_timeline", []))
        timeline.append(trace)
        update["agent_timeline"] = timeline

        if error:
            errors = list(state.get("errors", []))
            errors.append(f"{self.name}: {error}")
            update["errors"] = errors

        return update
