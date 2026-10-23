"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Link as LinkIcon, Plus, Upload } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { roleCan } from "@/lib/auth/permissions";
import { useCreateDocumentFromUrl, useDocuments, useUploadDocument } from "@/lib/hooks/useDocuments";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { DocumentStatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/lib/api/client";
import { addUrlDocumentSchema, type AddUrlDocumentFormValues } from "@/lib/validation/schemas";
import { formatRelativeTime } from "@/lib/utils/format";

// Matches backend/app/services/extraction.py's SUPPORTED_MIME_TYPES allowlist - kept in sync
// by hand (D033's discipline) since there's no live OpenAPI schema to generate this from.
const ACCEPTED_FILE_EXTENSIONS = ".txt,.md,.markdown,.html,.htm,.pdf";

function UploadModal({ orgId, isOpen, onClose }: { orgId: string; isOpen: boolean; onClose: () => void }) {
  const { showToast } = useToast();
  const [mode, setMode] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDocument = useUploadDocument(orgId);
  const createFromUrl = useCreateDocumentFromUrl(orgId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddUrlDocumentFormValues>({ resolver: zodResolver(addUrlDocumentSchema) });

  const handleClose = () => {
    reset();
    setMode("file");
    onClose();
  };

  const handleFileUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;
    try {
      await uploadDocument.mutateAsync(file);
      showToast("success", "Document uploaded - processing will finish shortly.");
      handleClose();
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.detail : "Upload failed. Please try again.");
    }
  };

  const handleUrlSubmit = async (values: AddUrlDocumentFormValues) => {
    try {
      await createFromUrl.mutateAsync({ url: values.url, title: values.title || undefined });
      showToast("success", "Page fetched - processing will finish shortly.");
      handleClose();
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.detail : "Couldn't fetch that URL.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add to knowledge base">
      <div className="mb-4 flex gap-1 rounded-md bg-neutral-100 p-1">
        <button
          onClick={() => setMode("file")}
          className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${mode === "file" ? "bg-white shadow-sm" : "text-neutral-500"}`}
        >
          Upload file
        </button>
        <button
          onClick={() => setMode("url")}
          className={`flex-1 rounded px-3 py-1.5 text-sm font-medium ${mode === "url" ? "bg-white shadow-sm" : "text-neutral-500"}`}
        >
          Import from URL
        </button>
      </div>

      {mode === "file" ? (
        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 px-6 py-10 text-center hover:border-brand-400">
            <Upload className="h-6 w-6 text-neutral-400" aria-hidden="true" />
            <span className="text-sm text-neutral-600">Click to choose a file</span>
            <span className="text-xs text-neutral-400">Markdown, plain text, HTML, or PDF</span>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_FILE_EXTENSIONS}
              className="sr-only"
              onChange={() => void handleFileUpload()}
            />
          </label>
        </div>
      ) : (
        <form onSubmit={handleSubmit(handleUrlSubmit)} noValidate className="space-y-4">
          <Input label="URL" placeholder="https://example.com/help/refunds" error={errors.url?.message} {...register("url")} />
          <Input label="Title (optional)" error={errors.title?.message} {...register("title")} />
          <Button type="submit" className="w-full" isLoading={createFromUrl.isPending}>
            <LinkIcon className="h-4 w-4" aria-hidden="true" />
            Fetch and add
          </Button>
        </form>
      )}
    </Modal>
  );
}

export default function DocumentsPage() {
  const { orgId, role } = useAuth();
  const canManage = roleCan(role, "knowledge:manage");
  const router = useRouter();
  const { data, isLoading, isError } = useDocuments(orgId!);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Knowledge base</h1>
          <p className="mt-1 text-sm text-neutral-500">Documents your AI assistant uses to answer questions.</p>
        </div>
        {canManage && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add document
          </Button>
        )}
      </div>

      <Card>
        {isError ? (
          <div className="p-5 text-sm text-danger-600">Couldn&apos;t load documents. Please refresh.</div>
        ) : !isLoading && data!.documents.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description={canManage ? "Upload a file or import a web page to get started." : "An admin needs to add documents."}
            action={
              canManage ? (
                <Button size="sm" onClick={() => setIsModalOpen(true)}>
                  Add your first document
                </Button>
              ) : undefined
            }
          />
        ) : (
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Title</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Added</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} columns={4} />)
                : data!.documents.map((doc) => (
                    <TableRow key={doc.id} onClick={() => router.push(`/documents/${doc.id}`)}>
                      <TableCell className="font-medium text-neutral-900">{doc.title}</TableCell>
                      <TableCell>{doc.mime_type ?? "—"}</TableCell>
                      <TableCell>
                        <DocumentStatusBadge status={doc.status} />
                      </TableCell>
                      <TableCell>{formatRelativeTime(doc.created_at)}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <UploadModal orgId={orgId!} isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
