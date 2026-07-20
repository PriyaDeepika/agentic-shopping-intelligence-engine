import { Suspense } from "react";
import ProductListSec from "@/components/common/ProductListSec";
import ProductGridSkeleton from "@/components/common/ProductGridSkeleton";
import BackendOfflineBanner from "@/components/common/BackendOfflineBanner";
import Brands from "@/components/homepage/Brands";
import DressStyle from "@/components/homepage/DressStyle";
import Header from "@/components/homepage/Header";
import Reviews from "@/components/homepage/Reviews";
import { reviewsData } from "@/data/reviews.data";
import { getNewArrivals, getTopSelling } from "@/lib/api/products";

async function NewArrivalsSection() {
  const { products, source, error } = await getNewArrivals(4);
  return (
    <>
      {source === "fallback" && <BackendOfflineBanner error={error} />}
      <ProductListSec
        title="NEW ARRIVALS"
        data={products}
        viewAllLink="/shop#new-arrivals"
      />
    </>
  );
}

async function TopSellingSection() {
  const { products, source, error } = await getTopSelling(4);
  return (
    <>
      {source === "fallback" && <BackendOfflineBanner error={error} />}
      <ProductListSec
        title="top selling"
        data={products}
        viewAllLink="/shop#top-selling"
      />
    </>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <Brands />
      <main className="my-[50px] sm:my-[72px]">
        <Suspense fallback={<ProductGridSkeleton title="NEW ARRIVALS" />}>
          <NewArrivalsSection />
        </Suspense>
        <div className="max-w-frame mx-auto px-4 xl:px-0">
          <hr className="h-[1px] border-t-black/10 my-10 sm:my-16" />
        </div>
        <div className="mb-[50px] sm:mb-20">
          <Suspense fallback={<ProductGridSkeleton title="TOP SELLING" />}>
            <TopSellingSection />
          </Suspense>
        </div>
        <div className="mb-[50px] sm:mb-20">
          <DressStyle />
        </div>
        <Reviews data={reviewsData} />
      </main>
    </>
  );
}
