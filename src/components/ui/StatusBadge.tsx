import { cn } from "@/lib/utils/cn";
import type { ConversationStatus, DocumentStatus, TicketPriority, TicketStatus } from "@/types/api";

type Tone = "neutral" | "info" | "warning" | "success" | "danger";

const toneClasses: Record<Tone, string> = {
  neutral: "bg-neutral-100 text-neutral-700",
  info: "bg-info-50 text-info-700",
  warning: "bg-warning-50 text-warning-700",
  success: "bg-success-50 text-success-700",
  danger: "bg-danger-50 text-danger-700",
};

/**
 * The ONE place status -> color is decided (D035) - documents, tickets, and conversations all
 * have their own status enum, but "pending/processing"-ish states are always warning-toned,
 * terminal-good states are always success-toned, terminal-bad states are always danger-toned,
 * everywhere in the app. A page should never invent its own ad hoc status color.
 */
const DOCUMENT_STATUS_TONE: Record<DocumentStatus, Tone> = {
  pending: "neutral",
  processing: "warning",
  ready: "success",
  failed: "danger",
};

const TICKET_STATUS_TONE: Record<TicketStatus, Tone> = {
  open: "info",
  pending: "warning",
  resolved: "success",
  closed: "neutral",
};

const TICKET_PRIORITY_TONE: Record<TicketPriority, Tone> = {
  low: "neutral",
  normal: "info",
  high: "warning",
  urgent: "danger",
};

const CONVERSATION_STATUS_TONE: Record<ConversationStatus, Tone> = {
  open: "info",
  escalated: "warning",
  closed: "neutral",
};

function Badge({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        toneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge tone={DOCUMENT_STATUS_TONE[status]}>{status}</Badge>;
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge tone={TICKET_STATUS_TONE[status]}>{status}</Badge>;
}

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  return <Badge tone={TICKET_PRIORITY_TONE[priority]}>{priority}</Badge>;
}

export function ConversationStatusBadge({ status }: { status: ConversationStatus }) {
  return <Badge tone={CONVERSATION_STATUS_TONE[status]}>{status}</Badge>;
}
