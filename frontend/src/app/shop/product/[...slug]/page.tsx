import ProductListSec from "@/components/common/ProductListSec";
import BackendOfflineBanner from "@/components/common/BackendOfflineBanner";
import BreadcrumbProduct from "@/components/product-page/BreadcrumbProduct";
import Header from "@/components/product-page/Header";
import Tabs from "@/components/product-page/Tabs";
import { getProductByNumericId, getRelatedProducts } from "@/lib/api/products";
import { notFound } from "next/navigation";

export default async function ProductPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const numericId = Number(params.slug[0]);

  if (Number.isNaN(numericId)) {
    notFound();
  }

  const [{ product: productData, source, error }, related] = await Promise.all([
    getProductByNumericId(numericId),
    getRelatedProducts(4),
  ]);

  if (!productData?.title) {
    notFound();
  }

  return (
    <main>
      <div className="max-w-frame mx-auto px-4 xl:px-0">
        <hr className="h-[1px] border-t-black/10 mb-5 sm:mb-6" />
        {source === "fallback" && <BackendOfflineBanner error={error} />}
        <BreadcrumbProduct title={productData?.title ?? "product"} />
        <section className="mb-11">
          <Header data={productData} />
        </section>
        <Tabs />
      </div>
      <div className="mb-[50px] sm:mb-20">
        <ProductListSec title="You might also like" data={related.products} />
      </div>
    </main>
  );
}
