import { apiFetch } from "./client";
import type {
  AnswerResponse,
  AskQuestionRequest,
  ConversationCreateRequest,
  ConversationListResponse,
  ConversationPublic,
  MessageListResponse,
} from "@/types/api";

export const conversationsApi = {
  list: (orgId: string) => apiFetch<ConversationListResponse>(`/orgs/${orgId}/conversations`),

  listMessages: (orgId: string, conversationId: string) =>
    apiFetch<MessageListResponse>(`/orgs/${orgId}/conversations/${conversationId}/messages`),

  create: (orgId: string, req: ConversationCreateRequest = {}) =>
    apiFetch<ConversationPublic>(`/orgs/${orgId}/conversations`, { method: "POST", body: req }),

  askQuestion: (orgId: string, conversationId: string, req: AskQuestionRequest) =>
    apiFetch<AnswerResponse>(`/orgs/${orgId}/conversations/${conversationId}/messages`, {
      method: "POST",
      body: req,
    }),

  escalate: (orgId: string, conversationId: string) =>
    apiFetch<ConversationPublic>(`/orgs/${orgId}/conversations/${conversationId}/escalate`, {
      method: "POST",
    }),
};
