"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { listProducts, optimizeBudget, ApiError } from "@/lib/api/client";
import { getUserId, getSessionId } from "@/lib/api/session";
import { toUIProducts, UIProduct } from "@/lib/api/adapters";
import { useToast } from "@/components/ui/Toast";
import SpinnerbLoader from "@/components/ui/SpinnerbLoader";
import AgentResultCart from "./AgentResultCart";
import type { OptimizeResponse } from "@/lib/api/types";

const OptimizePanel = () => {
  const [catalog, setCatalog] = useState<UIProduct[] | null>(null);
  const [catalogError, setCatalogError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [budget, setBudget] = useState("2000");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizeResponse | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    listProducts({ page_size: 50 })
      .then((res) => {
        if (!cancelled) setCatalog(toUIProducts(res.items));
      })
      .catch((err) => {
        if (!cancelled) {
          setCatalogError(err instanceof ApiError ? err.message : "Unknown error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (backendId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(backendId)) next.delete(backendId);
      else next.add(backendId);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selected.size === 0) {
      showToast({
        variant: "error",
        title: "Pick at least one product",
        description: "Select items from the catalog to optimize.",
      });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await optimizeBudget({
        user_id: getUserId(),
        session_id: getSessionId(),
        budget: Number(budget) || 0,
        product_ids: Array.from(selected),
      });
      setResult(res);
      showToast({
        variant: "success",
        title: "Cart optimized",
        description: `Total: $${res.cart.total.toFixed(2)}`,
      });
    } catch (err) {
      showToast({
        variant: "error",
        title: "Couldn't optimize",
        description: err instanceof ApiError ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" htmlFor="opt-budget">
            Your budget
          </label>
          <input
            id="opt-budget"
            type="number"
            min={0}
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            className="w-full rounded-xl border border-black/10 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
          />
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">
            Pick products to optimize ({selected.size} selected)
          </p>
          {catalogError && (
            <p className="text-xs text-red-600 mb-2">
              Couldn't load catalog: {catalogError}
            </p>
          )}
          {!catalog && !catalogError && (
            <div className="flex items-center gap-2 text-sm text-black/50 py-6">
              <SpinnerbLoader className="w-4 border-2 border-black/20 border-r-black/60" />
              Loading catalog…
            </div>
          )}
          {catalog && (
            <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {catalog.map((p) => (
                <label
                  key={p.backendId}
                  className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer text-xs transition-colors ${
                    selected.has(p.backendId)
                      ? "border-black bg-black/[0.04]"
                      : "border-black/10 hover:border-black/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(p.backendId)}
                    onChange={() => toggle(p.backendId)}
                    className="accent-black"
                  />
                  <Image
                    src={p.srcUrl}
                    width={32}
                    height={32}
                    alt={p.title}
                    className="rounded object-cover w-8 h-8 shrink-0"
                  />
                  <span className="flex-1 truncate">{p.title}</span>
                  <span className="font-semibold shrink-0">${p.price}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !catalog}
          className="w-full rounded-full bg-black text-white py-3.5 font-medium text-sm hover:bg-black/85 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && (
            <SpinnerbLoader className="w-4 border-2 border-white/30 border-r-white" />
          )}
          {loading ? "Optimizing…" : "Optimize My Cart"}
        </button>
      </form>

      <div>
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-black/5 rounded-xl" />
            <div className="h-16 bg-black/5 rounded-xl" />
          </div>
        )}
        {!loading && result && <AgentResultCart cart={result.cart} />}
        {!loading && !result && (
          <div className="h-full flex items-center justify-center text-center text-sm text-black/40 border border-dashed border-black/15 rounded-xl p-10">
            Your budget-optimized cart will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default OptimizePanel;
