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
  /**
   * Builds the confirm title from the eligible count learned from the dry
   * run, e.g. `(n) => `Mark ${n} invoices as paid?``. A single
   * `verb + count + noun` template can't serve every action's grammar
   * ("Send reminders for 3 invoices?" vs "Delete 3 invoices?"), so each
   * action supplies its own. Defaults to the delete phrasing, so callers
   * that don't pass this keep today's exact wording.
   */
  titleFor?: (count: number) => string;
  /**
   * Label for the confirm button, e.g. "Mark as paid". The eligible count is
   * intentionally not appended when this is given — it already appears in
   * the title, and "Mark as paid 3" reads worse than "Mark as paid". Defaults
   * to "Delete N", matching today's behaviour.
   */
  confirmLabel?: string;
  /** Set false for non-destructive actions to drop the "cannot be undone" line. */
  destructive?: boolean;
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
  titleFor,
  confirmLabel,
  destructive,
  onCancel,
  onDeleted,
}: Props) {
  const isDestructive = destructive !== false;
  // Whether a caller has opted into custom copy at all. Callers that pass
  // neither prop (clients, estimates, expenses) get today's exact delete
  // wording throughout, including the "checking"/"nothing eligible" states.
  const isCustom = titleFor !== undefined || confirmLabel !== undefined;
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

  // Named `eligible`, not `deletable` — this dialog now also gates mark-paid,
  // duplicate and reminders, where "deletable" is a non-sequitur. `succeeded` is
  // the field that says what it means; `deleted` is its compatibility alias.
  const eligible = preview?.succeeded ?? preview?.deleted ?? 0;
  const resolvedTitleFor = titleFor ?? ((n: number) => `Delete ${n} ${n === 1 ? noun : nounPlural}?`);

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
              : eligible === 0
                ? isCustom
                  ? "Nothing eligible"
                  : "Nothing can be deleted"
                : resolvedTitleFor(eligible)}
          </DialogTitle>
          <DialogDescription>
            {preview === null
              ? isCustom
                ? "Working out what's eligible."
                : "Working out what can be deleted."
              : eligible === 0
                ? isCustom
                  ? "None of what you selected is eligible."
                  : "None of what you selected can be deleted."
                : isDestructive
                  ? "This cannot be undone."
                  : undefined}
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
            variant={isDestructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={busy || preview === null || eligible === 0}
          >
            {busy
              ? confirmLabel
                ? `${confirmLabel}…`
                : "Deleting…"
              : confirmLabel ?? `Delete ${eligible > 0 ? eligible : ""}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
