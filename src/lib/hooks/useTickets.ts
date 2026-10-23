import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ticketsApi } from "@/lib/api/tickets";
import type { TicketCreateRequest, TicketNoteCreateRequest, TicketStatus } from "@/types/api";

const KEYS = {
  list: (orgId: string, statusFilter?: TicketStatus) => ["tickets", orgId, statusFilter ?? "all"] as const,
  detail: (orgId: string, id: string) => ["tickets", orgId, "detail", id] as const,
  notes: (orgId: string, id: string) => ["tickets", orgId, "detail", id, "notes"] as const,
};

export function useTickets(orgId: string, statusFilter?: TicketStatus) {
  return useQuery({
    queryKey: KEYS.list(orgId, statusFilter),
    queryFn: () => ticketsApi.list(orgId, statusFilter),
  });
}

export function useTicket(orgId: string, ticketId: string) {
  return useQuery({
    queryKey: KEYS.detail(orgId, ticketId),
    queryFn: () => ticketsApi.get(orgId, ticketId),
  });
}

export function useTicketNotes(orgId: string, ticketId: string) {
  return useQuery({
    queryKey: KEYS.notes(orgId, ticketId),
    queryFn: () => ticketsApi.listNotes(orgId, ticketId),
  });
}

export function useCreateTicket(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: TicketCreateRequest) => ticketsApi.create(orgId, req),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tickets", orgId] }),
  });
}

export function useUpdateTicketStatus(orgId: string, ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: TicketStatus) => ticketsApi.updateStatus(orgId, ticketId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(orgId, ticketId) });
      queryClient.invalidateQueries({ queryKey: ["tickets", orgId] });
    },
  });
}

export function useAssignTicket(orgId: string, ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => ticketsApi.assign(orgId, ticketId, agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(orgId, ticketId) });
      queryClient.invalidateQueries({ queryKey: ["tickets", orgId] });
    },
  });
}

export function useAddTicketNote(orgId: string, ticketId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: TicketNoteCreateRequest) => ticketsApi.addNote(orgId, ticketId, req),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.notes(orgId, ticketId) }),
  });
}
