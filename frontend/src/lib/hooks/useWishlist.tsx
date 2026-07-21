"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface WishlistCtx {
  ids: string[];
  toggle: (id: string) => void;
  has: (id: string) => boolean;
}

const Ctx = createContext<WishlistCtx | null>(null);
const KEY = "tl_wishlist_v1";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setIds(JSON.parse(raw));
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  }, [ids, hydrated]);

  const toggle = (id: string) =>
    setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const has = (id: string) => ids.includes(id);

  return <Ctx.Provider value={{ ids, toggle, has }}>{children}</Ctx.Provider>;
}

export function useWishlist() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
