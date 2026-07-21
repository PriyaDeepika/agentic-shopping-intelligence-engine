// The AI backend is stateful per (user_id, session_id): it remembers cart
// contents, wardrobe, and preferences across turns (see backend
// app/memory/memory_store.py). These ids just need to be stable for a given
// browser, so they're generated once and persisted in localStorage, the
// same pattern useCart/useWishlist already use for cart/wishlist state.
const USER_ID_KEY = "tl_ai_user_id";
const SESSION_ID_KEY = "tl_ai_session_id";

function getOrCreate(key: string, prefix: string): string {
  if (typeof window === "undefined") return `${prefix}_ssr`;
  let value = window.localStorage.getItem(key);
  if (!value) {
    value = `${prefix}_${crypto.randomUUID()}`;
    window.localStorage.setItem(key, value);
  }
  return value;
}

export function getUserId(): string {
  return getOrCreate(USER_ID_KEY, "user");
}

export function getSessionId(): string {
  return getOrCreate(SESSION_ID_KEY, "session");
}
