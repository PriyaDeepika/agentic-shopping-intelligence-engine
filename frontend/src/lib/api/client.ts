import { apiUrl } from "./config";
import type {
  BackendProduct,
  CartActionResponse,
  ChatResponse,
  CouponResponse,
  OptimizeResponse,
  ProductListResponse,
  RecommendResponse,
  SearchResponse,
  WardrobeItemInput,
  WardrobeResponse,
} from "./types";

// Lets callers (chiefly the chat UI) show an accurate message instead of one
// generic "couldn't reach the backend" string for every kind of failure.
export type ApiErrorKind = "network" | "timeout" | "not_found" | "server" | "client";

export class ApiError extends Error {
  status: number;
  kind: ApiErrorKind;
  constructor(message: string, status: number, kind: ApiErrorKind) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.kind = kind;
  }
}

async function request<T>(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const { timeoutMs = 15000, ...rest } = init ?? {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      ...rest,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...(rest.headers || {}) },
      cache: "no-store",
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === "AbortError") {
      throw new ApiError("The backend took too long to respond.", 408, "timeout");
    }
    throw new ApiError(
      "Could not reach the backend. Is it running at NEXT_PUBLIC_API_URL?",
      0,
      "network"
    );
  }
  clearTimeout(timer);

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ? JSON.stringify(body.detail) : detail;
    } catch {
      /* keep statusText */
    }
    const kind: ApiErrorKind =
      res.status === 404 ? "not_found" : res.status >= 500 ? "server" : "client";
    throw new ApiError(detail || `Request failed (${res.status})`, res.status, kind);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------- Catalog (GET /products, GET /products/{id}) ----------
export interface ListProductsParams {
  q?: string;
  category?: string;
  brand?: string;
  color?: string;
  min_price?: number;
  max_price?: number;
  sort?: "featured" | "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  page_size?: number;
}

export function listProducts(params: ListProductsParams = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  });
  const query = qs.toString();
  return request<ProductListResponse>(`/products${query ? `?${query}` : ""}`);
}

export function getProduct(id: string) {
  return request<BackendProduct>(`/products/${encodeURIComponent(id)}`);
}

// ---------- Semantic search (POST /search) ----------
// NOTE: previously typed the response as `{ results: BackendProduct[] }`,
// but backend/app/models/schemas.py -> SearchResponse actually returns
// `{ products: [...], agent_trace: {...} }` — this returned `undefined`
// products at runtime. Fixed to match the real shape.
export function searchProducts(payload: {
  query: string;
  top_k?: number;
  filters?: Record<string, unknown>;
}) {
  return request<SearchResponse>("/search", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- Cart (POST /cart) ----------
// NOTE: previously missing `user_id` (the backend's CartActionRequest
// requires it to load the right session/memory) and typed `action` as
// "add" | "remove" | "update_quantity" | "clear", which doesn't match what
// the backend's CartAgent delta path actually handles
// ("swap"/"increase_quantity"/"decrease_quantity" instead).
export function cartAction(payload: {
  user_id: string;
  session_id: string;
  action: "add" | "remove" | "swap" | "increase_quantity" | "decrease_quantity";
  product_id?: string;
  replacement_product_id?: string;
  quantity?: number;
}) {
  return request<CartActionResponse>("/cart", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- Coupons (POST /coupon) ----------
export function findCoupons(payload: { cart_total: number; brand_ids?: string[] }) {
  return request<CouponResponse>("/coupon", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- AI Assistant (POST /chat) ----------
export function chat(payload: { user_id: string; session_id: string; message: string }) {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 30000,
  });
}

// ---------- AI Recommend (POST /recommend) ----------
export function recommend(payload: {
  user_id: string;
  session_id: string;
  goal: string;
  budget?: number;
  aesthetic?: string;
}) {
  return request<RecommendResponse>("/recommend", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 30000,
  });
}

// ---------- AI Wardrobe (POST /wardrobe) ----------
export function submitWardrobe(payload: { user_id: string; items: WardrobeItemInput[] }) {
  return request<WardrobeResponse>("/wardrobe", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- AI Budget optimizer (POST /optimize) ----------
export function optimizeCart(payload: {
  user_id: string;
  session_id: string;
  budget: number;
  product_ids: string[];
}) {
  return request<OptimizeResponse>("/optimize", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- Health ----------
export function getHealth() {
  return request<{ status: string; service: string; environment: string }>(
    "/health"
  );
}
