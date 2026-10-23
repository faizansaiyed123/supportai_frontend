"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpCircle, FileText, TriangleAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { roleCan } from "@/lib/auth/permissions";
import { useAskQuestion, useConversationMessages, useEscalateConversation } from "@/lib/hooks/useConversations";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { ApiError } from "@/lib/api/client";
import type { MessagePublic } from "@/types/api";

function MessageBubble({ message }: { message: MessagePublic }) {
  const isCustomer = message.role === "customer";
  return (
    <div className={cn("flex flex-col gap-2", isCustomer ? "items-end" : "items-start")}>
      <div
        className={cn(
          "max-w-lg rounded-lg px-4 py-2.5 text-sm",
          isCustomer ? "bg-brand-600 text-white" : "bg-neutral-100 text-neutral-900",
        )}
      >
        {message.content}
      </div>

      {message.citations.length > 0 && (
        <div className="flex max-w-lg flex-wrap gap-1.5">
          {message.citations.map((c) => (
            <div
              key={c.chunk_id}
              title={c.excerpt}
              className="flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-600"
            >
              <FileText className="h-3 w-3" aria-hidden="true" />
              {c.heading_path ?? "Source"}
            </div>
          ))}
        </div>
      )}

      <span className="text-xs text-neutral-400">{formatDateTime(message.created_at)}</span>
    </div>
  );
}

export default function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: conversationId } = use(params);
  const { orgId, role } = useAuth();
  const canRespond = roleCan(role, "conversations:respond");
  const router = useRouter();
  const { showToast } = useToast();

  const { data, isLoading, isError } = useConversationMessages(orgId!, conversationId);
  const askQuestion = useAskQuestion(orgId!, conversationId);
  const escalate = useEscalateConversation(orgId!, conversationId);
  const [question, setQuestion] = useState("");
  const [lastLowConfidence, setLastLowConfidence] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  const handleAsk = async () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setQuestion("");
    try {
      const result = await askQuestion.mutateAsync({ question: trimmed });
      setLastLowConfidence(result.low_confidence);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.detail : "Couldn't send that question. Please try again.");
    }
  };

  const handleEscalate = async () => {
    try {
      await escalate.mutateAsync();
      showToast("success", "Conversation escalated.");
    } catch {
      showToast("error", "Couldn't escalate this conversation.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/conversations")}
            aria-label="Back to conversations"
            className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <h1 className="text-lg font-semibold text-neutral-900">Conversation {conversationId.slice(0, 8)}</h1>
        </div>
        {canRespond && (
          <Button variant="secondary" size="sm" onClick={() => void handleEscalate()} isLoading={escalate.isPending}>
            Escalate to human
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto py-4">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="ml-auto h-10 w-2/3" />
            <Skeleton className="h-16 w-3/4" />
          </div>
        ) : isError ? (
          <Alert tone="danger">Couldn&apos;t load this conversation. Please refresh.</Alert>
        ) : data!.messages.length === 0 ? (
          <p className="py-12 text-center text-sm text-neutral-500">
            Ask a question below to get started - answers are grounded in your knowledge base.
          </p>
        ) : (
          data!.messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}

        {lastLowConfidence && (
          <Alert tone="warning">
            <span className="flex items-center gap-1.5">
              <TriangleAlert className="h-4 w-4" aria-hidden="true" />
              This answer may be incomplete - consider escalating to a human agent.
            </span>
          </Alert>
        )}
        <div ref={scrollRef} />
      </div>

      {canRespond && (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleAsk();
        }}
        className="flex gap-2 border-t border-neutral-200 pt-4"
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          aria-label="Ask a question"
          className="h-11 flex-1 rounded-md border border-neutral-300 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
        <Button type="submit" isLoading={askQuestion.isPending} disabled={!question.trim()}>
          <ArrowUpCircle className="h-4 w-4" aria-hidden="true" />
          Ask
        </Button>
      </form>
      )}
    </div>
  );
}
