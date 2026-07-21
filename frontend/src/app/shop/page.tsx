"use client";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Sparkles, X } from "lucide-react";
import Filters from "@/components/shop/Filters";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";
import OfflineBanner from "@/components/common/OfflineBanner";
import { askAI } from "@/components/ai/FloatingAssistant";
import { deriveFacets, filterCatalog, safeGetCatalog, type FilterState } from "@/lib/catalog";
import type { UIProduct } from "@/types/product";

const PAGE_SIZE = 20;

function ShopContent() {
  const router = useRouter();
  const params = useSearchParams();

  const [all, setAll] = useState<UIProduct[]>([]);
  const [online, setOnline] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    safeGetCatalog().then((res) => {
      setAll(res.products);
      setOnline(res.online);
      setError(res.error);
      setLoading(false);
    });
  }, []);

  const filters: FilterState = useMemo(
    () => ({
      q: params.get("q") || undefined,
      category: params.get("category") || undefined,
      gender: params.get("gender") || undefined,
      articleType: params.get("articleType") || undefined,
      color: params.get("color") || undefined,
      usage: params.get("usage") || undefined,
      season: params.get("season") || undefined,
      sort: (params.get("sort") as FilterState["sort"]) || "featured",
      maxPrice: params.get("maxPrice") ? Number(params.get("maxPrice")) : undefined,
    }),
    [params]
  );

  const facets = useMemo(() => deriveFacets(all), [all]);
  const onSaleOnly = params.get("onSale") === "1";
  let filtered = useMemo(() => filterCatalog(all, filters), [all, filters]);
  if (onSaleOnly) filtered = filtered.filter((p) => p.discountPct > 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [filters, onSaleOnly]);

  function updateFilters(next: FilterState) {
    const qs = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v !== undefined && v !== "" && v !== "featured") qs.set(k, String(v));
    });
    router.push(`/shop${qs.toString() ? `?${qs.toString()}` : ""}`);
  }

  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-bold">
            {filters.q ? `Results for “${filters.q}”` : "All products"}
          </h1>
          <p className="text-sm text-ink/50 mt-1">{filtered.length} products</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="lg:hidden flex items-center gap-1 text-sm border border-line rounded-full px-3 py-1.5"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal size={14} /> Filters
          </button>
          <select
            value={filters.sort}
            onChange={(e) => updateFilters({ ...filters, sort: e.target.value as FilterState["sort"] })}
            className="text-sm border border-line rounded-full px-3 py-1.5 bg-white"
          >
            <option value="featured">Featured</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      {!online && <OfflineBanner error={error} />}

      <div className="flex gap-10">
        <div className="hidden lg:block">
          <Filters facets={facets} value={filters} onChange={updateFilters} onClear={() => router.push("/shop")} />
        </div>

        {mobileFiltersOpen && (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setMobileFiltersOpen(false)}>
            <div
              className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-canvas p-5 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button className="mb-4" onClick={() => setMobileFiltersOpen(false)}>
                <X size={20} />
              </button>
              <Filters facets={facets} value={filters} onChange={updateFilters} onClear={() => router.push("/shop")} />
            </div>
          </div>
        )}

        <div className="flex-1">
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : filtered.length === 0 && filters.q ? (
            <div className="text-center py-16 border border-dashed border-line rounded-2xl">
              <p className="text-ink/50 mb-4">
                No products match &ldquo;{filters.q}&rdquo; in the catalog.
              </p>
              <button
                onClick={() => askAI(`Find me: ${filters.q}`)}
                className="inline-flex items-center gap-2 bg-ink text-white rounded-full px-5 py-2.5 text-sm font-medium hover:bg-ink/85 transition-colors"
              >
                <Sparkles size={14} /> Ask AI to find something like this
              </button>
            </div>
          ) : (
            <>
              <ProductGrid products={pageItems} />
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i + 1)}
                      className={`w-9 h-9 rounded-full text-sm ${
                        page === i + 1 ? "bg-ink text-white" : "bg-white border border-line"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ProductGridSkeleton count={12} />}>
      <ShopContent />
    </Suspense>
  );
}
