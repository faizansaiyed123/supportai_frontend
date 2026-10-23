import type { AccessTokenResponse, ApiErrorBody } from "@/types/api";

// Keep the localhost default for local development only. A production deployment without an
// API URL should still render the frontend and report a clear, controlled error for API actions.
const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:8000/api" : "")
).replace(/\/+$/, "");

const API_NOT_CONFIGURED_MESSAGE =
  "The SupportAI API is not configured for this deployment. Please try again later.";

/**
 * ApiError carries the HTTP status and the backend's `detail` message (D033) so callers can
 * branch on status (401 -> redirect to login, 403 -> "you don't have permission", 404 -> not
 * found, 422 -> show field errors, 429 -> "slow down") rather than pattern-matching strings.
 */
export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.status = status;
    this.detail = detail;
    this.name = "ApiError";
  }
}

function extractDetail(body: unknown): string {
  const b = body as ApiErrorBody | undefined;
  if (!b || b.detail == null) return "An unexpected error occurred.";
  if (typeof b.detail === "string") return b.detail;
  // FastAPI/Pydantic validation errors (422) come back as a list of {msg, loc} - join them
  // into one readable message rather than showing "[object Object]".
  return b.detail.map((e) => e.msg).join("; ");
}

/**
 * Module-level holder for the in-memory access token (D034 - never persisted to
 * localStorage). Set by AuthProvider on login/refresh/logout. A plain module variable (not
 * React state) so apiFetch - which isn't a React component/hook - can read the current token
 * without needing it threaded through every call site.
 */
let currentAccessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

/** Set by AuthProvider so apiFetch can react to a definitively-failed refresh (e.g. redirect
 * to /login) without importing Next.js router into this non-component module directly. */
let onAuthExpired: (() => void) | null = null;
export function setOnAuthExpired(handler: () => void): void {
  onAuthExpired = handler;
}

async function refreshAccessToken(): Promise<string | null> {
  // Coalesce concurrent refresh attempts (e.g. three components' queries all 401 at once on
  // an expired token) into a single in-flight request rather than firing the refresh endpoint
  // three times and racing each other's cookie rotation (D012's refresh tokens are single-use
  // and rotate on every call - a second concurrent refresh call would see the first one's
  // already-rotated token and get rejected as reuse).
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return null;
      const body: AccessTokenResponse = await res.json();
      setAccessToken(body.access_token);
      return body.access_token;
    } catch {
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Skip the automatic refresh-and-retry-once behavior - used by the refresh call itself and
   * by login/register, where a 401 means "bad credentials," not "expired session." */
  skipAuthRetry?: boolean;
}

/**
 * The single function every API call in src/lib/api/*.ts goes through. Attaches the bearer
 * token, sends credentials so the httponly refresh cookie flows, JSON-encodes non-FormData
 * bodies, and on a 401 (and skipAuthRetry is not set) attempts exactly one silent refresh
 * before retrying the original request once. If that retry also 401s, gives up and calls
 * onAuthExpired() so the app can redirect to /login - it does NOT loop.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(503, API_NOT_CONFIGURED_MESSAGE);
  }

  const { body, skipAuthRetry, headers, ...rest } = options;
  const isFormData = body instanceof FormData;

  const doFetch = async (): Promise<Response> => {
    const token = getAccessToken();
    return fetch(`${API_BASE_URL}${path}`, {
      ...rest,
      credentials: "include",
      headers: {
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body == null ? undefined : isFormData ? (body as FormData) : JSON.stringify(body),
    });
  };

  let res = await doFetch();

  if (res.status === 401 && !skipAuthRetry) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch();
    } else {
      onAuthExpired?.();
    }
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") ?? "";
  const parsed = contentType.includes("application/json") ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(res.status, extractDetail(parsed));
  }

  return parsed as T;
}
