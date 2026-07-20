"use client";

import React, { useState } from "react";
import { getRecommendation, ApiError } from "@/lib/api/client";
import { getUserId, getSessionId } from "@/lib/api/session";
import { useToast } from "@/components/ui/Toast";
import SpinnerbLoader from "@/components/ui/SpinnerbLoader";
import AgentResultCart from "./AgentResultCart";
import type { RecommendResponse } from "@/lib/api/types";

const AESTHETICS = ["minimal", "streetwear", "korean", "old money", "y2k", "formal"];

const RecommendPanel = () => {
  const [goal, setGoal] = useState("");
  const [budget, setBudget] = useState("");
  const [aesthetic, setAesthetic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecommendResponse | null>(null);
  const [touched, setTouched] = useState(false);
  const { showToast } = useToast();

  const goalError = touched && goal.trim().length < 3 ? "Tell me a bit more about what you need." : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (goal.trim().length < 3) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await getRecommendation({
        user_id: getUserId(),
        session_id: getSessionId(),
        goal: goal.trim(),
        budget: budget ? Number(budget) : undefined,
        aesthetic: aesthetic || undefined,
      });
      setResult(res);
      showToast({
        variant: "success",
        title: "Recommendation ready",
        description: res.reply.slice(0, 90),
      });
    } catch (err) {
      showToast({
        variant: "error",
        title: "Couldn't get a recommendation",
        description: err instanceof ApiError ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label className="block text-sm font-semibold mb-1.5" htmlFor="goal">
            What are you shopping for? *
          </label>
          <textarea
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            onBlur={() => setTouched(true)}
            rows={3}
            placeholder="e.g. an outfit for a college fest, streetwear vibe"
            className={`w-full rounded-xl border px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-shadow ${
              goalError
                ? "border-red-400 focus:ring-red-200"
                : "border-black/10 focus:ring-black/20"
            }`}
          />
          {goalError && <p className="text-xs text-red-600 mt-1">{goalError}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="budget">
              Budget (optional)
            </label>
            <input
              id="budget"
              type="number"
              min={0}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 3000"
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" htmlFor="aesthetic">
              Aesthetic (optional)
            </label>
            <select
              id="aesthetic"
              value={aesthetic}
              onChange={(e) => setAesthetic(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black/20"
            >
              <option value="">Any</option>
              {AESTHETICS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-black text-white py-3.5 font-medium text-sm hover:bg-black/85 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && (
            <SpinnerbLoader className="w-4 border-2 border-white/30 border-r-white" />
          )}
          {loading ? "Thinking…" : "Get Recommendation"}
        </button>
      </form>

      <div>
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-black/5 rounded-xl" />
            <div className="h-16 bg-black/5 rounded-xl" />
            <div className="h-16 bg-black/5 rounded-xl" />
          </div>
        )}
        {!loading && result && (
          <div className="space-y-4">
            <p className="text-sm bg-black/[0.03] rounded-xl p-4">{result.reply}</p>
            <AgentResultCart cart={result.cart} />
          </div>
        )}
        {!loading && !result && (
          <div className="h-full flex items-center justify-center text-center text-sm text-black/40 border border-dashed border-black/15 rounded-xl p-10">
            Your AI-curated outfit will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendPanel;
