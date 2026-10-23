import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { conversationsApi } from "@/lib/api/conversations";
import type { AskQuestionRequest } from "@/types/api";

const KEYS = {
  list: (orgId: string) => ["conversations", orgId] as const,
  messages: (orgId: string, conversationId: string) => ["conversations", orgId, conversationId, "messages"] as const,
};

export function useConversations(orgId: string) {
  return useQuery({
    queryKey: KEYS.list(orgId),
    queryFn: () => conversationsApi.list(orgId),
  });
}

export function useConversationMessages(orgId: string, conversationId: string | null) {
  return useQuery({
    queryKey: KEYS.messages(orgId, conversationId ?? ""),
    queryFn: () => conversationsApi.listMessages(orgId, conversationId!),
    enabled: conversationId != null,
  });
}

export function useCreateConversation(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => conversationsApi.create(orgId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list(orgId) });
    },
  });
}

export function useAskQuestion(orgId: string, conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: AskQuestionRequest) => conversationsApi.askQuestion(orgId, conversationId, req),
    onSuccess: () => {
      // Re-fetch the real persisted history rather than optimistically appending the answer
      // client-side - the backend is the source of truth for exact content/citations/
      // ordering, and a re-fetch is cheap here (Sec. "don't fake data where a real API
      // exists").
      queryClient.invalidateQueries({ queryKey: KEYS.messages(orgId, conversationId) });
      queryClient.invalidateQueries({ queryKey: KEYS.list(orgId) });
    },
  });
}

export function useEscalateConversation(orgId: string, conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => conversationsApi.escalate(orgId, conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list(orgId) });
    },
  });
}
