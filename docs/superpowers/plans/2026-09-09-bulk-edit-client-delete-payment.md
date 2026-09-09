# Bulk Edit, Client Deletion and Payment Write-Off Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bulk editing to the expenses list, make clients genuinely deletable without destroying their paperwork, and let a part payment write off its remainder as a credit note — all server-enforced.

**Architecture:** Three independent features sharing the machinery already on `feat/bulk-actions`: pure eligibility functions in `src/lib/bulk-actions.ts`, the `bulkIdsSchema` request contract, and the dry-run-then-apply pattern. Client deletion becomes safe by snapshotting billing details onto invoices and estimates before the row goes. The payment path moves off the browser and onto a validated route.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind, Supabase (`@supabase/ssr`), Zod, Radix Dialog, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-09-bulk-edit-client-delete-payment-design.md`. Read it before starting.
- Branch: `feat/bulk-edit-client-delete`. Already checked out. Do not create branches or switch away.
- Every route validates input with Zod, scopes every query by `org_id`, and uses `bulkIdsSchema()` from `src/lib/bulk-request.ts` for id arrays (it dedupes and caps at `MAX_BULK_IDS`).
- Eligibility is decided **server-side only**, in pure functions in `src/lib/bulk-actions.ts`. That module has **zero imports** and no I/O — keep it that way.
- Every mutation writes an `audit_logs` row. Capture the insert's error and `console.error` it with the action and ids, but **do not fail the request** — the records are already changed.
- Secondary lookups that establish eligibility must **fail closed**: capture `.error` and return 500 rather than treating a null result as "nothing found".
- Balance is always `outstandingBalance()` from `src/lib/bulk-actions.ts` — `total + late_fee_amount − amount_paid − credit_applied`. Never recompute it inline; two drifting copies of this was the critical bug on the previous branch.
- Skip-reason strings are user-facing copy. Pin every one with a test asserting the exact string, in **both** singular and plural. This gap has been missed twice.
- All new UI is responsive, accessible and dark-mode aware, with loading, empty, success and error states.
- No hardcoded brand colours — use the neutral Tailwind scale the surrounding components use.
- **There is no migration pipeline.** Schema changes must be applied to the live database by hand *and* written into `supabase/schema.sql`. Drift here has broken this project twice.

## File Structure

**Create:**
- `src/lib/client-snapshot.ts` — the snapshot shape and `resolveDocumentClient`
- `src/lib/client-snapshot.test.ts`
- `src/app/api/expenses/bulk/update/route.ts`
- `src/app/api/invoices/[id]/record-payment/route.ts`
- `src/lib/credit-notes.ts` — credit-note creation extracted for reuse
- `src/components/expenses/BulkEditExpensesModal.tsx`

**Modify:**
- `src/lib/bulk-actions.ts` — `partitionExpenseEdit`, `ClientRow` gains linked counts
- `src/lib/bulk-actions.test.ts`
- `src/app/api/clients/bulk/delete/route.ts` — snapshot before delete
- `src/app/api/invoices/[id]/credit-notes/route.ts` — call the extracted helper
- `src/lib/invoice-pdf.ts` — resolve client via the helper
- `src/app/(app)/invoices/[id]/page.tsx` — same
- `src/components/expenses/ExpensesList.tsx` — Edit action
- `src/components/clients/ClientsTable.tsx` — warning copy
- `src/components/invoices/RecordPaymentModal.tsx` — thin form + write-off checkbox
- `supabase/schema.sql` — `client_snapshot` columns
- `docs/development-status.md`, `docs/INV-001-current-state-audit.md`

---

### Task 1: Expense edit eligibility

**Files:**
- Modify: `src/lib/bulk-actions.ts`
- Test: `src/lib/bulk-actions.test.ts`

**Interfaces:**
- Consumes: `Partition`, `SkipReason`, the private `skip()` helper — all already in the file.
- Produces: `ExpenseEditRow`, `partitionExpenseEdit`. Task 2's route uses them.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/bulk-actions.test.ts`:

```ts
import { partitionExpenseEdit } from "./bulk-actions";

describe("partitionExpenseEdit", () => {
  it("accepts expenses that have not been billed", () => {
    const rows = [
      { id: "a", title: "Train", invoice_id: null },
      { id: "b", title: "Hotel", invoice_id: null },
    ];
    const result = partitionExpenseEdit(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result.skips).toEqual([]);
  });

  it("uses singular wording for one billed expense", () => {
    const rows = [
      { id: "a", title: "Train", invoice_id: null },
      { id: "b", title: "Hotel", invoice_id: "inv-1" },
    ];
    const result = partitionExpenseEdit(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a"]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 expense has been billed to an invoice" },
    ]);
  });

  it("uses plural wording for multiple billed expenses", () => {
    const rows = [
      { id: "a", title: "Hotel", invoice_id: "inv-1" },
      { id: "b", title: "Flight", invoice_id: "inv-2" },
    ];
    const result = partitionExpenseEdit(rows);
    expect(result.deletable).toEqual([]);
    expect(result.skips).toEqual([
      { count: 2, reason: "2 expenses have been billed to an invoice" },
    ]);
  });
});
```

Note the plural keeps "an invoice" singular — that is the existing copy in `partitionExpenses`, matched deliberately so the two actions read identically.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test src/lib/bulk-actions.test.ts`
Expected: FAIL — `partitionExpenseEdit is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `src/lib/bulk-actions.ts`:

```ts
export type ExpenseEditRow = {
  id: string;
  title: string;
  invoice_id: string | null;
};

/**
 * Bulk edit uses the same rule as bulk delete: an expense already billed onto an
 * invoice is left alone. Changing its client or billable flag would contradict the
 * invoice it was billed to, and one rule per record type keeps the product
 * explainable — the user sees the same sentence whichever action they tried.
 */
export function partitionExpenseEdit(rows: ExpenseEditRow[]): Partition<ExpenseEditRow> {
  const deletable = rows.filter((r) => r.invoice_id === null);
  const billed = rows.length - deletable.length;

  return {
    deletable,
    skips: skip(
      billed,
      "expense has been billed to an invoice",
      "expenses have been billed to an invoice"
    ),
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — 57 tests (54 existing + 3 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/bulk-actions.ts src/lib/bulk-actions.test.ts
git commit -m "feat: add expense bulk-edit eligibility rule"
```

---

### Task 2: Expense bulk update route

**Files:**
- Create: `src/app/api/expenses/bulk/update/route.ts`
- Reference: `src/app/api/expenses/bulk/delete/route.ts` (the pattern to follow)

**Interfaces:**
- Consumes: `partitionExpenseEdit`, `summarise` from `@/lib/bulk-actions`; `bulkIdsSchema` from `@/lib/bulk-request`.
- Produces: `POST /api/expenses/bulk/update` accepting `{ ids, dryRun?, category?, client_id?, is_billable? }`, returning `{ succeeded, deleted, skipped, reasons }`.

**Tri-state semantics, which the whole feature rests on:** a field **absent** from the body means *leave unchanged*; `client_id: null` means *clear it*. Zod's `.optional()` distinguishes absent from null, so do not add a default — a default would collapse the two.

- [ ] **Step 1: Write the route**

Create `src/app/api/expenses/bulk/update/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { bulkIdsSchema } from "@/lib/bulk-request";
import { partitionExpenseEdit, summarise } from "@/lib/bulk-actions";

const schema = z
  .object({
    ids: bulkIdsSchema(),
    dryRun: z.boolean().optional().default(false),
    // Absent = leave unchanged. No .default() anywhere here: a default would
    // erase the difference between "not sent" and "sent as null".
    category: z
      .enum(["travel", "software", "office", "meals", "marketing", "professional", "equipment", "other"])
      .optional(),
    client_id: z.string().uuid().nullable().optional(),
    is_billable: z.boolean().optional(),
  })
  .refine(
    // A dry run is asking "what would be eligible?", which needs only the ids — so the
    // at-least-one-field rule applies to real writes only. Requiring a field on dry runs
    // would force the client to invent a placeholder value it never intends to save.
    (v) => v.dryRun || v.category !== undefined || v.client_id !== undefined || v.is_billable !== undefined,
    { message: "Choose at least one field to change" }
  );

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }

  const { ids, dryRun, category, client_id, is_billable } = parsed.data;

  // A client id from the body must belong to this org, or a caller could link
  // their expenses to another organisation's client.
  if (client_id) {
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id")
      .eq("id", client_id)
      .eq("org_id", org.id)
      .maybeSingle();

    if (clientError) return NextResponse.json({ error: clientError.message }, { status: 500 });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 400 });
  }

  const { data: expenses, error: fetchError } = await supabase
    .from("expenses")
    .select("id, title, invoice_id")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const partition = partitionExpenseEdit(expenses ?? []);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const updateIds = partition.deletable.map((e) => e.id);
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (category !== undefined) patch.category = category;
  if (client_id !== undefined) patch.client_id = client_id;
  if (is_billable !== undefined) patch.is_billable = is_billable;

  const { error: updateError } = await supabase
    .from("expenses")
    .update(patch)
    .in("id", updateIds)
    .eq("org_id", org.id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const { error: auditError } = await supabase.from("audit_logs").insert(
    partition.deletable.map((exp) => ({
      org_id: org.id,
      user_id: user.id,
      action: "expense.updated",
      entity_type: "expense",
      entity_id: exp.id,
      meta: { title: exp.title, changed: Object.keys(patch).filter((k) => k !== "updated_at"), bulk: true },
    }))
  );

  if (auditError) {
    console.error("[bulk] audit log write failed", {
      action: "expense.updated",
      ids: updateIds,
      error: auditError.message,
    });
  }

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds, `/api/expenses/bulk/update` in the route list.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/expenses/bulk/update/route.ts
git commit -m "feat: add expenses bulk update route"
```

---

### Task 3: Bulk edit modal and the expenses list action

**Files:**
- Create: `src/components/expenses/BulkEditExpensesModal.tsx`
- Modify: `src/components/expenses/ExpensesList.tsx`

**Interfaces:**
- Consumes: `POST /api/expenses/bulk/update`; `BulkActionResult` from `@/lib/bulk-actions`; `EXPENSE_CATEGORIES` from `./expense-config`.
- Produces: `BulkEditExpensesModal({ open, ids, clients, onCancel, onSaved })`.

- [ ] **Step 1: Create the modal**

Create `src/components/expenses/BulkEditExpensesModal.tsx`. It mirrors `BulkDeleteDialog`'s lifecycle — dry run on open, confirm applies — but renders a form. Read `src/components/ui/BulkDeleteDialog.tsx` first and reuse its structure: the `sessionRef` generation guard, the `ids.join(",")` effect key, the `AbortController` timeout, and blocking dismissal while busy. Those exist because each was a real bug.

```tsx
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

interface Props {
  open: boolean;
  ids: string[];
  clients: Client[];
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

  async function post(dryRun: boolean, signal?: AbortSignal): Promise<BulkActionResult> {
    const res = await fetch("/api/expenses/bulk/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // A dry run sends only the ids — the route's at-least-one-field rule exempts it.
      body: JSON.stringify({ ids, dryRun, ...(dryRun ? {} : buildPatch()) }),
      signal,
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Something went wrong. Please try again.");
    return json as BulkActionResult;
  }

  useEffect(() => {
    sessionRef.current.cancelled = true;
    const session = { cancelled: false };
    sessionRef.current = session;

    if (!open) {
      setPreview(null);
      setError(null);
      setBusy(false);
      return;
    }

    setPreview(null);
    setError(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    // The dry run only needs the id set — the route's refine() requires at least one
    // field, so a placeholder category is sent. It mutates nothing on a dry run.
    post(true, controller.signal)
      .then((r) => { if (!session.cancelled) setPreview(r); })
      .catch((e: Error) => { if (!session.cancelled) setError(e.message); })
      .finally(() => clearTimeout(timeout));

    return () => { session.cancelled = true; controller.abort(); };
  }, [open, ids.join(",")]);

  async function handleSave() {
    const session = sessionRef.current;
    setBusy(true);
    setError(null);
    try {
      const result = await post(false);
      if (!session.cancelled) onSaved(result);
    } catch (e) {
      if (!session.cancelled) setError((e as Error).message);
    } finally {
      if (!session.cancelled) setBusy(false);
    }
  }

  const eligible = preview?.succeeded ?? preview?.deleted ?? 0;

  return (
    <Dialog open={open} onOpenChange={(next) => { if (busy) return; if (!next) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader aria-live="polite">
          <DialogTitle>
            {preview === null ? "Checking…" : `Edit ${eligible} expense${eligible === 1 ? "" : "s"}`}
          </DialogTitle>
          <DialogDescription>
            Leave a field unchanged to keep its current value on every selected expense.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <select
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
            <Label>Client</Label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-950 dark:text-neutral-50"
            >
              <option value={UNCHANGED}>Leave unchanged</option>
              <option value={CLEAR}>No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Billable</Label>
            <select
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
```

- [ ] **Step 2: Wire it into the expenses list**

In `src/components/expenses/ExpensesList.tsx`:

Add `const [bulkEditOpen, setBulkEditOpen] = useState(false);` beside the existing `bulkDeleteOpen`.

Add an Edit button to the bulk bar, before Delete, matching the neighbouring button classes:

```tsx
<button
  onClick={() => setBulkEditOpen(true)}
  className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
>
  Edit
</button>
```

Mount the modal beside the delete dialog. This list owns its rows in local state, so it refreshes with `fetchExpenses()`, not `router.refresh()`:

```tsx
<BulkEditExpensesModal
  open={bulkEditOpen}
  ids={selectedIds}
  clients={clients}
  onCancel={() => setBulkEditOpen(false)}
  onSaved={async (result) => {
    setBulkEditOpen(false);
    selection.clear();
    await fetchExpenses();
    const n = result.succeeded ?? result.deleted;
    showToast(
      `Updated ${n} expense${n !== 1 ? "s" : ""}` +
        (result.skipped > 0 ? `, ${result.skipped} skipped` : "") + "."
    );
  }}
/>
```

`clients` is already a prop of `ExpensesList` — check its exact name before using it.

- [ ] **Step 3: Verify**

Run: `npm run build` and `npm test`.
Expected: build clean, 57 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/expenses/BulkEditExpensesModal.tsx src/components/expenses/ExpensesList.tsx
git commit -m "feat: add bulk edit to the expenses list"
```

---

### Task 4: Client snapshot schema and resolver

**Files:**
- Create: `src/lib/client-snapshot.ts`
- Test: `src/lib/client-snapshot.test.ts`
- Modify: `supabase/schema.sql`

**Interfaces:**
- Produces: `ClientSnapshot`, `buildClientSnapshot(client)`, `resolveDocumentClient(record)`. Tasks 5 and 6 use them.

- [ ] **Step 1: Apply the schema change to the live database**

This project has **no migration pipeline**. Apply by hand to the live database *and* edit `schema.sql`, or the next fresh environment silently lacks the columns:

```sql
alter table public.invoices  add column if not exists client_snapshot jsonb;
alter table public.estimates add column if not exists client_snapshot jsonb;
```

Add the same two lines to `supabase/schema.sql` near the other `alter table ... add column if not exists` statements, with a comment explaining they preserve billing details when a client is deleted.

- [ ] **Step 2: Write the failing tests**

Create `src/lib/client-snapshot.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { buildClientSnapshot, resolveDocumentClient } from "./client-snapshot";

const client = {
  id: "c1",
  name: "Globex",
  company_name: "Globex Ltd",
  email: "ap@globex.test",
  phone: "0123",
  address_line1: "1 High St",
  address_line2: null,
  city: "London",
  postcode: "E1 6AN",
  country: "GB",
  vat_number: "GB123",
};

describe("buildClientSnapshot", () => {
  it("captures the fields documents render", () => {
    expect(buildClientSnapshot(client)).toEqual({
      name: "Globex",
      company_name: "Globex Ltd",
      email: "ap@globex.test",
      phone: "0123",
      address_line1: "1 High St",
      address_line2: null,
      city: "London",
      postcode: "E1 6AN",
      country: "GB",
      vat_number: "GB123",
    });
  });

  it("does not capture the client id, which would be a dangling reference", () => {
    expect(buildClientSnapshot(client)).not.toHaveProperty("id");
  });
});

describe("resolveDocumentClient", () => {
  it("prefers the live client when the link still exists", () => {
    const resolved = resolveDocumentClient({
      clients: client,
      client_snapshot: { name: "Stale Name" },
    });
    expect(resolved?.name).toBe("Globex");
  });

  it("falls back to the snapshot when the client was deleted", () => {
    const resolved = resolveDocumentClient({
      clients: null,
      client_snapshot: buildClientSnapshot(client),
    });
    expect(resolved?.name).toBe("Globex");
    expect(resolved?.vat_number).toBe("GB123");
  });

  it("returns null when there is neither a client nor a snapshot", () => {
    expect(resolveDocumentClient({ clients: null, client_snapshot: null })).toBeNull();
  });

  it("unwraps a joined client returned as an array", () => {
    const resolved = resolveDocumentClient({ clients: [client], client_snapshot: null });
    expect(resolved?.name).toBe("Globex");
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test src/lib/client-snapshot.test.ts`
Expected: FAIL — `Failed to resolve import "./client-snapshot"`.

- [ ] **Step 4: Write the implementation**

Create `src/lib/client-snapshot.ts`:

```ts
/**
 * Invoices and estimates render the client's billing details from a live join.
 * Deleting a client would therefore strip those details from every historical
 * document, including paid invoices. Before a client is deleted we copy the
 * fields documents render onto each of their documents, and rendering falls back
 * to that copy when the link is gone.
 *
 * Pure — no imports, no I/O — so the fallback logic is testable without a database.
 */

export type ClientSnapshot = {
  name: string;
  company_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  postcode: string | null;
  country: string | null;
  vat_number: string | null;
};

type ClientLike = Partial<ClientSnapshot> & { name?: string | null };

export function buildClientSnapshot(client: ClientLike): ClientSnapshot {
  // Deliberately excludes `id`: the row it points at is about to stop existing.
  return {
    name: client.name ?? "",
    company_name: client.company_name ?? null,
    email: client.email ?? null,
    phone: client.phone ?? null,
    address_line1: client.address_line1 ?? null,
    address_line2: client.address_line2 ?? null,
    city: client.city ?? null,
    postcode: client.postcode ?? null,
    country: client.country ?? null,
    vat_number: client.vat_number ?? null,
  };
}

export function resolveDocumentClient(record: {
  clients?: ClientLike | ClientLike[] | null;
  client_snapshot?: unknown;
}): ClientSnapshot | null {
  const joined = Array.isArray(record.clients) ? (record.clients[0] ?? null) : (record.clients ?? null);
  if (joined) return buildClientSnapshot(joined);

  const snapshot = record.client_snapshot;
  if (snapshot && typeof snapshot === "object") {
    return buildClientSnapshot(snapshot as ClientLike);
  }

  return null;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — 63 tests (57 + 6 new).

- [ ] **Step 6: Commit**

```bash
git add src/lib/client-snapshot.ts src/lib/client-snapshot.test.ts supabase/schema.sql
git commit -m "feat: add client snapshot helper and columns"
```

---

### Task 5: Render documents from the snapshot

Without this task the snapshot is written but never read, so deleting a client still blanks the paperwork. It must land before Task 6 enables deletion.

**Files:**
- Modify: `src/lib/invoice-pdf.ts`
- Modify: `src/app/(app)/invoices/[id]/page.tsx`

**Interfaces:**
- Consumes: `resolveDocumentClient` from `@/lib/client-snapshot`.

- [ ] **Step 1: Audit the call sites**

Before editing, find everywhere an invoice's or estimate's client details are rendered:

```bash
grep -rn "clients(\*)\|clients?\.\(name\|address\|vat\)" src/app src/components src/lib | grep -v node_modules
```

List what you find in your report. The two files named above are the known ones; if the search turns up others that render billing details (the public pay page, the client portal, estimate PDFs), report them rather than silently expanding scope.

- [ ] **Step 2: Use the resolver in the PDF renderer**

In `src/lib/invoice-pdf.ts`, the invoice fetch's `.select()` must include `client_snapshot`, and the client resolution replaces the current array-unwrap with:

```ts
import { resolveDocumentClient } from "@/lib/client-snapshot";

const client = resolveDocumentClient(invoice);
```

The PDF templates take a `Client` shape. `ClientSnapshot` has every field they render except `id`; check what the templates actually use and adapt at the call site rather than changing the templates.

- [ ] **Step 3: Use the resolver on the invoice detail page**

Same change: add `client_snapshot` to the select, resolve through the helper. A deleted client's invoice should still show the billing block, not an empty space.

- [ ] **Step 4: Verify**

Run: `npm run build` and `npm test`.
Expected: build clean, 63 tests pass.

Then verify by hand — this is the part a build cannot check. Note it for the human: an invoice whose client still exists must render **identically** to before this change.

- [ ] **Step 5: Commit**

```bash
git add src/lib/invoice-pdf.ts "src/app/(app)/invoices/[id]/page.tsx"
git commit -m "feat: render invoice client from snapshot when the client is gone"
```

---

### Task 6: Client deletion with snapshot

**Files:**
- Modify: `src/lib/bulk-actions.ts`, `src/lib/bulk-actions.test.ts`
- Modify: `src/app/api/clients/bulk/delete/route.ts`
- Modify: `src/components/clients/ClientsTable.tsx`

**Interfaces:**
- Consumes: `buildClientSnapshot` from `@/lib/client-snapshot`.
- Produces: `ClientRow` gains `linkedInvoices`/`linkedEstimates`; `partitionClients` no longer skips linked clients.

- [ ] **Step 1: Write the failing tests**

`partitionClients` currently skips clients with linked records. It must now accept them. Replace its existing tests (this is the one place in this plan where existing tests change, because the behaviour deliberately reverses) and add:

```ts
describe("partitionClients", () => {
  it("deletes clients with no linked records", () => {
    const rows = [{ id: "a", name: "Acme", linkedInvoices: 0, linkedEstimates: 0 }];
    const result = partitionClients(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a"]);
    expect(result.skips).toEqual([]);
  });

  it("also deletes clients that have linked records, since their details are snapshotted", () => {
    const rows = [
      { id: "a", name: "Acme", linkedInvoices: 0, linkedEstimates: 0 },
      { id: "b", name: "Globex", linkedInvoices: 12, linkedEstimates: 3 },
    ];
    const result = partitionClients(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result.skips).toEqual([]);
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test src/lib/bulk-actions.test.ts`
Expected: FAIL — the linked client is still being skipped.

- [ ] **Step 3: Update the implementation**

Change `ClientRow` to carry counts instead of a boolean, and make `partitionClients` return everything as deletable:

```ts
export type ClientRow = {
  id: string;
  name: string;
  linkedInvoices: number;
  linkedEstimates: number;
};

/**
 * Clients are now deletable even when documents reference them: the delete route
 * snapshots their billing details onto those documents first, so the paperwork
 * survives. The counts travel back to the UI so the confirmation can state what
 * will be detached rather than warning in the abstract.
 */
export function partitionClients(rows: ClientRow[]): Partition<ClientRow> {
  return { deletable: rows, skips: [] };
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Update the delete route**

In `src/app/api/clients/bulk/delete/route.ts`:

- Select the full client rows, not just `id, name` — `buildClientSnapshot` needs the address and VAT fields.
- Keep the existing linkage queries and their **fail-closed** error checks; use them to build the counts for `ClientRow`.
- Return the counts in the dry-run response so the dialog can warn. Add them under a new `clients` key alongside the existing result fields; do not overload `reasons`, which is for skips.
- Before deleting, for each client being deleted, write `client_snapshot` onto their invoices and estimates:

```ts
for (const client of partition.deletable) {
  const snapshot = buildClientSnapshot(fullClientsById.get(client.id)!);

  const [invSnap, estSnap] = await Promise.all([
    supabase.from("invoices").update({ client_snapshot: snapshot })
      .eq("client_id", client.id).eq("org_id", org.id),
    supabase.from("estimates").update({ client_snapshot: snapshot })
      .eq("client_id", client.id).eq("org_id", org.id),
  ]);

  // Fail closed. Deleting after a failed snapshot is exactly the data loss this
  // whole design exists to prevent.
  for (const { error } of [invSnap, estSnap]) {
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

Then delete as now. Keep the audit rows, adding the linked counts to `meta`.

- [ ] **Step 6: Update the confirmation copy**

In `src/components/clients/ClientsTable.tsx`, pass a `titleFor` and use the counts from the dry run so the dialog says what actually happens. For a client with documents:

> **Delete Globex?**
> Globex has 12 invoices and 3 estimates. Their billing details will be kept on those documents, but they will no longer be linked to a client record. This cannot be undone.

For a client with none, the plain wording. Both statements are true and must both appear — do not soften "cannot be undone", and do not imply the documents are lost. Mention archive as the reversible alternative.

- [ ] **Step 7: Verify**

Run: `npm run build` and `npm test`.

- [ ] **Step 8: Commit**

```bash
git add src/lib/bulk-actions.ts src/lib/bulk-actions.test.ts src/app/api/clients/bulk/delete/route.ts src/components/clients/ClientsTable.tsx
git commit -m "feat: allow client deletion, preserving billing details on documents"
```

---

### Task 7: Extract credit-note creation

**Files:**
- Create: `src/lib/credit-notes.ts`
- Modify: `src/app/api/invoices/[id]/credit-notes/route.ts`

**Interfaces:**
- Produces: `createCreditNote({ supabase, org, invoice, amount, reason, userId })` returning `{ creditNote }` or `{ error }`. Task 8 uses it.

This exists so the two paths cannot drift. Two copies of a balance calculation drifting apart was the critical bug on the previous branch.

- [ ] **Step 1: Extract the logic**

Read `src/app/api/invoices/[id]/credit-notes/route.ts` in full. Move into `src/lib/credit-notes.ts` everything from the credit-note-number generation through the invoice `credit_applied`/status update and the audit row — but **not** the email send, which stays in the route (the new payment route does not send one).

Keep behaviour identical, including: numbering from `organisations.credit_note_prefix`/`next_credit_note_number`, incrementing `next_credit_note_number`, the `credit_applied` accumulation, the paid/partial status recompute with its `0.001` tolerance, and surfacing the real insert error.

- [ ] **Step 2: Make the existing route call it**

Rewrite the route to validate, resolve the invoice, call `createCreditNote`, then do its email send. Its observable behaviour must not change.

- [ ] **Step 3: Verify**

Run: `npm run build` and `npm test`.

Then note for the human: issuing a credit note from the invoice page must still work end to end, including the notify-by-email path. This is the regression risk in this task.

- [ ] **Step 4: Commit**

```bash
git add src/lib/credit-notes.ts "src/app/api/invoices/[id]/credit-notes/route.ts"
git commit -m "refactor: extract credit note creation for reuse"
```

---

### Task 8: Server-side record payment, with write-off

**Files:**
- Create: `src/app/api/invoices/[id]/record-payment/route.ts`
- Modify: `src/components/invoices/RecordPaymentModal.tsx`

**Interfaces:**
- Consumes: `outstandingBalance` from `@/lib/bulk-actions`; `createCreditNote` from `@/lib/credit-notes`.
- Produces: `POST /api/invoices/[id]/record-payment` accepting `{ amount, method, reference?, paidAt?, writeOffRemainder? }`.

**Why this route exists:** `CLAUDE.md` forbids marking invoices paid from the frontend, and `RecordPaymentModal` currently does exactly that — inserting the payment row and setting `status: 'paid'` from the browser. This closes that violation, which has been knowingly deferred twice.

- [ ] **Step 1: Write the route**

Create `src/app/api/invoices/[id]/record-payment/route.ts`. Structure:

1. Auth, `requireOrg()`, Zod.
2. Fetch the invoice org-scoped, selecting `total, amount_paid, late_fee_amount, credit_applied, currency, status`.
3. Reject a payment on a `draft` or `void` invoice with a clear message.
4. Compute the balance with `outstandingBalance(invoice)` — **never inline**. Reject an amount that exceeds it by more than `0.001`.
5. Insert the payment row with the invoice's own currency.
6. Recompute and write `amount_paid` (as `amount_paid + amount`), `status`, `paid_at` — server-side.
7. If `writeOffRemainder` and a balance remains after the payment, call `createCreditNote` for exactly that remainder, with reason `"Balance written off"`.
8. Audit row, capture-and-log the error, return 200 regardless.
9. Return `{ ok: true, creditNoteIssued: boolean, creditNoteNumber?: string }`.

Accepted methods are the **full** enum — `bank_transfer`, `stripe`, `cash`, `cheque`, `other` — matching what the modal offers today. This deliberately differs from the bulk mark-paid route, which excludes `stripe`; recording one payment is a considered action on a known invoice, and removing an option users have today would be a silent regression.

- [ ] **Step 2: Make the modal a thin form**

In `src/components/invoices/RecordPaymentModal.tsx`, replace the direct Supabase writes with a single `fetch` to the new route. Keep every existing field and the method list exactly as they are.

Add the write-off checkbox, rendered only when the entered amount is less than the outstanding balance:

```tsx
{remainder > 0 && (
  <label className="flex items-start gap-3 cursor-pointer">
    <input
      type="checkbox"
      checked={writeOff}
      onChange={(e) => setWriteOff(e.target.checked)}
      className="mt-0.5 rounded border-neutral-300 dark:border-neutral-600 accent-neutral-950 dark:accent-neutral-50"
    />
    <span className="text-sm text-neutral-700 dark:text-neutral-300">
      Write off the remaining {formatCurrency(remainder, invoice.currency)} as a credit note
    </span>
  </label>
)}
```

`remainder` recomputes as the amount changes, from the invoice's outstanding balance minus the entered amount. Import `outstandingBalance` rather than recomputing.

When ticked, the submit button reads "Record payment & write off". The success toast reports both parts.

- [ ] **Step 3: Verify**

Run: `npm run build` and `npm test`.

Note for the human — none of this is browser-verifiable here: record a full payment; record a part payment without write-off; record a part payment *with* write-off and confirm both the payment and a credit note appear and the balance reaches zero; confirm an invoice with a credit note already applied computes the remainder correctly.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/invoices/[id]/record-payment/route.ts" src/components/invoices/RecordPaymentModal.tsx
git commit -m "feat: record payments server-side, with optional write-off"
```

---

### Task 9: Documentation

**Files:**
- Modify: `docs/development-status.md`, `docs/INV-001-current-state-audit.md`

- [ ] **Step 1: Run the full suite and build**

Run: `npm test` and `npm run build`. Report the real numbers.

- [ ] **Step 2: Update the docs**

In `docs/development-status.md`, add an entry covering: bulk edit on expenses (category, client, billable; billed expenses skipped); client deletion now allowed with billing details snapshotted onto invoices and estimates; payments recorded server-side with an optional write-off, closing the `RecordPaymentModal` frontend violation.

In `docs/INV-001-current-state-audit.md` §11, note that client deletion supersedes the archive-only behaviour recorded there, and that the `RecordPaymentModal` known issue is now resolved.

Also record the schema change (`client_snapshot` on invoices and estimates) and that it was applied to the live database by hand, since there is no migration pipeline.

- [ ] **Step 3: Commit**

```bash
git add docs/development-status.md docs/INV-001-current-state-audit.md
git commit -m "docs: record bulk edit, client deletion and payment write-off"
```

---

## Self-review notes

Checked against the spec:

- Bulk edit on expenses, three tri-state fields, billed expenses skipped — Tasks 1–3.
- Dry run before applying, with skip reasons — Tasks 2 and 3.
- Client id validated against the org — Task 2.
- `client_snapshot` on invoices and estimates, applied by hand and to `schema.sql` — Task 4.
- `resolveDocumentClient` used by the PDF and detail page, with a call-site audit — Task 5.
- Snapshot written before deletion and failing closed — Task 6.
- `partitionClients` reversed, counts surfaced, honest confirmation copy — Task 6.
- Credit-note logic extracted rather than duplicated — Task 7.
- Server-side payment recording using `outstandingBalance`, closing the `CLAUDE.md` violation — Task 8.
- Both grammatical forms of every new skip string pinned — Task 1.
- Docs — Task 9.

One deviation from the spec, corrected in the spec itself: the record-payment route accepts the **full** method enum including `stripe`, because the modal offers it today and removing it would be a silent regression. The bulk mark-paid route still excludes it.

Task 5 must land before Task 6 — writing snapshots that nothing reads would leave deletion destructive.
