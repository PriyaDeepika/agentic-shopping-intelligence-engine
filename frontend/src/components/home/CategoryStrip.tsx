import Link from "next/link";
import Image from "next/image";
import type { UIProduct } from "@/types/product";

export default function CategoryStrip({ products }: { products: UIProduct[] }) {
  const byCategory = new Map<string, UIProduct>();
  for (const p of products) {
    if (!byCategory.has(p.category)) byCategory.set(p.category, p);
  }
  const categories = Array.from(byCategory.entries()).slice(0, 8);

  return (
    <section className="max-w-frame mx-auto px-4 xl:px-0 py-10">
      <h2 className="font-display text-2xl md:text-3xl font-bold mb-6">Shop by category</h2>
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
        {categories.map(([category, sample]) => (
          <Link
            key={category}
            href={`/shop?category=${encodeURIComponent(category)}`}
            className="group shrink-0 w-40"
          >
            <div className="relative w-40 h-48 rounded-2xl overflow-hidden bg-panel mb-2">
              <Image
                src={sample.image}
                alt={category}
                fill
                sizes="160px"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <span className="absolute bottom-3 left-3 text-white font-medium text-sm">
                {category}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
