"use client";
import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "lucide-react";
import { useState } from "react";
import * as motion from "framer-motion/client";
import type { UIProduct } from "@/types/product";
import { formatINR, cn } from "@/lib/utils";
import { useWishlist } from "@/lib/hooks/useWishlist";

export default function ProductCard({ product }: { product: UIProduct }) {
  const { has, toggle } = useWishlist();
  const [imgError, setImgError] = useState(false);
  const wished = has(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35 }}
    >
      <Link href={`/product/${product.id}/${product.slug}`} className="group block">
        <div className="relative bg-panel rounded-2xl aspect-[3/4] overflow-hidden mb-3">
          {!imgError ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ink/30 text-sm text-center px-4">
              {product.name}
            </div>
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              toggle(product.id);
            }}
            aria-label="Toggle wishlist"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm"
          >
            <Heart
              size={15}
              className={cn(wished ? "fill-accent text-accent" : "text-ink/60")}
            />
          </button>

          {product.discountPct > 0 && (
            <span className="absolute top-3 left-3 bg-ink text-white text-[11px] font-medium px-2 py-1 rounded-full">
              -{product.discountPct}%
            </span>
          )}
        </div>

        <p className="text-[11px] uppercase tracking-wide text-ink/40 mb-0.5">
          {product.brand}
        </p>
        <p className="text-sm font-medium leading-snug line-clamp-2 mb-1">{product.name}</p>
        <div className="flex items-center gap-1 mb-1 text-xs text-ink/50">
          <Star size={12} className="fill-ink/60 text-ink/60" />
          {product.rating.toFixed(1)}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold">{formatINR(product.finalPrice)}</span>
          {product.discountPct > 0 && (
            <span className="text-ink/40 text-sm line-through">
              {formatINR(product.price)}
            </span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
