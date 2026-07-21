import { listProducts } from "./api/client";
import { toUIProduct, type UIProduct } from "@/types/product";
import { ApiError } from "./api/client";

let cache: UIProduct[] | null = null;
let cachePromise: Promise<UIProduct[]> | null = null;

/**
 * The existing /products endpoint caps page_size at 100 and has no
 * gender/articleType/usage/season query params. Rather than touch the
 * backend, we page through the whole catalog once (a handful of requests),
 * cache it in memory for the life of the tab, and do faceted filtering,
 * search-suggestions, category derivation, and "similar products" on the
 * client. This keeps every request/response shape on the wire identical to
 * what the backend already serves.
 */
export async function getCatalog(): Promise<UIProduct[]> {
  if (cache) return cache;
  if (cachePromise) return cachePromise;

  cachePromise = (async () => {
    const pageSize = 100;
    let page = 1;
    let all: UIProduct[] = [];
    try {
      // First page tells us `total`.
      const first = await listProducts({ page, page_size: pageSize });
      all = first.items.map(toUIProduct);
      const totalPages = Math.ceil(first.total / pageSize);
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) =>
          listProducts({ page: i + 2, page_size: pageSize })
        )
      );
      for (const r of rest) all = all.concat(r.items.map(toUIProduct));
    } catch (err) {
      cachePromise = null;
      throw err;
    }
    cache = all;
    return all;
  })();

  return cachePromise;
}

export function invalidateCatalog() {
  cache = null;
  cachePromise = null;
}

export interface Facets {
  categories: string[];
  genders: string[];
  articleTypes: string[];
  colors: string[];
  usages: string[];
  seasons: string[];
  brands: string[];
  priceRange: [number, number];
}

export function deriveFacets(products: UIProduct[]): Facets {
  const uniq = (vals: (string | undefined)[]) =>
    Array.from(new Set(vals.filter((v): v is string => !!v))).sort();
  const prices = products.map((p) => p.finalPrice);
  return {
    categories: uniq(products.map((p) => p.category)),
    genders: uniq(products.map((p) => p.gender)),
    articleTypes: uniq(products.map((p) => p.subcategory)),
    colors: uniq(products.map((p) => p.color)),
    usages: uniq(products.map((p) => p.usage)),
    seasons: uniq(products.map((p) => p.season)),
    brands: uniq(products.map((p) => p.brand)),
    priceRange: [
      prices.length ? Math.min(...prices) : 0,
      prices.length ? Math.max(...prices) : 0,
    ],
  };
}

export interface FilterState {
  q?: string;
  category?: string;
  gender?: string;
  articleType?: string;
  color?: string;
  usage?: string;
  season?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "featured" | "price_asc" | "price_desc" | "rating" | "newest";
}

export function filterCatalog(products: UIProduct[], f: FilterState): UIProduct[] {
  let out = products;
  if (f.q) {
    const needle = f.q.toLowerCase().trim();
    out = out.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.brand.toLowerCase().includes(needle) ||
        p.category.toLowerCase().includes(needle) ||
        p.subcategory.toLowerCase().includes(needle) ||
        p.color.toLowerCase().includes(needle) ||
        p.gender.toLowerCase().includes(needle) ||
        p.tags.some((t) => t.includes(needle))
    );
  }
  if (f.category) out = out.filter((p) => p.category === f.category);
  if (f.gender) out = out.filter((p) => p.gender === f.gender);
  if (f.articleType) out = out.filter((p) => p.subcategory === f.articleType);
  if (f.color) out = out.filter((p) => p.color === f.color);
  if (f.usage) out = out.filter((p) => p.usage === f.usage);
  if (f.season) out = out.filter((p) => p.season === f.season);
  if (f.brand) out = out.filter((p) => p.brand === f.brand);
  if (f.minPrice !== undefined) out = out.filter((p) => p.finalPrice >= f.minPrice!);
  if (f.maxPrice !== undefined) out = out.filter((p) => p.finalPrice <= f.maxPrice!);

  switch (f.sort) {
    case "price_asc":
      out = [...out].sort((a, b) => a.finalPrice - b.finalPrice);
      break;
    case "price_desc":
      out = [...out].sort((a, b) => b.finalPrice - a.finalPrice);
      break;
    case "rating":
      out = [...out].sort((a, b) => b.rating - a.rating);
      break;
    case "newest":
      out = [...out].sort((a, b) => Number(b.id) - Number(a.id));
      break;
    default:
      break;
  }
  return out;
}

export function similarProducts(all: UIProduct[], product: UIProduct, limit = 8): UIProduct[] {
  return all
    .filter((p) => p.id !== product.id)
    .map((p) => {
      let score = 0;
      if (p.category === product.category) score += 3;
      if (p.subcategory === product.subcategory) score += 3;
      if (p.gender === product.gender) score += 1;
      if (p.color === product.color) score += 1;
      if (p.brand === product.brand) score += 1;
      return { p, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.p);
}

export function searchSuggestions(all: UIProduct[], q: string, limit = 8): UIProduct[] {
  if (!q.trim()) return [];
  return filterCatalog(all, { q }).slice(0, limit);
}

export async function safeGetCatalog(): Promise<{
  products: UIProduct[];
  online: boolean;
  error?: string;
}> {
  try {
    const products = await getCatalog();
    return { products, online: true };
  } catch (err) {
    return {
      products: [],
      online: false,
      error: err instanceof ApiError ? err.message : "Unknown error",
    };
  }
}
