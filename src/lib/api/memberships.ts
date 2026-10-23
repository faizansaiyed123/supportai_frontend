import { apiFetch } from "./client";
import type { InviteRequest, InviteResponse, MembershipListResponse, MembershipPublic, RoleChangeRequest } from "@/types/api";

export const membershipsApi = {
  list: (orgId: string) => apiFetch<MembershipListResponse>(`/orgs/${orgId}/memberships`),

  invite: (orgId: string, req: InviteRequest) =>
    apiFetch<InviteResponse>(`/orgs/${orgId}/memberships/invite`, { method: "POST", body: req }),

  changeRole: (orgId: string, membershipId: string, req: RoleChangeRequest) =>
    apiFetch<MembershipPublic>(`/orgs/${orgId}/memberships/${membershipId}/role`, {
      method: "POST",
      body: req,
    }),
};
