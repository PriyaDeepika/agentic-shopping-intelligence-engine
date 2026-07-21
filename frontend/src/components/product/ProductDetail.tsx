"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Sparkles, Star, Truck } from "lucide-react";
import { useCart } from "@/lib/hooks/useCart";
import { useWishlist } from "@/lib/hooks/useWishlist";
import { formatINR, cn } from "@/lib/utils";
import { ProductGrid } from "@/components/product/ProductGrid";
import { askAI } from "@/components/ai/FloatingAssistant";
import type { UIProduct } from "@/types/product";

const ASK_AI_PROMPTS = [
  "Should I buy this?",
  "Compare with similar products.",
  "Is this worth the price?",
];

export default function ProductDetail({
  product,
  similar,
}: {
  product: UIProduct;
  similar: UIProduct[];
}) {
  const { add } = useCart();
  const { has, toggle } = useWishlist();
  const [size, setSize] = useState<string | undefined>(product.sizes[0]);
  const [imgError, setImgError] = useState(false);
  const [added, setAdded] = useState(false);
  const wished = has(product.id);

  return (
    <main className="max-w-frame mx-auto px-4 xl:px-0 py-8">
      <p className="text-xs text-ink/50 mb-6">
        <Link href="/shop">Shop</Link> / <Link href={`/shop?category=${product.category}`}>{product.category}</Link> / {product.name}
      </p>

      <div className="grid md:grid-cols-2 gap-10">
        <div className="relative bg-panel rounded-3xl aspect-square overflow-hidden">
          {!imgError ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              onError={() => setImgError(true)}
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink/30 px-8 text-center">
              {product.name}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-ink/40 mb-2">{product.brand}</p>
          <h1 className="font-display text-3xl font-bold mb-3">{product.name}</h1>
          <div className="flex items-center gap-2 mb-4 text-sm">
            <div className="flex items-center gap-1">
              <Star size={14} className="fill-ink text-ink" />
              {product.rating.toFixed(1)}
            </div>
            <span className="text-ink/40">·</span>
            <span className="text-ink/60 capitalize">{product.gender}</span>
            <span className="text-ink/40">·</span>
            <span className="text-ink/60">{product.color}</span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-semibold">{formatINR(product.finalPrice)}</span>
            {product.discountPct > 0 && (
              <>
                <span className="text-ink/40 line-through">{formatINR(product.price)}</span>
                <span className="text-xs font-medium bg-accent/10 text-accent px-2.5 py-1 rounded-full">
                  -{product.discountPct}%
                </span>
              </>
            )}
          </div>

          <p className="text-sm text-ink/60 leading-relaxed mb-6">{product.description}</p>

          {product.sizes.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-semibold mb-2">Size</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm border transition-colors",
                      size === s ? "bg-ink text-white border-ink" : "border-line hover:border-ink/40"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 mb-6">
            <button
              onClick={() => {
                add(product, size, 1);
                setAdded(true);
                setTimeout(() => setAdded(false), 1500);
              }}
              className="flex-1 bg-ink text-white rounded-full py-3.5 font-medium hover:bg-ink/85 transition-colors"
            >
              {added ? "Added ✓" : "Add to cart"}
            </button>
            <button
              onClick={() => toggle(product.id)}
              className="w-14 h-14 rounded-full border border-line flex items-center justify-center shrink-0"
              aria-label="Toggle wishlist"
            >
              <Heart size={18} className={cn(wished ? "fill-accent text-accent" : "")} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            <span className="w-full text-xs font-semibold text-ink/50 flex items-center gap-1">
              <Sparkles size={12} /> Ask AI about this product
            </span>
            {ASK_AI_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() =>
                  askAI(
                    `${prompt} Product: ${product.name} by ${product.brand}, ${formatINR(
                      product.finalPrice
                    )}, ${product.category}/${product.subcategory}, color ${product.color}.`
                  )
                }
                className="text-xs bg-panel hover:bg-panel/70 px-3 py-1.5 rounded-full text-ink/70 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-ink/50 border-t border-line pt-4">
            <Truck size={14} />
            {product.inventory > 0
              ? `${product.inventory} in stock — usually ships in 2-4 days`
              : "Currently out of stock"}
          </div>

          <div className="flex flex-wrap gap-2 mt-6">
            {product.tags.slice(0, 6).map((t) => (
              <Link
                key={t}
                href={`/shop?q=${encodeURIComponent(t)}`}
                className="text-xs bg-panel px-3 py-1 rounded-full capitalize text-ink/60 hover:text-ink"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold mb-6">You may also like</h2>
          <ProductGrid products={similar} />
        </section>
      )}
    </main>
  );
}
