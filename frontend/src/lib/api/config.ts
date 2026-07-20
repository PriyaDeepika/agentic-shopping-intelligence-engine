// Base URL of the FastAPI backend (Agentic Shopping Intelligence Engine).
// Configure via NEXT_PUBLIC_API_URL in `.env.local`. Falls back to the
// standard local dev port so the app still works out of the box.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
