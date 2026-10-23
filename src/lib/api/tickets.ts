import { apiFetch } from "./client";
import type {
  TicketCreateRequest,
  TicketListResponse,
  TicketNoteCreateRequest,
  TicketNoteListResponse,
  TicketNotePublic,
  TicketPublic,
  TicketStatus,
} from "@/types/api";

export const ticketsApi = {
  list: (orgId: string, statusFilter?: TicketStatus) => {
    const qs = statusFilter ? `?status=${statusFilter}` : "";
    return apiFetch<TicketListResponse>(`/orgs/${orgId}/tickets${qs}`);
  },

  get: (orgId: string, ticketId: string) => apiFetch<TicketPublic>(`/orgs/${orgId}/tickets/${ticketId}`),

  create: (orgId: string, req: TicketCreateRequest) =>
    apiFetch<TicketPublic>(`/orgs/${orgId}/tickets`, { method: "POST", body: req }),

  assign: (orgId: string, ticketId: string, agentId: string) =>
    apiFetch<TicketPublic>(`/orgs/${orgId}/tickets/${ticketId}/assign?agent_id=${agentId}`, {
      method: "POST",
    }),

  updateStatus: (orgId: string, ticketId: string, status: TicketStatus) =>
    apiFetch<TicketPublic>(`/orgs/${orgId}/tickets/${ticketId}/status`, {
      method: "POST",
      body: { status },
    }),

  listNotes: (orgId: string, ticketId: string) =>
    apiFetch<TicketNoteListResponse>(`/orgs/${orgId}/tickets/${ticketId}/notes`),

  addNote: (orgId: string, ticketId: string, req: TicketNoteCreateRequest) =>
    apiFetch<TicketNotePublic>(`/orgs/${orgId}/tickets/${ticketId}/notes`, { method: "POST", body: req }),
};
