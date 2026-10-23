"use client";

import { useRouter } from "next/navigation";
import { Inbox, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { roleCan } from "@/lib/auth/permissions";
import { useConversations, useCreateConversation } from "@/lib/hooks/useConversations";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConversationStatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { formatRelativeTime } from "@/lib/utils/format";

export default function ConversationsPage() {
  const { orgId, role } = useAuth();
  const canRespond = roleCan(role, "conversations:respond");
  const router = useRouter();
  const { showToast } = useToast();
  const { data, isLoading, isError } = useConversations(orgId!);
  const createConversation = useCreateConversation(orgId!);

  const handleNewConversation = async () => {
    try {
      const conversation = await createConversation.mutateAsync();
      router.push(`/conversations/${conversation.id}`);
    } catch {
      showToast("error", "Couldn't start a new conversation. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Conversations</h1>
          <p className="mt-1 text-sm text-neutral-500">Ask your knowledge base questions and review past answers.</p>
        </div>
        {canRespond && (
          <Button onClick={() => void handleNewConversation()} isLoading={createConversation.isPending}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New conversation
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-5 text-sm text-danger-600">Couldn&apos;t load conversations. Please refresh.</div>
        ) : data!.conversations.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No conversations yet"
            description="Start one to ask your knowledge base a question."
            action={
              canRespond ? (
                <Button size="sm" onClick={() => void handleNewConversation()}>
                  Start a conversation
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-neutral-200">
            {data!.conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => router.push(`/conversations/${c.id}`)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left hover:bg-neutral-50"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">Conversation {c.id.slice(0, 8)}</p>
                    <p className="text-xs text-neutral-500">Started {formatRelativeTime(c.created_at)}</p>
                  </div>
                  <ConversationStatusBadge status={c.status} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
