import { notFound } from "next/navigation";
import { getProduct } from "@/lib/api/client";
import { toUIProduct } from "@/types/product";
import { safeGetCatalog, similarProducts } from "@/lib/catalog";
import ProductDetail from "@/components/product/ProductDetail";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string; slug: string }>;
}) {
  const { id } = await params;

  let product;
  try {
    product = toUIProduct(await getProduct(id));
  } catch {
    notFound();
  }

  const { products: all } = await safeGetCatalog();
  const similar = similarProducts(all, product, 8);

  return <ProductDetail product={product} similar={similar} />;
}
