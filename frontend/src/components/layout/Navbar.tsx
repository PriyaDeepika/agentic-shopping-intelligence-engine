"use client";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import { useCart } from "@/lib/hooks/useCart";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { safeGetCatalog, searchSuggestions } from "@/lib/catalog";
import type { UIProduct } from "@/types/product";

const NAV_LINKS = [
  { label: "Shop All", href: "/shop" },
  { label: "Women", href: "/shop?gender=women" },
  { label: "Men", href: "/shop?gender=men" },
  { label: "Footwear", href: "/shop?category=Shoes" },
  { label: "Accessories", href: "/shop?category=Bags" },
];

export default function Navbar() {
  const router = useRouter();
  const { count } = useCart();
  const { ids } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UIProduct[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    let active = true;
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    safeGetCatalog().then(({ products }) => {
      if (!active) return;
      setSuggestions(searchSuggestions(products, query, 6));
    });
    return () => {
      active = false;
    };
  }, [query]);

  function submitSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 bg-canvas/95 backdrop-blur border-b border-line">
      <div className="max-w-frame mx-auto px-4 xl:px-0 flex items-center gap-4 py-4">
        <button
          className="md:hidden p-1"
          aria-label="Open menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="font-display font-bold text-2xl tracking-tight shrink-0">
          Thread<span className="text-accent">loop</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 ml-4">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-ink/70 hover:text-ink transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div ref={boxRef} className="relative flex-1 max-w-md ml-auto hidden sm:block">
          <form onSubmit={submitSearch} className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
            />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search by name, type, colour, brand…"
              className="w-full bg-panel/70 rounded-full pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ink/20"
            />
          </form>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute mt-2 w-full bg-white rounded-2xl shadow-xl border border-line overflow-hidden">
              {suggestions.map((p) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}/${p.slug}`}
                  onClick={() => setShowSuggestions(false)}
                  className="flex items-center gap-3 px-3 py-2 hover:bg-panel/60 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-panel overflow-hidden shrink-0 relative">
                    <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm truncate">{p.name}</p>
                    <p className="text-xs text-ink/50">{formatINR(p.finalPrice)}</p>
                  </div>
                </Link>
              ))}
              <button
                onClick={submitSearch}
                className="w-full text-left px-3 py-2 text-sm font-medium text-accent hover:bg-panel/60"
              >
                See all results for “{query}”
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-auto sm:ml-0">
          <Link href="/wishlist" className="relative p-2" aria-label="Wishlist">
            <Heart size={20} />
            {ids.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {ids.length}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative p-2" aria-label="Cart">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-accent text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-line px-4 py-3 flex flex-col gap-3">
          <form onSubmit={submitSearch} className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-full bg-panel/70 rounded-full pl-9 pr-4 py-2 text-sm outline-none"
            />
          </form>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className={cn("text-sm font-medium py-1")}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
