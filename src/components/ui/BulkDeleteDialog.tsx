"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Button } from "./button";
import type { BulkActionResult } from "@/lib/bulk-actions";

interface Props {
  open: boolean;
  /** Bulk delete endpoint, e.g. "/api/invoices/bulk/delete". */
  endpoint: string;
  ids: string[];
  /** Singular noun for the record type, e.g. "invoice". */
  noun: string;
  nounPlural: string;
  onCancel: () => void;
  onDeleted: (result: BulkActionResult) => void;
}

async function post(endpoint: string, ids: string[], dryRun: boolean): Promise<BulkActionResult> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids, dryRun }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Something went wrong. Please try again.");
  return json as BulkActionResult;
}

export function BulkDeleteDialog({
  open,
  endpoint,
  ids,
  noun,
  nounPlural,
  onCancel,
  onDeleted,
}: Props) {
  const [preview, setPreview] = useState<BulkActionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ask the server what would happen. The rules live there, not here.
  useEffect(() => {
    if (!open) {
      setPreview(null);
      setError(null);
      return;
    }

    let cancelled = false;
    setError(null);

    post(endpoint, ids, true)
      .then((result) => {
        if (!cancelled) setPreview(result);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [open, endpoint, ids]);

  async function handleConfirm() {
    setBusy(true);
    setError(null);
    try {
      const result = await post(endpoint, ids, false);
      onDeleted(result);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const deletable = preview?.deleted ?? 0;
  const target = deletable === 1 ? noun : nounPlural;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {preview === null
              ? "Checking…"
              : deletable === 0
                ? `Nothing can be deleted`
                : `Delete ${deletable} ${target}?`}
          </DialogTitle>
          <DialogDescription>
            {preview === null
              ? "Working out what can be deleted."
              : deletable === 0
                ? "None of what you selected can be deleted."
                : "This cannot be undone."}
          </DialogDescription>
        </DialogHeader>

        {preview !== null && preview.reasons.length > 0 && (
          <ul className="space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
            {preview.reasons.map((skip) => (
              <li key={skip.reason}>{skip.reason}.</li>
            ))}
          </ul>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={busy || preview === null || deletable === 0}
          >
            {busy ? "Deleting…" : `Delete ${deletable > 0 ? deletable : ""}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
