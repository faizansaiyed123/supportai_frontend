import { apiFetch } from "./client";
import type { DocumentListResponse, DocumentPublic, URLDocumentCreateRequest } from "@/types/api";

export const documentsApi = {
  list: (orgId: string) => apiFetch<DocumentListResponse>(`/orgs/${orgId}/documents`),

  get: (orgId: string, documentId: string) =>
    apiFetch<DocumentPublic>(`/orgs/${orgId}/documents/${documentId}`),

  upload: (orgId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<DocumentPublic>(`/orgs/${orgId}/documents`, { method: "POST", body: form });
  },

  uploadNewVersion: (orgId: string, documentId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<DocumentPublic>(`/orgs/${orgId}/documents/${documentId}/versions`, {
      method: "POST",
      body: form,
    });
  },

  createFromUrl: (orgId: string, req: URLDocumentCreateRequest) =>
    apiFetch<DocumentPublic>(`/orgs/${orgId}/documents/from-url`, { method: "POST", body: req }),

  remove: (orgId: string, documentId: string) =>
    apiFetch<void>(`/orgs/${orgId}/documents/${documentId}`, { method: "DELETE" }),
};
