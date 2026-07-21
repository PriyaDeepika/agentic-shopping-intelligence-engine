"use client";
import { useEffect, useState } from "react";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { submitWardrobe, ApiError } from "@/lib/api/client";
import { getUserId } from "@/lib/api/session";
import { askAI } from "@/components/ai/FloatingAssistant";
import ProductSuggestion from "@/components/ai/ProductSuggestion";
import type { BackendProduct, WardrobeItemInput } from "@/lib/api/types";

const STORAGE_KEY = "tl_wardrobe_items_v1";
const QUICK_QUESTIONS = [
  "What matches these jeans?",
  "What shoes should I wear?",
  "What can I buy to complete this outfit?",
];

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItemInput[]>([]);
  const [draft, setDraft] = useState<WardrobeItemInput>({ name: "", category: "", color: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarnings, setDuplicateWarnings] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<BackendProduct[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addDraft() {
    if (!draft.name.trim() || !draft.category.trim()) return;
    setItems((prev) => [...prev, { ...draft, tags: [] }]);
    setDraft({ name: "", category: "", color: "" });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveWardrobe() {
    if (items.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await submitWardrobe({ user_id: getUserId(), items });
      setDuplicateWarnings(res.duplicate_warnings);
      setRecommendations(res.complementary_recommendations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save your wardrobe right now.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h1 className="font-display text-3xl font-bold mb-2">Your wardrobe</h1>
      <p className="text-ink/50 mb-8 max-w-lg">
        Describe what you already own so the AI stylist can build outfits around it instead of
        recommending things you don&apos;t need. (Image upload isn&apos;t wired up yet — describe
        each piece for now.)
      </p>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-panel/50 rounded-2xl p-5">
            <p className="text-sm font-semibold mb-3">Add an item</p>
            <div className="grid sm:grid-cols-3 gap-3 mb-3">
              <input
                value={draft.name}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Blue slim jeans"
                className="bg-white border border-line rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10 sm:col-span-1"
              />
              <input
                value={draft.category}
                onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                placeholder="Category (e.g. bottomwear)"
                className="bg-white border border-line rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
              <input
                value={draft.color}
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
                placeholder="Color"
                className="bg-white border border-line rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10"
              />
            </div>
            <button
              onClick={addDraft}
              className="flex items-center gap-1.5 text-sm font-medium text-ink/70 hover:text-ink"
            >
              <Plus size={15} /> Add to wardrobe list
            </button>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              {items.map((item, i) => (
                <div
                  key={`${item.name}-${i}`}
                  className="flex items-center justify-between bg-white border border-line rounded-xl px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-ink/50 capitalize">
                      {item.category}
                      {item.color ? ` · ${item.color}` : ""}
                    </p>
                  </div>
                  <button onClick={() => removeItem(i)} aria-label="Remove item">
                    <Trash2 size={15} className="text-ink/40 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={saveWardrobe}
            disabled={items.length === 0 || saving}
            className="bg-ink text-white rounded-full px-6 py-3 text-sm font-medium disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save wardrobe"}
          </button>
          {error && <p className="text-xs text-red-600">{error}</p>}

          {duplicateWarnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
              {duplicateWarnings.map((w, i) => (
                <p key={i}>{w}</p>
              ))}
            </div>
          )}
        </div>

        <div className="bg-panel/50 rounded-2xl p-6 h-fit">
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Sparkles size={14} /> Ask about your wardrobe
          </p>
          <div className="flex flex-col gap-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => askAI(q)}
                className="text-left text-xs bg-white border border-line rounded-lg px-3 py-2 hover:border-ink/30 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {recommendations.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold text-ink/60 mb-3">Fills a gap in your wardrobe</p>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {recommendations.map((p) => (
                  <ProductSuggestion key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
