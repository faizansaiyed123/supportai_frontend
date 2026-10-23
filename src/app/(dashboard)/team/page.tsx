"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Plus, UsersRound } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useChangeRole, useInviteMember, useMemberships } from "@/lib/hooks/useOrgResources";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api/client";
import { inviteSchema, type InviteFormValues } from "@/lib/validation/schemas";
import { formatRelativeTime } from "@/lib/utils/format";
import type { MembershipPublic } from "@/types/api";

function InviteModal({ orgId, isOpen, onClose }: { orgId: string; isOpen: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const inviteMember = useInviteMember(orgId);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InviteFormValues>({ resolver: zodResolver(inviteSchema), defaultValues: { role: "agent" } });

  const handleClose = () => {
    reset();
    setInviteLink(null);
    setCopied(false);
    onClose();
  };

  const onSubmit = async (values: InviteFormValues) => {
    try {
      const result = await inviteMember.mutateAsync(values);
      // No email provider is wired up in the backend yet (documented in backend/DECISIONS.md
      // D027 / docs/SECURITY.md) - the invite link is shown here for the admin to copy and
      // send manually, rather than the frontend pretending an email went out.
      const link = `${window.location.origin}/accept-invite?token=${result.invite_token}`;
      setInviteLink(link);
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.detail : "Couldn't send invite.");
    }
  };

  const handleCopy = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API is unavailable outside secure contexts (e.g. plain http on a LAN IP).
      showToast("error", "Couldn't copy automatically - select the link and copy it manually.");
    }
  };

  if (inviteLink) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Invite created">
        <div className="space-y-4">
          <Alert tone="info">
            There&apos;s no email delivery configured yet - copy this link and send it to your teammate
            directly. It expires in 72 hours.
          </Alert>
          <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
            <code className="flex-1 overflow-x-auto text-xs text-neutral-700">{inviteLink}</code>
            <button onClick={() => void handleCopy()} aria-label="Copy invite link" className="shrink-0 text-neutral-500 hover:text-neutral-700">
              {copied ? <Check className="h-4 w-4 text-success-600" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>
          <Button className="w-full" onClick={handleClose}>
            Done
          </Button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invite a teammate">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Input label="Full name" error={errors.full_name?.message} {...register("full_name")} />
        <Input label="Email" type="email" error={errors.email?.message} {...register("email")} />
        <Select label="Role" error={errors.role?.message} {...register("role")}>
          <option value="admin">Admin</option>
          <option value="agent">Agent</option>
          <option value="viewer">Viewer</option>
        </Select>
        <Button type="submit" className="w-full" isLoading={inviteMember.isPending}>
          Send invite
        </Button>
      </form>
    </Modal>
  );
}

function RoleSelect({ orgId, member, canManage }: { orgId: string; member: MembershipPublic; canManage: boolean }) {
  const { showToast } = useToast();
  const changeRole = useChangeRole(orgId);

  // Read-only for non-admins and for the owner row. This is UI convenience only - the
  // backend enforces members:manage on the role-change endpoint regardless (D005).
  if (member.role === "owner" || !canManage) {
    return <span className="text-sm capitalize text-neutral-500">{member.role}</span>;
  }

  return (
    <Select
      value={member.role}
      disabled={changeRole.isPending}
      onChange={async (e) => {
        try {
          await changeRole.mutateAsync({ membershipId: member.id, req: { role: e.target.value as "admin" | "agent" | "viewer" } });
          showToast("success", `${member.full_name}'s role updated.`);
        } catch {
          showToast("error", "Couldn't update role.");
        }
      }}
      className="h-8 text-xs"
    >
      <option value="admin">Admin</option>
      <option value="agent">Agent</option>
      <option value="viewer">Viewer</option>
    </Select>
  );
}

export default function TeamPage() {
  const { orgId, role } = useAuth();
  const canManage = role === "owner" || role === "admin";
  const { data, isLoading, isError } = useMemberships(orgId!);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Team</h1>
          <p className="mt-1 text-sm text-neutral-500">People with access to your organization.</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Invite teammate
          </Button>
        )}
      </div>

      <Card>
        {isError ? (
          <div className="p-5 text-sm text-danger-600">Couldn&apos;t load your team. Please refresh.</div>
        ) : !isLoading && data!.memberships.length === 0 ? (
          <EmptyState icon={UsersRound} title="Just you so far" description="Invite teammates to collaborate." />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Email</TableHeaderCell>
                <TableHeaderCell>Role</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Joined</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 3 }).map((_, i) => <TableRowSkeleton key={i} columns={5} />)
                : data!.memberships.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-neutral-900">{m.full_name}</TableCell>
                      <TableCell>{m.email}</TableCell>
                      <TableCell>
                        <RoleSelect orgId={orgId!} member={m} canManage={canManage} />
                      </TableCell>
                      <TableCell className="capitalize">{m.status}</TableCell>
                      <TableCell>{formatRelativeTime(m.created_at)}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <InviteModal orgId={orgId!} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
