// Base URL of the existing FastAPI backend. No endpoints, request, or
// response shapes are changed anywhere in this app — only the UI is new.
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
