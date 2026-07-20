import type { BackendProduct } from "./types";
import type { Product } from "@/types/product.types";

// The existing storefront UI (ProductCard, cart slice, product-detail route)
// was built around numeric ids and local `/images/picN.png` assets. The AI
// backend's catalog uses string ids ("p001") and non-resolvable placeholder
// image URLs ("https://example.com/p001.jpg"). Rather than rewire every
// existing component's id/image typing, we adapt at the boundary:
//  - numeric id is derived deterministically from the backend id so routing
//    (/shop/product/[id]) keeps working unchanged.
//  - `backendId` (the original string id) travels alongside on Product/CartItem
//    so calls back to the backend (cart/coupon/optimize) use the real id.
//  - images are mapped deterministically to the bundled local placeholder
//    photos, since the sample catalog's image_url values don't resolve.

const LOCAL_IMAGE_COUNT = 15; // /public/images/pic1.png ... pic15.png

export function backendIdToNumericId(backendId: string): number {
  const digits = backendId.replace(/\D/g, "");
  const n = parseInt(digits, 10);
  return Number.isFinite(n) && n > 0 ? n : hashToPositiveInt(backendId);
}

function hashToPositiveInt(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function localImageFor(backendId: string): string {
  const n = backendIdToNumericId(backendId);
  const index = ((n - 1) % LOCAL_IMAGE_COUNT) + 1;
  return `/images/pic${index}.png`;
}

export interface UIProduct extends Product {
  backendId: string;
  brand: string;
  category: string;
  color: string;
  style: string;
  description: string;
  sizes: string[];
  inventory: number;
}

export function toUIProduct(p: BackendProduct): UIProduct {
  const img = localImageFor(p.id);
  return {
    id: backendIdToNumericId(p.id),
    backendId: p.id,
    title: p.name,
    srcUrl: img,
    gallery: [img],
    price: p.price,
    discount: {
      amount: 0,
      percentage: Math.round((p.discount || 0) * 100),
    },
    rating: p.rating,
    brand: p.brand,
    category: p.category,
    color: p.color,
    style: p.style,
    description: p.description,
    sizes: p.sizes,
    inventory: p.inventory,
  };
}

export function toUIProducts(products: BackendProduct[]): UIProduct[] {
  return products.map(toUIProduct);
}
