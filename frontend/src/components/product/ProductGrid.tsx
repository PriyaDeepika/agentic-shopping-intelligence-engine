import ProductCard from "./ProductCard";
import type { UIProduct } from "@/types/product";

export function ProductGrid({ products }: { products: UIProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center text-ink/50">
        No products match these filters yet.
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-panel rounded-2xl aspect-[3/4] mb-3" />
          <div className="h-3 bg-panel rounded w-1/2 mb-2" />
          <div className="h-3 bg-panel rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function Section({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold">{title}</h2>
          {subtitle && <p className="text-ink/50 text-sm mt-1">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
