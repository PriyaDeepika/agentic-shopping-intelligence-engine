import { apiUrl } from "./config";
import type {
  CartActionResponse,
  ChatResponse,
  CouponResponse,
  OptimizeResponse,
  ProductListResponse,
  RecommendResponse,
  WardrobeItemInput,
  WardrobeResponse,
  BackendProduct,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
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
      headers: {
        "Content-Type": "application/json",
        ...(rest.headers || {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error).name === "AbortError") {
      throw new ApiError(
        "The AI backend took too long to respond. Please try again.",
        408
      );
    }
    throw new ApiError(
      "Could not reach the backend. Is it running at the configured NEXT_PUBLIC_API_URL?",
      0
    );
  }
  clearTimeout(timer);

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body?.detail ? JSON.stringify(body.detail) : detail;
    } catch {
      // ignore parse errors, keep statusText
    }
    throw new ApiError(detail || `Request failed (${res.status})`, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------- Health ----------
export function getHealth() {
  return request<{ status: string; service: string; environment: string; llm_provider: string }>(
    "/health"
  );
}

// ---------- Catalog ----------
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

// ---------- Semantic search ----------
export interface SearchParams {
  query: string;
  top_k?: number;
  filters?: Record<string, unknown>;
}

export function searchProducts(params: SearchParams) {
  return request<{ results: BackendProduct[] }>("/search", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ---------- Chat (multi-agent orchestrator) ----------
export function sendChatMessage(payload: {
  user_id: string;
  session_id: string;
  message: string;
}) {
  return request<ChatResponse>("/chat", {
    method: "POST",
    body: JSON.stringify(payload),
    timeoutMs: 30000,
  });
}

// ---------- Recommend ----------
export function getRecommendation(payload: {
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

// ---------- Cart ----------
export function cartAction(payload: {
  user_id: string;
  session_id: string;
  action: "add" | "remove" | "update_quantity" | "clear";
  product_id?: string;
  quantity?: number;
}) {
  return request<CartActionResponse>("/cart", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- Coupon ----------
export function findCoupons(payload: { cart_total: number; brand_ids?: string[] }) {
  return request<CouponResponse>("/coupon", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- Wardrobe ----------
export function submitWardrobe(payload: { user_id: string; items: WardrobeItemInput[] }) {
  return request<WardrobeResponse>("/wardrobe", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ---------- Budget optimizer ----------
export function optimizeBudget(payload: {
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
