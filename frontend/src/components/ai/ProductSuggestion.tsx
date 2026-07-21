import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { toUIProduct } from "@/types/product";
import type { BackendProduct } from "@/lib/api/types";

interface ProductSuggestionProps {
  product: BackendProduct;
  reason?: string;
}

// Deliberately thin: all card styling/behavior (image, wishlist, discount
// badge, hover animation) is inherited from the site's existing
// ProductCard — this only adapts the AI backend's product shape and adds
// the "selected because" reason underneath, so the assistant's picks look
// exactly like every other product card on the site.
export default function ProductSuggestion({ product, reason }: ProductSuggestionProps) {
  const ui = toUIProduct(product);
  return (
    <div className="w-36 shrink-0">
      <ProductCard product={ui} />
      {reason && (
        <Link
          href={`/product/${ui.id}/${ui.slug}`}
          className="block text-[11px] text-ink/45 mt-1 leading-snug line-clamp-2 hover:text-ink/70"
        >
          {reason}
        </Link>
      )}
    </div>
  );
}
