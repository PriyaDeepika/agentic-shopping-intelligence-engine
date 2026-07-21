"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Minus, Plus, Sparkles, Trash2 } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { formatINR } from "@/lib/utils";
import { findCoupons, optimizeCart, ApiError } from "@/lib/api/client";
import { getUserId, getSessionId } from "@/lib/api/session";
import { toUIProduct } from "@/types/product";
import type { Coupon } from "@/lib/api/types";

export default function CartPage() {
  const { lines, remove, setQuantity, clear, add, subtotal } = useCart();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [showBudgetField, setShowBudgetField] = useState(false);
  const [budget, setBudget] = useState("");
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<{
    savedAmount: number;
    swappedCount: number;
  } | null>(null);

  useEffect(() => {
    if (subtotal <= 0) {
      setCoupons([]);
      return;
    }
    findCoupons({ cart_total: subtotal, brand_ids: lines.map((l) => l.product.brand) })
      .then((res) => setCoupons(res.applicable_coupons))
      .catch((err) => setCouponError(err instanceof ApiError ? err.message : "Could not check coupons"));
  }, [subtotal, lines]);

  // Duplicate-category / missing-essentials hints — cheap, client-side
  // heuristics that don't need a round-trip to the AI backend, since the
  // cart contents are already known locally.
  const categoryCounts = lines.reduce<Record<string, number>>((acc, l) => {
    acc[l.product.category] = (acc[l.product.category] ?? 0) + 1;
    return acc;
  }, {});
  const duplicateCategories = Object.entries(categoryCounts).filter(([, n]) => n > 1);
  const essentialSlots = ["topwear", "bottomwear", "footwear"];
  const missingEssentials = essentialSlots.filter((slot) => !categoryCounts[slot]);

  async function handleOptimize() {
    const parsedBudget = Number(budget);
    if (!budget || Number.isNaN(parsedBudget) || parsedBudget <= 0) {
      setOptimizeError("Enter a valid budget first.");
      return;
    }
    setOptimizing(true);
    setOptimizeError(null);
    setOptimizeResult(null);
    try {
      const res = await optimizeCart({
        user_id: getUserId(),
        session_id: getSessionId(),
        budget: parsedBudget,
        product_ids: lines.map((l) => l.product.id),
      });

      const originalIds = new Set(lines.map((l) => l.product.id));
      const newIds = new Set(res.cart.items.map((i) => i.product.id));
      const swappedCount = [...originalIds].filter((id) => !newIds.has(id)).length;
      const savedAmount = Math.max(0, subtotal - res.cart.total);

      // The AI backend's cart is now the source of truth for this turn's
      // recommendation — reconcile the client-side (localStorage) cart to
      // match it rather than keeping two carts that disagree.
      clear();
      res.cart.items.forEach((item) => add(toUIProduct(item.product), undefined, item.quantity));

      setOptimizeResult({ savedAmount, swappedCount });
    } catch (err) {
      setOptimizeError(err instanceof ApiError ? err.message : "Could not optimize the cart right now.");
    } finally {
      setOptimizing(false);
    }
  }

  if (lines.length === 0) {
    return (
      <main className="max-w-frame mx-auto px-4 xl:px-0 py-24 text-center">
        <h1 className="font-display text-2xl font-bold mb-3">Your cart is empty</h1>
        <p className="text-ink/50 mb-6">Add something you like — it&apos;ll show up here.</p>
        <Link href="/shop" className="inline-block bg-ink text-white px-6 py-3 rounded-full font-medium">
          Browse products
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Your cart</h1>
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          {lines.map((line) => (
            <div
              key={`${line.product.id}-${line.size}`}
              className="flex gap-4 bg-white border border-line rounded-2xl p-4"
            >
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-panel shrink-0">
                <Image src={line.product.image} alt={line.product.name} fill sizes="96px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{line.product.name}</p>
                <p className="text-xs text-ink/50 mt-0.5">
                  {line.size ? `Size ${line.size}` : null} · {line.product.color}
                </p>
                <p className="font-semibold mt-2">{formatINR(line.product.finalPrice)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => remove(line.product.id, line.size)} aria-label="Remove">
                  <Trash2 size={16} className="text-ink/40 hover:text-red-500" />
                </button>
                <div className="flex items-center gap-2 border border-line rounded-full px-2 py-1">
                  <button onClick={() => setQuantity(line.product.id, line.size, line.quantity - 1)}>
                    <Minus size={12} />
                  </button>
                  <span className="text-sm w-4 text-center">{line.quantity}</span>
                  <button onClick={() => setQuantity(line.product.id, line.size, line.quantity + 1)}>
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {(duplicateCategories.length > 0 || missingEssentials.length > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-1">
              {duplicateCategories.map(([cat, n]) => (
                <p key={cat}>
                  You have {n} items in <span className="capitalize font-medium">{cat}</span> — consider if you need all of them.
                </p>
              ))}
              {missingEssentials.length > 0 && (
                <p>
                  Missing from this outfit:{" "}
                  <span className="font-medium capitalize">{missingEssentials.join(", ")}</span>
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-panel/50 rounded-2xl p-6 h-fit space-y-6">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-ink/60">Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-ink/60">Shipping</span>
              <span className="text-ink/60">Calculated at checkout</span>
            </div>
            <hr className="border-line mb-4" />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatINR(subtotal)}</span>
            </div>
          </div>

          <div className="border-t border-line pt-5">
            {!showBudgetField ? (
              <button
                onClick={() => setShowBudgetField(true)}
                className="w-full flex items-center justify-center gap-2 border border-ink/15 rounded-full py-2.5 text-sm font-medium hover:border-ink/30 transition-colors"
              >
                <Sparkles size={14} /> Optimize My Cart
              </button>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-ink/60">Your budget</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. 3000"
                    className="flex-1 bg-white border border-line rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ink/10"
                  />
                  <button
                    onClick={handleOptimize}
                    disabled={optimizing}
                    className="bg-ink text-white rounded-full px-4 text-sm font-medium disabled:opacity-50"
                  >
                    {optimizing ? "Optimizing…" : "Go"}
                  </button>
                </div>
                {optimizeError && <p className="text-xs text-red-600">{optimizeError}</p>}
                {optimizeResult && (
                  <p className="text-xs text-green-700">
                    {optimizeResult.swappedCount > 0
                      ? `Swapped ${optimizeResult.swappedCount} item(s) and saved ${formatINR(
                          optimizeResult.savedAmount
                        )} — your cart's been updated.`
                      : "Your cart was already within budget — no changes needed."}
                  </p>
                )}
              </div>
            )}
          </div>

          {coupons.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-ink/60">Available coupons</p>
              {coupons.map((c) => (
                <div key={c.code} className="text-xs bg-white border border-line rounded-lg px-3 py-2">
                  <p className="font-semibold">{c.code}</p>
                  <p className="text-ink/50">{c.description}</p>
                </div>
              ))}
            </div>
          )}
          {couponError && <p className="text-xs text-ink/40">{couponError}</p>}

          <button className="w-full bg-ink text-white rounded-full py-3.5 font-medium hover:bg-ink/85 transition-colors">
            Checkout
          </button>
        </div>
      </div>
    </main>
  );
}
