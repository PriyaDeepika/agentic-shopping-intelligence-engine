"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { safeGetCatalog } from "@/lib/catalog";
import { ProductGrid, ProductGridSkeleton } from "@/components/product/ProductGrid";
import type { UIProduct } from "@/types/product";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const [all, setAll] = useState<UIProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    safeGetCatalog().then((res) => {
      setAll(res.products);
      setLoading(false);
    });
  }, []);

  const items = all.filter((p) => ids.includes(p.id));

  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-8">
      <h1 className="font-display text-3xl font-bold mb-8">Your wishlist</h1>
      {loading ? (
        <ProductGridSkeleton count={8} />
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-ink/50 mb-6">Nothing saved yet.</p>
          <Link href="/shop" className="inline-block bg-ink text-white px-6 py-3 rounded-full font-medium">
            Browse products
          </Link>
        </div>
      ) : (
        <ProductGrid products={items} />
      )}
    </main>
  );
}
