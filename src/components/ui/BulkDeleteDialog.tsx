"use client";

import { useEffect, useRef, useState } from "react";
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

  // Identifies the current open/selection "session". A fresh object is created every
  // time the effect below runs (dialog opened, closed, or given a new selection) and
  // its cleanup marks the outgoing session cancelled. `handleConfirm` captures the
  // session active at click time so that if the dialog moves on — closed, reopened,
  // or the selection changed — before the confirm request resolves, that stale
  // response can't overwrite state for a session it no longer belongs to.
  const sessionRef = useRef({ cancelled: false });

  // Ask the server what would happen. The rules live there, not here.
  useEffect(() => {
    const session = { cancelled: false };
    sessionRef.current = session;
    // A new session means any confirm in flight for the old one is now superseded
    // and will no-op on resolution (see handleConfirm) — so `busy` must not be left
    // stuck on from that old session either.
    setBusy(false);

    if (!open) {
      setPreview(null);
      setError(null);
      return;
    }

    setPreview(null);
    setError(null);

    post(endpoint, ids, true)
      .then((result) => {
        if (!session.cancelled) setPreview(result);
      })
      .catch((err: Error) => {
        if (!session.cancelled) setError(err.message);
      });

    return () => {
      session.cancelled = true;
    };
    // `ids` is recomputed inline by callers on every render, so its array identity
    // changes even when the actual selection hasn't. Depending on `ids.join(",")`
    // instead is the stable identity that reflects the real selection, and avoids
    // restarting the dry run (and flashing the previous preview) on every
    // unrelated parent re-render while the dialog is open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, endpoint, ids.join(",")]);

  async function handleConfirm() {
    const session = sessionRef.current;
    setBusy(true);
    setError(null);
    try {
      const result = await post(endpoint, ids, false);
      if (session.cancelled) return; // superseded — dialog has moved on to a different session
      onDeleted(result);
    } catch (err) {
      if (!session.cancelled) setError((err as Error).message);
    } finally {
      if (!session.cancelled) setBusy(false);
    }
  }

  const deletable = preview?.deleted ?? 0;
  const target = deletable === 1 ? noun : nounPlural;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Ignore every dismiss path — Escape, overlay click, the dialog's own close
        // button — while a delete is in flight, not just the Cancel button.
        if (busy) return;
        if (!next) onCancel();
      }}
    >
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
