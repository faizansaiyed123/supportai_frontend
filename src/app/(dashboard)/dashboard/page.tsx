"use client";

import Link from "next/link";
import { FileText, Inbox, Ticket, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useConversations } from "@/lib/hooks/useConversations";
import { useTickets } from "@/lib/hooks/useTickets";
import { useDocuments } from "@/lib/hooks/useDocuments";
import { useCustomers } from "@/lib/hooks/useOrgResources";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

function StatCard({
  href,
  icon: Icon,
  label,
  value,
  isLoading,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  value: number | undefined;
  isLoading: boolean;
}) {
  return (
    <Link href={href}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center gap-4">
          <div className="rounded-lg bg-brand-50 p-3">
            <Icon className="h-5 w-5 text-brand-600" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm text-neutral-500">{label}</p>
            {isLoading ? (
              <Skeleton className="mt-1 h-7 w-10" />
            ) : (
              <p className="text-2xl font-semibold text-neutral-900">{value}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { orgId } = useAuth();
  const conversations = useConversations(orgId!);
  const tickets = useTickets(orgId!);
  const documents = useDocuments(orgId!);
  const customers = useCustomers(orgId!);

  const openTicketCount = tickets.data?.tickets.filter((t) => t.status === "open").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">An overview of what's happening across your organization.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href="/conversations"
          icon={Inbox}
          label="Conversations"
          value={conversations.data?.conversations.length}
          isLoading={conversations.isLoading}
        />
        <StatCard href="/tickets" icon={Ticket} label="Open tickets" value={openTicketCount} isLoading={tickets.isLoading} />
        <StatCard
          href="/documents"
          icon={FileText}
          label="Knowledge base articles"
          value={documents.data?.documents.length}
          isLoading={documents.isLoading}
        />
        <StatCard href="/customers" icon={Users} label="Customers" value={customers.data?.customers.length} isLoading={customers.isLoading} />
      </div>
    </div>
  );
}
