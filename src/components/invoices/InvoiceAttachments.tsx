"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { InvoiceAttachment } from "@/lib/supabase/types";

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Props {
  invoiceId: string;
  orgId: string;
  initialAttachments: InvoiceAttachment[];
}

export default function InvoiceAttachments({ invoiceId, orgId, initialAttachments }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("File type not supported. Allowed: PDF, images, DOCX, XLSX.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }

    setError(null);
    setUploading(true);

    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${orgId}/${invoiceId}/${uniqueName}`;

    const { error: uploadError } = await supabase.storage
      .from("attachments")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const { data: urlData } = supabase.storage.from("attachments").getPublicUrl(path);

    const { data: record, error: dbError } = await supabase
      .from("invoice_attachments")
      .insert({
        org_id: orgId,
        invoice_id: invoiceId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (dbError) {
      setError(dbError.message);
      return;
    }

    if (record) {
      setAttachments((prev) => [...prev, record as InvoiceAttachment]);
    }
  }

  async function handleDelete(attachment: InvoiceAttachment) {
    if (!confirm(`Remove "${attachment.file_name}"?`)) return;
    setDeletingId(attachment.id);

    const supabase = createClient();

    // Extract storage path from URL
    const url = new URL(attachment.file_url);
    const storagePath = url.pathname.split("/object/public/attachments/")[1];
    if (storagePath) {
      await supabase.storage.from("attachments").remove([storagePath]);
    }

    await supabase.from("invoice_attachments").delete().eq("id", attachment.id);

    setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-950 dark:text-neutral-50 text-base">Attachments</h3>
        <label className={`cursor-pointer text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-neutral-50 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? "Uploading…" : "+ Add file"}
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleUpload}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {attachments.length === 0 && !uploading ? (
        <p className="text-sm text-neutral-400 dark:text-neutral-500">No attachments yet.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li key={a.id} className="flex items-center gap-3 text-sm">
              <div className="flex-1 min-w-0">
                <a
                  href={a.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-neutral-800 dark:text-neutral-200 hover:underline truncate block"
                >
                  {a.file_name}
                </a>
                <p className="text-xs text-neutral-400">{formatBytes(a.file_size)}</p>
              </div>
              <button
                onClick={() => handleDelete(a)}
                disabled={deletingId === a.id}
                className="text-xs text-neutral-400 hover:text-red-600 dark:hover:text-red-400 transition-colors shrink-0 disabled:opacity-50"
              >
                {deletingId === a.id ? "…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
