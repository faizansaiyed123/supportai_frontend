"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Ticket as TicketIcon } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { roleCan } from "@/lib/auth/permissions";
import { useCreateTicket, useTickets } from "@/lib/hooks/useTickets";
import { useCustomers } from "@/lib/hooks/useOrgResources";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { TicketPriorityBadge, TicketStatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api/client";
import { createTicketSchema, type CreateTicketFormValues } from "@/lib/validation/schemas";
import { formatRelativeTime } from "@/lib/utils/format";
import type { TicketStatus } from "@/types/api";

const STATUS_TABS: { label: string; value: TicketStatus | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Open", value: "open" },
  { label: "Pending", value: "pending" },
  { label: "Resolved", value: "resolved" },
  { label: "Closed", value: "closed" },
];

function CreateTicketModal({ orgId, isOpen, onClose }: { orgId: string; isOpen: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const router = useRouter();
  const { data: customersData } = useCustomers(orgId);
  const createTicket = useCreateTicket(orgId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTicketFormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { priority: "normal" },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: CreateTicketFormValues) => {
    try {
      const ticket = await createTicket.mutateAsync(values);
      showToast("success", "Ticket created.");
      handleClose();
      router.push(`/tickets/${ticket.id}`);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.detail : "Couldn't create ticket.");
    }
  };

  const customers = customersData?.customers ?? [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New ticket">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {customers.length === 0 ? (
          <p className="text-sm text-neutral-500">
            You need at least one customer before creating a ticket.{" "}
            <a href="/customers" className="font-medium text-brand-600 hover:text-brand-700">
              Add one first
            </a>
            .
          </p>
        ) : (
          <>
            <Select label="Customer" error={errors.customer_id?.message} {...register("customer_id")}>
              <option value="">Select a customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.email ?? c.id}
                </option>
              ))}
            </Select>
            <Input label="Title" error={errors.title?.message} {...register("title")} />
            <Select label="Priority" error={errors.priority?.message} {...register("priority")}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Button type="submit" className="w-full" isLoading={createTicket.isPending}>
              Create ticket
            </Button>
          </>
        )}
      </form>
    </Modal>
  );
}

export default function TicketsPage() {
  const { orgId, role } = useAuth();
  const canManage = roleCan(role, "tickets:manage");
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<TicketStatus | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data, isLoading, isError } = useTickets(orgId!, statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Tickets</h1>
          <p className="mt-1 text-sm text-neutral-500">Track and resolve customer support requests.</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New ticket
          </Button>
        )}
      </div>

      <div className="flex gap-1 border-b border-neutral-200">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setStatusFilter(tab.value)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${
              statusFilter === tab.value
                ? "border-brand-600 text-brand-600"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {isError ? (
          <div className="p-5 text-sm text-danger-600">Couldn&apos;t load tickets. Please refresh.</div>
        ) : !isLoading && data!.tickets.length === 0 ? (
          <EmptyState
            icon={TicketIcon}
            title="No tickets here"
            description="Tickets will show up once created."
            action={
              canManage ? (
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                  Create a ticket
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Priority</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} columns={4} />)
                : data!.tickets.map((ticket) => (
                    <TableRow key={ticket.id} onClick={() => router.push(`/tickets/${ticket.id}`)}>
                      <TableCell className="font-medium text-neutral-900">{ticket.title}</TableCell>
                      <TableCell>
                        <TicketStatusBadge status={ticket.status} />
                      </TableCell>
                      <TableCell>
                        <TicketPriorityBadge priority={ticket.priority} />
                      </TableCell>
                      <TableCell>{formatRelativeTime(ticket.created_at)}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateTicketModal orgId={orgId!} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
