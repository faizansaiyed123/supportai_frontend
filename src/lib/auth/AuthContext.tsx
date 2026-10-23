"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, setAccessToken, setOnAuthExpired } from "@/lib/api/client";
import type { AccessTokenResponse, LoginRequest } from "@/types/api";

/** Decoded from the JWT's own claims (backend/app/core/security.py:create_access_token) -
 * decoded client-side purely for display/routing convenience (which org/role is active),
 * NEVER trusted as an authorization decision by itself - every actual authorization check
 * happens server-side (D005). This is UI state, not a security boundary. */
interface DecodedTokenClaims {
  sub: string; // user_id
  org_id: string;
  role: string;
  exp: number;
}

function decodeJwtPayload(token: string): DecodedTokenClaims | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    // atob is available in both browser and (via a Node global) server runtimes Next.js uses
    // for client components hydrated on the server - fine for this non-security-critical
    // display purpose.
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as DecodedTokenClaims;
  } catch {
    return null;
  }
}

interface AuthState {
  isLoading: boolean; // true during the initial silent-refresh-on-load attempt
  isAuthenticated: boolean;
  userId: string | null;
  orgId: string | null;
  role: string | null;
  login: (req: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  /** Called after invite-accept, since that endpoint also returns a fresh token pair
   * (backend/app/api/routes/auth.py:accept_invite) - avoids duplicating the "apply a new
   * token" logic in two places. */
  applyToken: (token: string) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [claims, setClaims] = useState<DecodedTokenClaims | null>(null);

  const applyToken = useCallback((token: string) => {
    setAccessToken(token);
    setClaims(decodeJwtPayload(token));
  }, []);

  const clearAuth = useCallback(() => {
    setAccessToken(null);
    setClaims(null);
  }, []);

  useEffect(() => {
    setOnAuthExpired(() => {
      clearAuth();
      router.push("/login");
    });
  }, [clearAuth, router]);

  // On mount, attempt a silent refresh using the httponly refresh cookie (D034) - this is how
  // a page reload re-establishes an in-memory access token without ever putting it in
  // localStorage.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const body = await apiFetch<AccessTokenResponse>("/auth/refresh", {
          method: "POST",
          skipAuthRetry: true,
        });
        if (!cancelled) applyToken(body.access_token);
      } catch {
        // No valid refresh cookie (never logged in, or it expired) - not an error state,
        // just "not authenticated yet."
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyToken]);

  const login = useCallback(
    async (req: LoginRequest) => {
      const body = await apiFetch<AccessTokenResponse>("/auth/login", {
        method: "POST",
        body: req,
        skipAuthRetry: true,
      });
      applyToken(body.access_token);
    },
    [applyToken],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      clearAuth();
      router.push("/login");
    }
  }, [clearAuth, router]);

  const value = useMemo<AuthState>(
    () => ({
      isLoading,
      isAuthenticated: claims != null,
      userId: claims?.sub ?? null,
      orgId: claims?.org_id ?? null,
      role: claims?.role ?? null,
      login,
      logout,
      applyToken,
    }),
    [isLoading, claims, login, logout, applyToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
