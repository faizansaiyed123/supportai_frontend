"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";

/**
 * Wraps every authenticated route. Shows a loading state during the initial silent-refresh
 * attempt (D034) rather than flashing a redirect-to-login before that's had a chance to
 * resolve, then redirects if it turns out there's really no session.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" aria-hidden="true" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // redirect effect above is in flight
  }

  return <>{children}</>;
}
