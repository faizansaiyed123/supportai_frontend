import type { LucideIcon } from "lucide-react";

/**
 * The one empty-state pattern used everywhere a list could be empty (documents, tickets,
 * conversations, customers, team members) - Sec. 22 "empty states" as a first-class UI state,
 * not an afterthought each page reinvents differently.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="rounded-full bg-neutral-100 p-3">
        <Icon className="h-6 w-6 text-neutral-400" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-neutral-900">{title}</p>
        {description && <p className="text-sm text-neutral-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}
