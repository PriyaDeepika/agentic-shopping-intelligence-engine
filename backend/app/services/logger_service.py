"""
Structured logging for agent decisions, plus optional OpenTelemetry + LangSmith hooks.

Every agent run is logged with: which agent ran, execution time, reasoning
summary, token usage, errors, and confidence — as required by the spec's
"LOGGING" section.
"""
from __future__ import annotations

import json
import logging
import sys
from typing import Any

from app.utils.config import get_settings

settings = get_settings()

logger = logging.getLogger("ase")
if not logger.handlers:
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(asctime)s | %(levelname)s | %(message)s"))
    logger.addHandler(handler)
    logger.setLevel(logging.DEBUG if settings.debug else logging.INFO)


def log_agent_run(
    agent: str,
    session_id: str,
    duration_seconds: float,
    success: bool,
    reasoning_summary: str = "",
    confidence: float = 0.0,
    error: str | None = None,
    token_usage: int = 0,
    extra: dict[str, Any] | None = None,
) -> dict[str, Any]:
    record = {
        "agent": agent,
        "session_id": session_id,
        "duration_seconds": duration_seconds,
        "success": success,
        "reasoning_summary": reasoning_summary,
        "confidence": confidence,
        "error": error,
        "token_usage": token_usage,
        **(extra or {}),
    }
    level = logging.INFO if success else logging.ERROR
    logger.log(level, json.dumps(record, default=str))
    return record


def init_observability() -> None:
    """Best-effort setup of OpenTelemetry tracing. No-ops if disabled or deps missing."""
    if not settings.otel_enabled:
        return
    try:
        from opentelemetry import trace
        from opentelemetry.sdk.resources import Resource
        from opentelemetry.sdk.trace import TracerProvider
        from opentelemetry.sdk.trace.export import BatchSpanProcessor
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

        resource = Resource.create({"service.name": settings.app_name})
        provider = TracerProvider(resource=resource)
        exporter = OTLPSpanExporter(endpoint=f"{settings.otel_exporter_endpoint}/v1/traces")
        provider.add_span_processor(BatchSpanProcessor(exporter))
        trace.set_tracer_provider(provider)
        logger.info("OpenTelemetry tracing initialized.")
    except Exception as exc:  # noqa: BLE001
        logger.warning("OpenTelemetry init skipped: %s", exc)


def get_tracer(name: str = "ase"):
    try:
        from opentelemetry import trace

        return trace.get_tracer(name)
    except Exception:  # noqa: BLE001
        class _NoopSpan:
            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

        class _NoopTracer:
            def start_as_current_span(self, *_args, **_kwargs):
                return _NoopSpan()

        return _NoopTracer()
