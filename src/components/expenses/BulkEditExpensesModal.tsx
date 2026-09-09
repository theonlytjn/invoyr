"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { EXPENSE_CATEGORIES } from "./expense-config";
import type { BulkActionResult } from "@/lib/bulk-actions";
import type { Client } from "@/lib/supabase/types";

const UNCHANGED = "__unchanged__";
const CLEAR = "__clear__";

/** Bounded, per the route's request timeout note in BulkDeleteDialog: dismissal is
 *  blocked while busy, so a hung request must not trap the user in the modal. */
const DRY_RUN_TIMEOUT_MS = 20_000;
const CONFIRM_TIMEOUT_MS = 60_000;

interface Props {
  open: boolean;
  ids: string[];
  clients: Pick<Client, "id" | "name" | "company_name">[];
  onCancel: () => void;
  onSaved: (result: BulkActionResult) => void;
}

export default function BulkEditExpensesModal({ open, ids, clients, onCancel, onSaved }: Props) {
  const [category, setCategory] = useState(UNCHANGED);
  const [clientId, setClientId] = useState(UNCHANGED);
  const [billable, setBillable] = useState(UNCHANGED);
  const [preview, setPreview] = useState<BulkActionResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionRef = useRef({ cancelled: false });

  const hasChange = category !== UNCHANGED || clientId !== UNCHANGED || billable !== UNCHANGED;

  // Only fields the user actually set are sent. `client_id: null` clears the link;
  // omitting the key leaves it untouched. See the route's tri-state note.
  function buildPatch() {
    const patch: Record<string, unknown> = {};
    if (category !== UNCHANGED) patch.category = category;
    if (clientId !== UNCHANGED) patch.client_id = clientId === CLEAR ? null : clientId;
    if (billable !== UNCHANGED) patch.is_billable = billable === "yes";
    return patch;
  }

  async function post(dryRun: boolean, timeoutMs: number): Promise<BulkActionResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch("/api/expenses/bulk/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // A dry run sends only the ids — the route's at-least-one-field rule exempts it.
        body: JSON.stringify({ ids, dryRun, ...(dryRun ? {} : buildPatch()) }),
        signal: controller.signal,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Something went wrong. Please try again.");
      return json as BulkActionResult;
    } catch (err) {
      if (controller.signal.aborted) {
        throw new Error(
          dryRun
            ? "This is taking too long. Close this and try again."
            : "This is taking too long. Close this and check the list before retrying — some records may already have been processed."
        );
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  useEffect(() => {
    sessionRef.current.cancelled = true;
    const session = { cancelled: false };
    sessionRef.current = session;
    setBusy(false);

    if (!open) {
      setPreview(null);
      setError(null);
      return;
    }

    setPreview(null);
    setError(null);

    post(true, DRY_RUN_TIMEOUT_MS)
      .then((r) => { if (!session.cancelled) setPreview(r); })
      .catch((e: Error) => { if (!session.cancelled) setError(e.message); });

    return () => { session.cancelled = true; };
    // `ids` is a fresh array reference on every parent render; keying on the joined
    // string instead is the stable identity that reflects the real selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ids.join(",")]);

  async function handleSave() {
    const session = sessionRef.current;
    setBusy(true);
    setError(null);
    try {
      const result = await post(false, CONFIRM_TIMEOUT_MS);
      if (session.cancelled) return; // superseded — dialog has moved on to a different session
      onSaved(result);
    } catch (e) {
      if (!session.cancelled) setError((e as Error).message);
    } finally {
      if (!session.cancelled) setBusy(false);
    }
  }

  const eligible = preview?.succeeded ?? preview?.deleted ?? 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Ignore every dismiss path — Escape, overlay click, the dialog's own close
        // button — while a save is in flight, not just the Cancel button.
        if (busy) return;
        if (!next) onCancel();
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader aria-live="polite">
          <DialogTitle>
            {preview === null
              ? "Checking…"
              : eligible === 0
                ? "Nothing eligible"
                : `Edit ${eligible} expense${eligible === 1 ? "" : "s"}`}
          </DialogTitle>
          <DialogDescription>
            {preview === null
              ? "Working out what's eligible."
              : eligible === 0
                ? "None of what you selected is eligible."
                : "Leave a field unchanged to keep its current value on every selected expense."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="bulk-edit-category">Category</Label>
            <select
              id="bulk-edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50"
            >
              <option value={UNCHANGED}>Leave unchanged</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-edit-client">Client</Label>
            <select
              id="bulk-edit-client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50"
            >
              <option value={UNCHANGED}>Leave unchanged</option>
              <option value={CLEAR}>No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name ?? c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bulk-edit-billable">Billable</Label>
            <select
              id="bulk-edit-billable"
              value={billable}
              onChange={(e) => setBillable(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50"
            >
              <option value={UNCHANGED}>Leave unchanged</option>
              <option value="yes">Billable</option>
              <option value="no">Not billable</option>
            </select>
          </div>

          {preview !== null && preview.reasons.length > 0 && (
            <ul className="space-y-1.5 text-sm text-neutral-600 dark:text-neutral-400">
              {preview.reasons.map((s) => <li key={s.reason}>{s.reason}.</li>)}
            </ul>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button onClick={handleSave} disabled={busy || preview === null || eligible === 0 || !hasChange}>
            {busy ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
