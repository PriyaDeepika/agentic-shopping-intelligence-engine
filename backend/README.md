# Agentic Shopping Intelligence Engine

A production-shaped, multi-agent **AI backend** for fashion e-commerce. It plugs
into any existing storefront (Next.js or otherwise) over HTTP — this repo
contains **no frontend and no e-commerce app**, only the AI orchestration layer.

Given a shopping goal in natural language, it plans, invokes specialist agents,
optimizes the outfit/budget/coupons, maintains a cart, remembers preferences
across sessions, and returns an explained, finished shopping plan — instead of
just chatting about products.

## Architecture

```
User message
    │
    ▼
Shopping Orchestrator (LangGraph)
    │  1. Planning node: intent classification + parameter extraction
    │  2. Dynamic routing based on the plan
    ▼
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬────────────┬──────────────────┐
│ Search Agent│ Trend Agent │ Outfit Agent│ Budget Agent│ Coupon Agent│ Cart Agent │ Explanation Agent│
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴────────────┴──────────────────┘
    │
    ▼
Merge node → final reply + cart + explanations + agent execution timeline
```

The **Shopping Orchestrator never contains business logic** — it only
classifies intent (`app/orchestrator/planner.py`), builds a routing plan, and
merges results (`app/orchestrator/graph.py`). Each agent
(`app/agents/*_agent.py`) is a self-contained LangGraph node with one clear
responsibility, timing, structured logging, and error isolation
(`app/agents/base.py`) — a failing agent never crashes the graph.

### Agents

| Agent | Responsibility |
|---|---|
| Search Agent | Semantic search, filtering, ranking (FAISS + embeddings) |
| Trend Agent | Aesthetic reasoning (Y2K, Old Money, Minimal, Streetwear, Korean, Boho, Quiet Luxury) — semantic, not keyword |
| Outfit Agent | Assembles complete outfits: color matching, occasion reasoning, accessories |
| Budget Agent | Optimizes the cart under a budget by substituting cheaper, comparable items |
| Coupon Agent | Finds bundle/loyalty/flat coupons and calculates best savings |
| Cart Agent | Single source of truth for the cart; supports full rebuild *or* targeted deltas (swap/remove/qty) |
| Wardrobe Agent | Detects duplicate purchases against an owned wardrobe, recommends complements |
| Explanation Agent | Generates human-readable "why this was picked" reasons per product |

### Delta updates (no full recompute)

"Remove jeans, replace with cargo" routes straight to the **Cart Agent** with
`delta_only=True` — the orchestrator's plan for `modify_cart` intent skips
search/trend/outfit entirely, per the spec's requirement to update only the
affected parts of the plan.

### Memory

Two tiers, both Redis-backed with an automatic in-process fallback (so the
whole system runs with **zero infrastructure** for local dev/tests):

- **Long-term user memory** (`app/memory/memory_store.py`): budget, favorite
  brands/colors, sizes, rejected products, wardrobe, preferences — keyed by
  `user_id`, survives across conversations.
- **Session state** (`app/state/session_store.py`): current cart, last agent
  timeline — keyed by `session_id`, used for delta updates within a
  conversation.

> Note: without a real Redis instance running, the in-process fallback store
> only persists for the lifetime of a single process/worker — fine for local
> dev and the test suite, but you should run Redis (see `docker-compose.yml`)
> for anything multi-worker or genuinely persistent.

### Execution timeline (for demos)

Every `/chat` and `/recommend` response includes `timeline_text`:

```
🧠 Planning...

✓ Search Agent .......... 0.4s
✓ Trend Agent ........... 0.2s
✓ Outfit Agent .......... 0.6s
✓ Budget Agent .......... 0.3s
✓ Coupon Agent .......... 0.2s
✓ Cart Agent ............ 0.1s

✔ Shopping plan ready!
```

plus a structured `agent_timeline` (duration, confidence, reasoning summary,
errors, token usage per agent) for building a live UI visualization.

## Tech stack

Python · FastAPI · LangGraph · LangChain · FAISS · PostgreSQL · Redis ·
Pydantic · OpenAI/Gemini-compatible LLM client · async throughout · Docker-ready.

## Folder structure

```
app/
  agents/        # one file per specialist agent, all extend BaseAgent
  orchestrator/   # graph.py (LangGraph wiring), planner.py (intent+routing), runner.py (API glue)
  retrieval/      # FAISS index + product loader
  embeddings/     # embedding provider abstraction (local/OpenAI/hash fallback)
  memory/         # Redis client + long-term memory store
  state/          # shared LangGraph state schema + session store
  api/            # one file per route group
  models/         # Product domain model + API request/response schemas
  services/       # LLM client, structured logging / observability
  prompts/        # (extension point) shared prompt templates
  utils/          # config, timing/telemetry helpers
  tests/          # pytest suite (offline, no infra required)
data/
  products.json   # sample catalog — swap for a DB-backed loader in production
```

## Running locally (no infra required)

```bash
pip install -r requirements.txt
cp .env.example .env      # defaults to LLM_PROVIDER=mock, fully offline
uvicorn app.main:app --reload
```

Then:

```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "u1", "session_id": "s1",
    "message": "I need three outfits for college. Budget 3500. I already own white sneakers. I like Korean oversized fashion."
  }'
```

## Running with Docker (full stack incl. Redis + Postgres)

```bash
docker compose up --build
```

## Enabling a real LLM

Set in `.env`:
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini
```
(or `LLM_PROVIDER=gemini` with `GEMINI_API_KEY`). Everything else — agents,
graph, API — is provider-agnostic; only `app/services/llm_client.py` changes.

## Tests

```bash
pytest -v
```
13 tests covering agent behavior, delta updates, budget optimization,
memory round-trips, and the planner's intent/parameter extraction — all run
fully offline.

## API surface

| Endpoint | Purpose |
|---|---|
| `POST /chat` | Main conversational entrypoint — runs the full agent graph |
| `POST /search` | Direct Search Agent access |
| `POST /optimize` | Direct Budget Agent access |
| `POST /cart` | Direct cart mutation (add/remove/swap/qty) via Cart Agent |
| `POST /wardrobe` | Wardrobe Agent — duplicate detection + complements |
| `POST /recommend` | One-shot goal → full shopping plan |
| `POST /coupon` | Direct Coupon Agent access |
| `POST /memory`, `GET /memory/{user_id}` | Long-term memory read/write |
| `POST /agent/debug` | Inspect last agent timeline + state for a session |
| `GET /health` | Health check |

## Extension points

- **New agent**: add `app/agents/new_agent.py` extending `BaseAgent`, register
  it in `_AGENT_REGISTRY` in `app/orchestrator/graph.py`, and add it to the
  relevant intent's plan in `app/orchestrator/planner.py`.
- **New LLM provider**: extend `app/services/llm_client.py`.
- **Real product DB**: swap `app/retrieval/product_loader.py`'s JSON read for
  a Postgres query — the rest of the pipeline (FAISS index, agents) is
  unaffected since they only depend on the `Product` model.
- **LangSmith / OpenTelemetry**: set `LANGCHAIN_TRACING_V2=true` /
  `OTEL_ENABLED=true` in `.env`; hooks already exist in
  `app/services/logger_service.py`.
