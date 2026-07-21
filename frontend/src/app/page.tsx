import Link from "next/link";
import Hero from "@/components/home/Hero";
import CategoryStrip from "@/components/home/CategoryStrip";
import { Section } from "@/components/product/ProductGrid";
import ProductCard from "@/components/product/ProductCard";
import OfflineBanner from "@/components/common/OfflineBanner";
import { safeGetCatalog, filterCatalog } from "@/lib/catalog";

export default async function Home() {
  const { products, online, error } = await safeGetCatalog();

  const newArrivals = filterCatalog(products, { sort: "newest" }).slice(0, 8);
  const topRated = filterCatalog(products, { sort: "rating" }).slice(0, 8);
  const onSale = products.filter((p) => p.discountPct > 0).slice(0, 8);

  return (
    <main>
      <Hero productCount={products.length} />
      {!online && <OfflineBanner error={error} />}

      {products.length > 0 && <CategoryStrip products={products} />}

      <Section
        title="New arrivals"
        subtitle="Fresh additions to the catalog"
        action={
          <Link href="/shop" className="text-sm font-medium underline underline-offset-4">
            View all
          </Link>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="border-t border-line my-2" />
      </div>

      <Section
        title="Top rated"
        subtitle="Highest reviewed pieces right now"
        action={
          <Link href="/shop?sort=rating" className="text-sm font-medium underline underline-offset-4">
            View all
          </Link>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
          {topRated.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      {onSale.length > 0 && (
        <Section
          title="On sale"
          subtitle="Limited-time discounted picks"
          action={
            <Link href="/shop?onSale=1" className="text-sm font-medium underline underline-offset-4">
              View all
            </Link>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-8">
            {onSale.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Section>
      )}
    </main>
  );
}
