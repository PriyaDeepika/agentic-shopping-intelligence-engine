"""Lightweight timing helpers used to build the Agent Execution Timeline."""
from __future__ import annotations

import time
from contextlib import contextmanager
from dataclasses import dataclass, field


@dataclass
class TimedStep:
    name: str
    duration_seconds: float
    success: bool = True
    error: str | None = None
    meta: dict = field(default_factory=dict)


@contextmanager
def timed(name: str):
    """Context manager that records wall-clock duration of a block."""
    start = time.perf_counter()
    result = {"name": name, "success": True, "error": None}
    try:
        yield result
    except Exception as exc:  # noqa: BLE001 - we want to record and re-raise
        result["success"] = False
        result["error"] = str(exc)
        raise
    finally:
        result["duration_seconds"] = round(time.perf_counter() - start, 4)


def render_timeline(steps: list[TimedStep]) -> str:
    """Render a human-friendly execution timeline, matching the hackathon-demo format:

    ✓ Search Agent .......... 0.4s
    ✓ Trend Agent ........... 0.2s
    """
    lines = ["🧠 Planning..."]
    lines.append("")
    for step in steps:
        mark = "✓" if step.success else "✗"
        label = step.name
        dots = "." * max(2, 28 - len(label))
        lines.append(f"{mark} {label} {dots} {step.duration_seconds:.1f}s")
    lines.append("")
    if all(s.success for s in steps):
        lines.append("✔ Shopping plan ready!")
    else:
        lines.append("⚠ Shopping plan completed with errors — see logs.")
    return "\n".join(lines)
