const USER_ID_KEY = "ase_user_id";
const SESSION_ID_KEY = "ase_session_id";

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now()
    .toString(36)
    .slice(-4)}`;
}

function getOrCreate(key: string, prefix: string): string {
  if (typeof window === "undefined") return randomId(prefix);
  let val = window.localStorage.getItem(key);
  if (!val) {
    val = randomId(prefix);
    window.localStorage.setItem(key, val);
  }
  return val;
}

/** Stable per-browser user id, sent to the backend so wardrobe/memory persist. */
export function getUserId(): string {
  return getOrCreate(USER_ID_KEY, "user");
}

/** Session id, reset on demand (e.g. "start new conversation"). */
export function getSessionId(): string {
  return getOrCreate(SESSION_ID_KEY, "session");
}

export function resetSessionId(): string {
  const val = randomId("session");
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_ID_KEY, val);
  }
  return val;
}
