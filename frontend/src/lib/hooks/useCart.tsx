"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { UIProduct } from "@/types/product";

export interface CartLine {
  product: UIProduct;
  quantity: number;
  size?: string;
}

interface CartCtx {
  lines: CartLine[];
  add: (product: UIProduct, size?: string, qty?: number) => void;
  remove: (productId: string, size?: string) => void;
  setQuantity: (productId: string, size: string | undefined, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
}

const Ctx = createContext<CartCtx | null>(null);
const KEY = "tl_cart_v1";

function lineKey(id: string, size?: string) {
  return `${id}::${size ?? ""}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add: CartCtx["add"] = (product, size, qty = 1) => {
    setLines((prev) => {
      const key = lineKey(product.id, size);
      const existing = prev.find((l) => lineKey(l.product.id, l.size) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l.product.id, l.size) === key ? { ...l, quantity: l.quantity + qty } : l
        );
      }
      return [...prev, { product, quantity: qty, size }];
    });
  };

  const remove: CartCtx["remove"] = (productId, size) => {
    setLines((prev) => prev.filter((l) => lineKey(l.product.id, l.size) !== lineKey(productId, size)));
  };

  const setQuantity: CartCtx["setQuantity"] = (productId, size, qty) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => lineKey(l.product.id, l.size) !== lineKey(productId, size));
      return prev.map((l) =>
        lineKey(l.product.id, l.size) === lineKey(productId, size) ? { ...l, quantity: qty } : l
      );
    });
  };

  const clear = () => setLines([]);

  const count = useMemo(() => lines.reduce((s, l) => s + l.quantity, 0), [lines]);
  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.product.finalPrice * l.quantity, 0),
    [lines]
  );

  return (
    <Ctx.Provider value={{ lines, add, remove, setQuantity, clear, count, subtotal }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
