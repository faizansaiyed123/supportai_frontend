import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api/documents";
import type { URLDocumentCreateRequest } from "@/types/api";

const KEYS = {
  list: (orgId: string) => ["documents", orgId] as const,
  detail: (orgId: string, id: string) => ["documents", orgId, id] as const,
};

/** Documents move through pending -> processing -> ready/failed asynchronously (the real
 * ingestion pipeline runs in a background worker) - poll while any document is still in
 * flight so status updates show up without a manual refresh, and stop polling once nothing
 * is pending (avoids hammering the API once ingestion has settled). */
export function useDocuments(orgId: string) {
  return useQuery({
    queryKey: KEYS.list(orgId),
    queryFn: () => documentsApi.list(orgId),
    refetchInterval: (query) => {
      const hasInFlight = query.state.data?.documents.some(
        (d) => d.status === "pending" || d.status === "processing",
      );
      return hasInFlight ? 3000 : false;
    },
  });
}

export function useDocument(orgId: string, documentId: string) {
  return useQuery({
    queryKey: KEYS.detail(orgId, documentId),
    queryFn: () => documentsApi.get(orgId, documentId),
    refetchInterval: (query) =>
      query.state.data?.status === "pending" || query.state.data?.status === "processing" ? 3000 : false,
  });
}

export function useUploadDocument(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => documentsApi.upload(orgId, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.list(orgId) }),
  });
}

export function useUploadDocumentVersion(orgId: string, documentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => documentsApi.uploadNewVersion(orgId, documentId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.detail(orgId, documentId) });
      queryClient.invalidateQueries({ queryKey: KEYS.list(orgId) });
    },
  });
}

export function useCreateDocumentFromUrl(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: URLDocumentCreateRequest) => documentsApi.createFromUrl(orgId, req),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.list(orgId) }),
  });
}

export function useDeleteDocument(orgId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentsApi.remove(orgId, documentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.list(orgId) }),
  });
}
