"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Users } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { roleCan } from "@/lib/auth/permissions";
import { useCreateCustomer, useCustomers } from "@/lib/hooks/useOrgResources";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api/client";
import { createCustomerSchema, type CreateCustomerFormValues } from "@/lib/validation/schemas";
import { formatRelativeTime } from "@/lib/utils/format";

function CreateCustomerModal({ orgId, isOpen, onClose }: { orgId: string; isOpen: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const createCustomer = useCreateCustomer(orgId);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCustomerFormValues>({ resolver: zodResolver(createCustomerSchema) });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (values: CreateCustomerFormValues) => {
    try {
      await createCustomer.mutateAsync({
        name: values.name || undefined,
        email: values.email || undefined,
        external_id: values.external_id || undefined,
      });
      showToast("success", "Customer added.");
      handleClose();
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.detail : "Couldn't add customer.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add customer">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Name" error={errors.name?.message} {...register("name")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Input
          label="External ID (optional)"
          hint="Their ID in your own system, if you have one"
          error={errors.external_id?.message}
          {...register("external_id")}
        />
        <Button type="submit" className="w-full" isLoading={createCustomer.isPending}>
          Add customer
        </Button>
      </form>
    </Modal>
  );
}

export default function CustomersPage() {
  const { orgId, role } = useAuth();
  const canManage = roleCan(role, "customers:manage");
  const { data, isLoading, isError } = useCustomers(orgId!);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Customers</h1>
          <p className="mt-1 text-sm text-neutral-500">People you support.</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add customer
          </Button>
        )}
      </div>

      <Card>
        {isError ? (
          <div className="p-5 text-sm text-danger-600">Couldn&apos;t load customers. Please refresh.</div>
        ) : !isLoading && data!.customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add a customer before creating tickets for them."
            action={
              canManage ? (
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                  Add your first customer
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>External ID</TableHeaderCell>
                <TableHeaderCell>Added</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} columns={4} />)
                : data!.customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-neutral-900">{c.name ?? "—"}</TableCell>
                      <TableCell>{c.email ?? "—"}</TableCell>
                      <TableCell>{c.external_id ?? "—"}</TableCell>
                      <TableCell>{formatRelativeTime(c.created_at)}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateCustomerModal orgId={orgId!} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
