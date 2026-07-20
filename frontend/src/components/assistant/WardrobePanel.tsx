"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { submitWardrobe, ApiError } from "@/lib/api/client";
import { getUserId } from "@/lib/api/session";
import { toUIProduct } from "@/lib/api/adapters";
import { useToast } from "@/components/ui/Toast";
import SpinnerbLoader from "@/components/ui/SpinnerbLoader";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import type { WardrobeResponse } from "@/lib/api/types";

const CATEGORIES = ["topwear", "bottomwear", "footwear", "accessory"];

interface DraftItem {
  name: string;
  category: string;
  color: string;
  tags: string;
}

const emptyItem = (): DraftItem => ({ name: "", category: "topwear", color: "", tags: "" });

const WardrobePanel = () => {
  const [items, setItems] = useState<DraftItem[]>([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WardrobeResponse | null>(null);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  const updateItem = (idx: number, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);
  const removeItem = (idx: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valid = items.filter((it) => it.name.trim() && it.color.trim());
    if (valid.length === 0) {
      setError("Add at least one item with a name and color.");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);
    try {
      const res = await submitWardrobe({
        user_id: getUserId(),
        items: valid.map((it) => ({
          name: it.name.trim(),
          category: it.category,
          color: it.color.trim(),
          tags: it.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        })),
      });
      setResult(res);
      showToast({
        variant: "success",
        title: "Wardrobe updated",
        description: `${res.wardrobe_size} item(s) tracked.`,
      });
    } catch (err) {
      showToast({
        variant: "error",
        title: "Couldn't save wardrobe",
        description: err instanceof ApiError ? err.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-black/60">
          Tell the Wardrobe Agent what you already own, and it'll flag duplicates and
          suggest pieces that complement your closet.
        </p>
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-black/10 p-3 space-y-2 relative"
            >
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="absolute top-2 right-2 text-black/30 hover:text-red-600 transition-colors"
                  aria-label="Remove item"
                >
                  <FiTrash2 size={15} />
                </button>
              )}
              <input
                value={item.name}
                onChange={(e) => updateItem(idx, { name: e.target.value })}
                placeholder="Item name (e.g. blue denim jacket)"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/15"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={item.category}
                  onChange={(e) => updateItem(idx, { category: e.target.value })}
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm bg-white"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  value={item.color}
                  onChange={(e) => updateItem(idx, { color: e.target.value })}
                  placeholder="Color"
                  className="rounded-lg border border-black/10 px-3 py-2 text-sm"
                />
              </div>
              <input
                value={item.tags}
                onChange={(e) => updateItem(idx, { tags: e.target.value })}
                placeholder="Tags, comma separated (e.g. denim, casual)"
                className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-sm font-medium text-black/70 hover:text-black transition-colors"
        >
          <FiPlus /> Add another item
        </button>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-black text-white py-3.5 font-medium text-sm hover:bg-black/85 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading && (
            <SpinnerbLoader className="w-4 border-2 border-white/30 border-r-white" />
          )}
          {loading ? "Analyzing…" : "Analyze My Wardrobe"}
        </button>
      </form>

      <div>
        {loading && (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 bg-black/5 rounded-xl" />
            <div className="h-16 bg-black/5 rounded-xl" />
          </div>
        )}
        {!loading && result && (
          <div className="space-y-4">
            <div className="rounded-xl bg-black/[0.03] p-4 text-sm">
              <p>
                Tracking <strong>{result.wardrobe_size}</strong> item(s) for you.
              </p>
              {result.duplicate_warnings.length > 0 && (
                <ul className="mt-2 list-disc list-inside text-amber-700">
                  {result.duplicate_warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
            {result.complementary_recommendations.length > 0 && (
              <div>
                <p className="font-semibold text-sm mb-2">Pairs well with your wardrobe:</p>
                <div className="grid grid-cols-2 gap-3">
                  {result.complementary_recommendations.map((p) => {
                    const ui = toUIProduct(p);
                    return (
                      <Link
                        key={p.id}
                        href={`/shop/product/${ui.id}/${ui.title.split(" ").join("-")}`}
                        className="rounded-xl border border-black/10 p-2 hover:border-black/30 transition-colors"
                      >
                        <Image
                          src={ui.srcUrl}
                          width={100}
                          height={100}
                          alt={ui.title}
                          className="w-full aspect-square object-cover rounded-lg mb-1.5"
                        />
                        <p className="text-xs font-medium truncate">{ui.title}</p>
                        <p className="text-xs text-black/50">${ui.price}</p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
        {!loading && !result && (
          <div className="h-full flex items-center justify-center text-center text-sm text-black/40 border border-dashed border-black/15 rounded-xl p-10">
            Wardrobe insights will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default WardrobePanel;
