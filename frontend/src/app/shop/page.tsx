import { Suspense } from "react";
import BreadcrumbShop from "@/components/shop-page/BreadcrumbShop";
import MobileFilters from "@/components/shop-page/filters/MobileFilters";
import Filters from "@/components/shop-page/filters";
import { FiSliders } from "react-icons/fi";
import ProductCard from "@/components/common/ProductCard";
import ProductGridSkeleton from "@/components/common/ProductGridSkeleton";
import BackendOfflineBanner from "@/components/common/BackendOfflineBanner";
import ShopSearchBar from "@/components/shop-page/ShopSearchBar";
import ShopSortSelect from "@/components/shop-page/ShopSortSelect";
import ShopPagination from "@/components/shop-page/ShopPagination";
import { getShopProducts, ShopQuery } from "@/lib/api/products";

const PAGE_SIZE = 9;

async function ShopResults({ searchParams }: { searchParams: ShopQuery }) {
  const page = Number(searchParams.page) || 1;
  const result = await getShopProducts({
    q: searchParams.q,
    category: searchParams.category,
    sort: searchParams.sort,
    page,
    page_size: PAGE_SIZE,
  });

  const totalPages = Math.max(1, Math.ceil(result.total / result.page_size));

  return (
    <>
      {result.source === "fallback" && <BackendOfflineBanner error={result.error} />}

      <div className="flex flex-col lg:flex-row lg:justify-between">
        <div className="flex items-center justify-between">
          <h1 className="font-bold text-2xl md:text-[32px] capitalize">
            {searchParams.category || "All Products"}
          </h1>
          <MobileFilters />
        </div>
        <div className="flex flex-col sm:items-center sm:flex-row">
          <span className="text-sm md:text-base text-black/60 mr-3">
            {result.total === 0
              ? "No products found"
              : `Showing ${(page - 1) * result.page_size + 1}-${Math.min(
                  page * result.page_size,
                  result.total
                )} of ${result.total} Products`}
          </span>
          <ShopSortSelect currentSort={searchParams.sort} />
        </div>
      </div>

      {result.products.length === 0 ? (
        <div className="w-full py-20 text-center border border-dashed border-black/10 rounded-2xl">
          <p className="text-lg font-semibold text-black/70">
            No products match your search.
          </p>
          <p className="text-sm text-black/50 mt-1">
            Try a different keyword or clear your filters.
          </p>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {result.products.map((product) => (
            <ProductCard key={product.id} data={product} />
          ))}
        </div>
      )}

      <hr className="border-t-black/10" />
      <ShopPagination currentPage={page} totalPages={totalPages} />
    </>
  );
}

export default function ShopPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; sort?: string; page?: string };
}) {
  return (
    <main className="pb-20">
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        <BreadcrumbShop />
        <div className="mb-5">
          <ShopSearchBar initialQuery={searchParams.q} />
        </div>
        <div className="flex md:space-x-5 items-start">
          <div className="hidden md:block min-w-[295px] max-w-[295px] border border-black/10 rounded-[20px] px-5 md:px-6 py-5 space-y-5 md:space-y-6">
            <div className="flex items-center justify-between">
              <span className="font-bold text-black text-xl">Filters</span>
              <FiSliders className="text-2xl text-black/40" />
            </div>
            <Filters />
          </div>
          <div className="flex flex-col w-full space-y-5">
            <Suspense fallback={<ProductGridSkeleton title="Loading products…" count={9} />}>
              <ShopResults searchParams={searchParams as ShopQuery} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
