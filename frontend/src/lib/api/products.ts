import { listProducts, getProduct, ApiError } from "./client";
import { toUIProducts, toUIProduct, UIProduct } from "./adapters";

export interface CatalogResult {
  products: UIProduct[];
  source: "backend" | "fallback";
  error?: string;
}

// Minimal local fallback so the storefront still renders something useful
// if the FastAPI backend isn't running. Flagged via `source: "fallback"` so
// pages can show a banner rather than silently showing stale demo data.
const FALLBACK: UIProduct[] = [
  {
    id: 1,
    backendId: "fallback-1",
    title: "T-shirt with Tape Details",
    srcUrl: "/images/pic1.png",
    gallery: ["/images/pic1.png"],
    price: 120,
    discount: { amount: 0, percentage: 0 },
    rating: 4.5,
    brand: "Demo",
    category: "topwear",
    color: "white",
    style: "casual",
    description: "Sample product shown because the AI backend is unreachable.",
    sizes: ["S", "M", "L"],
    inventory: 10,
  },
  {
    id: 2,
    backendId: "fallback-2",
    title: "Skinny Fit Jeans",
    srcUrl: "/images/pic2.png",
    gallery: ["/images/pic2.png"],
    price: 260,
    discount: { amount: 0, percentage: 20 },
    rating: 3.5,
    brand: "Demo",
    category: "bottomwear",
    color: "blue",
    style: "casual",
    description: "Sample product shown because the AI backend is unreachable.",
    sizes: ["30", "32", "34"],
    inventory: 10,
  },
];

export async function getNewArrivals(limit = 4): Promise<CatalogResult> {
  try {
    const res = await listProducts({ sort: "newest", page_size: limit });
    return { products: toUIProducts(res.items), source: "backend" };
  } catch (err) {
    return {
      products: FALLBACK.slice(0, limit),
      source: "fallback",
      error: err instanceof ApiError ? err.message : "Unknown error",
    };
  }
}

export async function getTopSelling(limit = 4): Promise<CatalogResult> {
  try {
    const res = await listProducts({ sort: "rating", page_size: limit });
    return { products: toUIProducts(res.items), source: "backend" };
  } catch (err) {
    return {
      products: FALLBACK.slice(0, limit),
      source: "fallback",
      error: err instanceof ApiError ? err.message : "Unknown error",
    };
  }
}

export async function getRelatedProducts(limit = 4): Promise<CatalogResult> {
  try {
    const res = await listProducts({ sort: "featured", page_size: limit });
    return { products: toUIProducts(res.items), source: "backend" };
  } catch (err) {
    return {
      products: FALLBACK.slice(0, limit),
      source: "fallback",
      error: err instanceof ApiError ? err.message : "Unknown error",
    };
  }
}

export interface ShopQuery {
  q?: string;
  category?: string;
  sort?: "featured" | "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  page_size?: number;
}

export interface ShopResult extends CatalogResult {
  total: number;
  page: number;
  page_size: number;
  categories: string[];
}

export async function getShopProducts(params: ShopQuery): Promise<ShopResult> {
  try {
    const res = await listProducts({
      q: params.q,
      category: params.category,
      sort: params.sort ?? "featured",
      page: params.page ?? 1,
      page_size: params.page_size ?? 9,
    });
    return {
      products: toUIProducts(res.items),
      source: "backend",
      total: res.total,
      page: res.page,
      page_size: res.page_size,
      categories: res.categories,
    };
  } catch (err) {
    return {
      products: FALLBACK,
      source: "fallback",
      error: err instanceof ApiError ? err.message : "Unknown error",
      total: FALLBACK.length,
      page: 1,
      page_size: FALLBACK.length,
      categories: ["topwear", "bottomwear"],
    };
  }
}

export interface ProductResult {
  product: UIProduct | null;
  source: "backend" | "fallback";
  error?: string;
}

/**
 * The product-detail route only has a numeric id (from the URL, derived via
 * `backendIdToNumericId`). Rather than expose a reverse-hash endpoint, we
 * pull the small catalog and match on the same derived numeric id — this
 * keeps a single source of truth (the backend) without adding API surface
 * purely for a client-side routing quirk.
 */
export async function getProductByNumericId(numericId: number): Promise<ProductResult> {
  try {
    const res = await listProducts({ page_size: 100 });
    const products = toUIProducts(res.items);
    const match = products.find((p) => p.id === numericId) ?? null;
    return { product: match, source: "backend" };
  } catch (err) {
    const match = FALLBACK.find((p) => p.id === numericId) ?? null;
    return {
      product: match,
      source: "fallback",
      error: err instanceof ApiError ? err.message : "Unknown error",
    };
  }
}

export async function getProductByBackendId(backendId: string): Promise<ProductResult> {
  try {
    const product = await getProduct(backendId);
    return { product: toUIProduct(product), source: "backend" };
  } catch (err) {
    return {
      product: null,
      source: "fallback",
      error: err instanceof ApiError ? err.message : "Unknown error",
    };
  }
}
