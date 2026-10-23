import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type AlertTone = "danger" | "warning" | "info";

const TONE_CLASSES: Record<AlertTone, string> = {
  danger: "border-danger-600/20 bg-danger-50 text-danger-700",
  warning: "border-warning-600/20 bg-warning-50 text-warning-700",
  info: "border-info-600/20 bg-info-50 text-info-700",
};

/** Page/form-level messages (distinct from Toast, which is for transient confirmations) -
 * e.g. "This conversation's answer may be incomplete" or a form-wide submission error that
 * isn't tied to one specific field. */
export function Alert({ tone = "info", children }: { tone?: AlertTone; children: React.ReactNode }) {
  const Icon = tone === "info" ? Info : AlertTriangle;
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex items-start gap-2 rounded-md border px-4 py-3 text-sm", TONE_CLASSES[tone])}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1">{children}</div>
    </div>
  );
}
