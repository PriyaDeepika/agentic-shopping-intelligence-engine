"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { chat, ApiError, type ApiErrorKind } from "@/lib/api/client";
import { getUserId, getSessionId } from "@/lib/api/session";
import type { AgentTrace, BackendProduct, ExplanationItem } from "@/lib/api/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  products?: { product: BackendProduct; quantity: number }[];
  explanations?: ExplanationItem[];
  agentTimeline?: AgentTrace[];
  isError?: boolean;
}

const STORAGE_KEY = "tl_ai_chat_history_v1";
const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  text: "Hi! I'm your AI stylist. Ask me for an outfit, a budget pick, or anything else you're shopping for — e.g. \u201ca minimal outfit under \u20b93000\u201d.",
};

// The multi-agent pipeline behind /chat (search -> trend -> outfit -> budget
// -> coupon -> cart -> explanation, see backend app/orchestrator/planner.py)
// runs as one blocking request today — there's no SSE/streaming from the
// backend, so this can't show *literal* live agent status. Cycling through
// the known pipeline stages while the request is in flight is an honest
// progress *indicator* (not a fabricated live trace) and reads far better
// than a single spinner.
export const CHAT_PROGRESS_STAGES = [
  "Searching…",
  "Finding outfits…",
  "Optimizing budget…",
  "Applying coupons…",
  "Generating explanations…",
];

// One-tap entry points into the assistant's supported capabilities (search,
// outfit suggestions, budget shopping, coupons, trends, gifts) — shown only
// in the empty/welcome state so returning users with real history aren't
// crowded by them.
export const QUICK_PROMPTS = [
  { label: "Suggest an outfit", message: "Suggest an outfit for me." },
  { label: "Shop on a budget", message: "I have a budget of ₹2000, what can I get?" },
  { label: "What's trending?", message: "What's trending right now?" },
  { label: "Find a gift", message: "I need a gift recommendation." },
  { label: "Any coupons?", message: "What coupons or discounts are available?" },
  { label: "Compare two items", message: "Can you help me compare two products?" },
];

function errorCopyFor(kind: ApiErrorKind, fallback: string): string {
  switch (kind) {
    case "network":
      return "Backend unavailable \u2014 I can't reach the styling engine right now.";
    case "timeout":
      return "That took a bit too long, so I stopped waiting. Please try again.";
    case "server":
      return "Something went wrong inside the styling engine (internal error).";
    case "not_found":
      return "I couldn't find anything for that request.";
    default:
      return fallback || "That request wasn't quite right \u2014 could you rephrase it?";
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [loading, setLoading] = useState(false);
  const [progressStage, setProgressStage] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatMessage[];
        if (Array.isArray(parsed) && parsed.length > 0) setMessages(parsed);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages, hydrated]);

  useEffect(() => () => {
    if (progressTimer.current) clearInterval(progressTimer.current);
  }, []);

  const send = useCallback(async (text: string) => {
    const message = text.trim();
    if (!message) return;

    setMessages((prev) => [...prev, { id: `${Date.now()}-u`, role: "user", text: message }]);
    setLoading(true);
    setProgressStage(0);
    progressTimer.current = setInterval(() => {
      setProgressStage((p) => Math.min(p + 1, CHAT_PROGRESS_STAGES.length - 1));
    }, 700);

    try {
      const res = await chat({ user_id: getUserId(), session_id: getSessionId(), message });
      const noResults = res.cart.items.length === 0;
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-a`,
          role: "assistant",
          text: noResults
            ? "I couldn't find anything matching that \u2014 try loosening the budget, color, or category."
            : res.reply,
          products: res.cart.items,
          explanations: res.explanations,
          agentTimeline: res.agent_timeline,
        },
      ]);
    } catch (err) {
      const kind = err instanceof ApiError ? err.kind : "network";
      const detail = err instanceof ApiError ? err.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-e`, role: "assistant", text: errorCopyFor(kind, detail), isError: true },
      ]);
    } finally {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
        progressTimer.current = null;
      }
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => setMessages([WELCOME]), []);

  return { messages, loading, progressStage, send, clear };
}
