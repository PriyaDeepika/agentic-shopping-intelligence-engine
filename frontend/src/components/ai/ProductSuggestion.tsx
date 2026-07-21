import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { toUIProduct } from "@/types/product";
import type { BackendProduct } from "@/lib/api/types";

interface ProductSuggestionProps {
  product: BackendProduct;
  reason?: string;
}

// Deliberately thin on card internals: image, wishlist toggle, discount
// badge, brand, name, rating, and price/original-price all come from the
// site's existing ProductCard so AI-recommended items look exactly like
// every other product card. This component only adds the chat-specific
// framing (bordered card, "selected because" reason, View Details button)
// and — critically — is fluid-width (no fixed w-*) so it can sit in a
// responsive grid instead of a fixed-width horizontally-scrolling strip,
// which was the actual cause of cards overflowing the chat window.
export default function ProductSuggestion({ product, reason }: ProductSuggestionProps) {
  const ui = toUIProduct(product);
  const href = `/product/${ui.id}/${ui.slug}`;

  return (
    <div className="min-w-0 w-full h-full flex flex-col bg-white border border-line rounded-2xl shadow-sm p-2.5">
      <ProductCard product={ui} />

      {reason && (
        <p className="text-[10.5px] text-ink/45 mt-1.5 leading-snug line-clamp-2">{reason}</p>
      )}

      <Link
        href={href}
        className="mt-auto pt-2 inline-flex items-center justify-center gap-1 text-[11px] font-medium text-ink/70 border border-line rounded-full py-1.5 hover:bg-panel transition-colors"
      >
        View Details
        <ArrowUpRight size={11} />
      </Link>
    </div>
  );
}
