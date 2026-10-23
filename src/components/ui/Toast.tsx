"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ToastTone = "success" | "error" | "info";

interface Toast {
  id: string;
  tone: ToastTone;
  message: string;
}

interface ToastContextValue {
  showToast: (tone: ToastTone, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON: Record<ToastTone, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const TONE_CLASSES: Record<ToastTone, string> = {
  success: "border-success-600/20 bg-success-50 text-success-700",
  error: "border-danger-600/20 bg-danger-50 text-danger-700",
  info: "border-info-600/20 bg-info-50 text-info-700",
};

const AUTO_DISMISS_MS = 5000;

/**
 * App-wide toast notifications (Sec. 22) - one provider mounted once in the root layout, used
 * via useToast() anywhere a mutation succeeds/fails and the user needs a brief confirmation
 * that isn't worth a full page banner. role="status"/aria-live so screen readers announce new
 * toasts without needing focus to move there.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  // Portal only after mount: rendering createPortal(document.body) during hydration can
  // mismatch the server HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (tone: ToastTone, message: string) => {
      // Counter, not crypto.randomUUID(): that API only exists in secure contexts, so it
      // would throw when the app is opened over plain http on a LAN address.
      const id = String(nextId.current++);
      setToasts((prev) => [...prev, { id, tone, message }]);
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          <div
            className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
            role="status"
            aria-live="polite"
          >
            {toasts.map((toast) => {
              const Icon = TONE_ICON[toast.tone];
              return (
                <div
                  key={toast.id}
                  className={cn(
                    "flex items-start gap-2 rounded-md border px-4 py-3 text-sm shadow-md",
                    TONE_CLASSES[toast.tone],
                  )}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="flex-1">{toast.message}</p>
                  <button
                    onClick={() => dismiss(toast.id)}
                    aria-label="Dismiss notification"
                    className="shrink-0 opacity-60 hover:opacity-100"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
