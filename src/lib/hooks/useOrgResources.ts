import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { customersApi } from "@/lib/api/customers";
import { membershipsApi } from "@/lib/api/memberships";
import type { CustomerCreateRequest, InviteRequest, RoleChangeRequest } from "@/types/api";

export function useCustomers(orgId: string) {
  return useQuery({ queryKey: ["customers", orgId], queryFn: () => customersApi.list(orgId) });
}

export function useCreateCustomer(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CustomerCreateRequest) => customersApi.create(orgId, req),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["customers", orgId] }),
  });
}

export function useMemberships(orgId: string) {
  return useQuery({ queryKey: ["memberships", orgId], queryFn: () => membershipsApi.list(orgId) });
}

export function useInviteMember(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: InviteRequest) => membershipsApi.invite(orgId, req),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["memberships", orgId] }),
  });
}

export function useChangeRole(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ membershipId, req }: { membershipId: string; req: RoleChangeRequest }) =>
      membershipsApi.changeRole(orgId, membershipId, req),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["memberships", orgId] }),
  });
}
