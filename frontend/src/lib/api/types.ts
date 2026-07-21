// Mirrors backend/app/models/product.py Product exactly — do not change field
// names here without a matching backend change (there is none planned).
export interface BackendProduct {
  id: string;
  name: string;
  price: number;
  brand: string;
  category: string;
  subcategory: string;
  color: string;
  style: string;
  occasion: string[];
  tags: string[];
  description: string;
  sizes: string[];
  image_url: string;
  inventory: number;
  discount: number; // 0-1 fraction
  rating: number;
}

export interface ProductListResponse {
  items: BackendProduct[];
  total: number;
  page: number;
  page_size: number;
  categories: string[];
  brands: string[];
}

export interface AgentTrace {
  agent: string;
  duration_seconds: number;
  success: boolean;
  reasoning_summary: string;
  confidence: number;
  error: string | null;
  token_usage: number;
}

export interface CartItemBackend {
  product: BackendProduct;
  quantity: number;
}

export interface CartSummary {
  items: CartItemBackend[];
  subtotal: number;
  discount_total: number;
  total: number;
  budget: number | null;
  over_budget: boolean;
}

export interface CartActionResponse {
  cart: CartSummary;
  agent_trace: AgentTrace;
}

export interface Coupon {
  code: string;
  type: string;
  description: string;
  savings: number;
}

export interface CouponResponse {
  applicable_coupons: Coupon[];
  best_savings: number;
  agent_trace: AgentTrace;
}

// ---------- AI assistant (chat/recommend/wardrobe/optimize) ----------
// Mirrors backend/app/models/schemas.py exactly.

export interface ExplanationItem {
  product_id: string;
  reasons: string[];
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  cart: CartSummary;
  explanations: ExplanationItem[];
  agent_timeline: AgentTrace[];
  timeline_text: string;
}

export interface SearchResponse {
  products: BackendProduct[];
  agent_trace: AgentTrace;
}

export interface OptimizeResponse {
  cart: CartSummary;
  agent_trace: AgentTrace;
}

export interface WardrobeItemInput {
  name: string;
  category: string;
  color?: string;
  tags?: string[];
}

export interface WardrobeResponse {
  wardrobe_size: number;
  duplicate_warnings: string[];
  complementary_recommendations: BackendProduct[];
  agent_trace: AgentTrace;
}

export interface RecommendResponse {
  cart: CartSummary;
  explanations: ExplanationItem[];
  agent_timeline: AgentTrace[];
  timeline_text: string;
}
