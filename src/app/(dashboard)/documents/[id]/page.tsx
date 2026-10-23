"use client";

import { use, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { roleCan } from "@/lib/auth/permissions";
import { useDeleteDocument, useDocument, useUploadDocumentVersion } from "@/lib/hooks/useDocuments";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { DocumentStatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api/client";
import { formatDateTime } from "@/lib/utils/format";

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: documentId } = use(params);
  const { orgId, role } = useAuth();
  const canManage = roleCan(role, "knowledge:manage");
  const router = useRouter();
  const { showToast } = useToast();
  const { data: document, isLoading, isError } = useDocument(orgId!, documentId);
  const uploadVersion = useUploadDocumentVersion(orgId!, documentId);
  const deleteDocument = useDeleteDocument(orgId!);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleNewVersion = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    try {
      await uploadVersion.mutateAsync(file);
      showToast("success", "New version uploaded - re-processing will finish shortly.");
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.detail : "Couldn't upload a new version.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDocument.mutateAsync(documentId);
      showToast("success", "Document deleted.");
      router.push("/documents");
    } catch {
      showToast("error", "Couldn't delete this document.");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !document) {
    return <Alert tone="danger">Couldn&apos;t load this document. It may have been deleted.</Alert>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/documents")}
          aria-label="Back to knowledge base"
          className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <h1 className="text-xl font-semibold text-neutral-900">{document.title}</h1>
      </div>

      {document.status === "failed" && document.status_error && (
        <Alert tone="danger">Processing failed: {document.status_error}</Alert>
      )}
      {(document.status === "pending" || document.status === "processing") && (
        <Alert tone="info">This document is still being processed and isn&apos;t searchable yet.</Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <DocumentStatusBadge status={document.status} />
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <Row label="Original filename" value={document.original_filename ?? "—"} />
          <Row label="Type" value={document.mime_type ?? "—"} />
          <Row label="Added" value={formatDateTime(document.created_at)} />
          <Row label="Last updated" value={formatDateTime(document.updated_at)} />
        </CardContent>
      </Card>

      {canManage && (
      <Card>
        <CardHeader>
          <CardTitle>Replace content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-neutral-500">
            Uploading a new version re-processes this document with the new content - the previous
            version&apos;s extracted text is kept but this document immediately starts using the new one.
          </p>
          {/* A real <button> deliberately kept OUTSIDE any <label> (nesting an interactive
              button inside a label associated with a different control is both invalid HTML
              and an accessibility anti-pattern) - clicking it just programmatically triggers
              the hidden, ref'd file input instead. */}
          <Button variant="secondary" isLoading={uploadVersion.isPending} onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-4 w-4" aria-hidden="true" />
            Upload new version
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={() => void handleNewVersion()}
          />
        </CardContent>
      </Card>

      )}

      {canManage && (
      <Card className="border-danger-200">
        <CardHeader>
          <CardTitle className="text-danger-700">Danger zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="danger" onClick={() => setIsDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete document
          </Button>
        </CardContent>
      </Card>
      )}

      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete this document?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={() => void handleDelete()} isLoading={deleteDocument.isPending}>
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-neutral-600">
          This removes &quot;{document.title}&quot; and everything derived from it from your knowledge
          base. This can&apos;t be undone.
        </p>
      </Modal>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-neutral-100 py-1.5 last:border-0">
      <span className="text-neutral-500">{label}</span>
      <span className="text-neutral-900">{value}</span>
    </div>
  );
}
