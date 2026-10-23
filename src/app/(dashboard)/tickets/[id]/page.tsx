"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { roleCan } from "@/lib/auth/permissions";
import {
  useAddTicketNote,
  useAssignTicket,
  useTicket,
  useTicketNotes,
  useUpdateTicketStatus,
} from "@/lib/hooks/useTickets";
import { useMemberships } from "@/lib/hooks/useOrgResources";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { TextArea } from "@/components/ui/TextArea";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { TicketPriorityBadge, TicketStatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils/format";
import type { TicketStatus } from "@/types/api";

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: ticketId } = use(params);
  const { orgId, role } = useAuth();
  const canManage = roleCan(role, "tickets:manage");
  const router = useRouter();
  const { showToast } = useToast();

  const { data: ticket, isLoading, isError } = useTicket(orgId!, ticketId);
  const { data: notesData } = useTicketNotes(orgId!, ticketId);
  const { data: membershipsData } = useMemberships(orgId!);
  const updateStatus = useUpdateTicketStatus(orgId!, ticketId);
  const assignTicket = useAssignTicket(orgId!, ticketId);
  const addNote = useAddTicketNote(orgId!, ticketId);

  const [noteText, setNoteText] = useState("");

  const handleStatusChange = async (status: TicketStatus) => {
    try {
      await updateStatus.mutateAsync(status);
      showToast("success", "Status updated.");
    } catch {
      showToast("error", "Couldn't update status.");
    }
  };

  const handleAssign = async (agentId: string) => {
    if (!agentId) return;
    try {
      await assignTicket.mutateAsync(agentId);
      showToast("success", "Ticket assigned.");
    } catch {
      showToast("error", "Couldn't assign this ticket.");
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      await addNote.mutateAsync({ content: noteText.trim() });
      setNoteText("");
    } catch {
      showToast("error", "Couldn't add note.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !ticket) {
    return <Alert tone="danger">Couldn&apos;t load this ticket. It may not exist.</Alert>;
  }

  const allMembers = membershipsData?.memberships ?? [];
  const assignableMembers = allMembers.filter((m) => m.role !== "viewer");
  const currentAssignee = allMembers.find((m) => m.user_id === ticket.assigned_agent_id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/tickets")}
          aria-label="Back to tickets"
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <h1 className="text-xl font-semibold text-neutral-900">{ticket.title}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Internal notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(notesData?.notes ?? []).length === 0 ? (
                <p className="text-sm text-neutral-500">No notes yet.</p>
              ) : (
                <ul className="space-y-3">
                  {notesData!.notes.map((note) => (
                    <li key={note.id} className="rounded-md bg-neutral-50 p-3 text-sm">
                      <p className="text-neutral-800">{note.content}</p>
                      <p className="mt-1 text-xs text-neutral-400">{formatDateTime(note.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}

              {canManage && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleAddNote();
                }}
                className="flex gap-2"
              >
                <TextArea
                  aria-label="Internal note"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add an internal note (not visible to the customer)..."
                  className="min-h-16 flex-1"
                />
                <Button type="submit" size="sm" isLoading={addNote.isPending} className="self-end">
                  <Send className="h-4 w-4" aria-hidden="true" />
                </Button>
              </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Status</span>
                <TicketStatusBadge status={ticket.status} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Priority</span>
                <TicketPriorityBadge priority={ticket.priority} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Assigned to</span>
                <span className="text-sm text-neutral-900">
                  {ticket.assigned_agent_id ? (currentAssignee?.full_name ?? "Unknown user") : "Unassigned"}
                </span>
              </div>

              {canManage && (<>
              <Select
                label="Update status"
                value={ticket.status}
                onChange={(e) => void handleStatusChange(e.target.value as TicketStatus)}
                disabled={updateStatus.isPending}
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Select>

              <Select
                label="Assign to"
                defaultValue=""
                onChange={(e) => void handleAssign(e.target.value)}
                disabled={assignTicket.isPending}
              >
                <option value="">{ticket.assigned_agent_id ? "Reassign..." : "Unassigned"}</option>
                {assignableMembers.map((m) => (
                  <option key={m.id} value={m.user_id}>
                    {m.full_name} ({m.role})
                  </option>
                ))}
              </Select>
              </>)}

              <p className="text-xs text-neutral-400">Created {formatDateTime(ticket.created_at)}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
