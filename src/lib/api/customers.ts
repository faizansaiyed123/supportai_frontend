import { apiFetch } from "./client";
import type { CustomerCreateRequest, CustomerListResponse, CustomerPublic } from "@/types/api";

export const customersApi = {
  list: (orgId: string) => apiFetch<CustomerListResponse>(`/orgs/${orgId}/customers`),

  get: (orgId: string, customerId: string) =>
    apiFetch<CustomerPublic>(`/orgs/${orgId}/customers/${customerId}`),

  create: (orgId: string, req: CustomerCreateRequest) =>
    apiFetch<CustomerPublic>(`/orgs/${orgId}/customers`, { method: "POST", body: req }),
};
