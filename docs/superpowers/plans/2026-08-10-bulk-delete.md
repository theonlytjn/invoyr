# Bulk Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add multi-select delete to the invoices, estimates, expenses and clients lists, then a set of bulk quick actions on invoices (mark as paid, send reminders, duplicate, download PDFs) — all with server-enforced rules that never destroy or falsify financial records.

**Structure:** Part 1 (Tasks 1–11) builds the shared selection machinery and delete. Part 2 (Tasks 12–17) adds the invoice quick actions on top of it. Part 1 ships on its own; Part 2 depends on its primitives.

**Architecture:** Eligibility lives in pure functions in `src/lib/bulk-actions.ts`, unit-tested with Vitest and called only by four `POST .../bulk/delete` API routes. Each route accepts a `dryRun` flag: the confirmation dialog asks the server what would happen, then asks it to do it, so the delete/skip rules exist in exactly one place. Three shared client pieces (`useRowSelection`, `BulkActionBar`, `BulkDeleteDialog`) are built once and consumed by all four lists.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind, Supabase (`@supabase/ssr`), Zod, Radix Dialog, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-31-bulk-delete-design.md`. Read it before starting.
- Every route validates input with Zod. Every query is scoped `.eq("org_id", org.id)`.
- Eligibility is decided **server-side only**. The client never re-implements a rule.
- No plan gate on delete: no `orgHasFeature` call in any of the four new routes.
- Hard delete. No `deleted_at` column, no trash view, no undo, no schema migration.
- Every deleted record writes an `audit_logs` row with `meta.bulk = true`.
- Batch cap is 50 ids per request, matching `src/app/api/invoices/bulk/void/route.ts`.
- No hardcoded brand colours — use the neutral Tailwind scale already used by the surrounding components.
- All new UI is responsive, dark-mode aware, and has loading/empty/success/error states.

## Refinement of the spec

The spec had the client compute preview counts from its own copy of the rules. This plan replaces that with a **dry-run request**: `BulkDeleteDialog` opens, calls the same route with `{ dryRun: true }`, and renders the counts the server returns. The rules are then written once, on the server. The confirm button repeats the call with `dryRun: false`. Everything else follows the spec as approved.

## File Structure

**Create:**
- `vitest.config.ts` — test runner config
- `src/lib/bulk-actions.ts` — pure eligibility partitioning, one function per resource
- `src/lib/bulk-actions.test.ts` — unit tests for the above
- `src/hooks/useRowSelection.ts` — selection state shared by all four lists
- `src/hooks/useRowSelection.test.ts` — unit tests for the above
- `src/components/ui/RowCheckbox.tsx` — the row/header checkbox
- `src/components/ui/BulkActionBar.tsx` — the dark "N selected" bar
- `src/components/ui/BulkDeleteDialog.tsx` — dry-run-driven confirmation dialog
- `src/app/api/invoices/bulk/delete/route.ts`
- `src/app/api/estimates/bulk/delete/route.ts`
- `src/app/api/expenses/bulk/delete/route.ts`
- `src/app/api/clients/bulk/delete/route.ts`
- `src/components/estimates/EstimatesTable.tsx` — extracted from the estimates page

**Modify:**
- `package.json` — add `vitest` devDependency and `test` script
- `src/components/ui/index.ts` — export the three new UI components
- `src/components/invoices/InvoicesTable.tsx` — use shared primitives, add Delete, ungate checkboxes
- `src/components/clients/ClientsTable.tsx` — add selection and Delete
- `src/components/expenses/ExpensesList.tsx` — add selection and Delete
- `src/app/(app)/estimates/page.tsx` — render `EstimatesTable` instead of an inline table
- `docs/INV-001-current-state-audit.md` — document the feature

---

### Task 1: Vitest and the eligibility rules

The riskiest logic in the feature, isolated as pure functions so it can be tested without a database.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/bulk-actions.ts`
- Test: `src/lib/bulk-actions.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `SkipReason`, `Partition<T>`, `InvoiceRow`, `EstimateRow`, `ExpenseRow`, `ClientRow`, `partitionInvoices`, `partitionEstimates`, `partitionExpenses`, `partitionClients`, `summarise`. Tasks 2–5 import these.

- [ ] **Step 1: Install Vitest**

```bash
npm install --save-dev vitest@^3
```

- [ ] **Step 2: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Add the Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

- [ ] **Step 4: Write the failing tests**

Create `src/lib/bulk-actions.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  partitionInvoices,
  partitionEstimates,
  partitionExpenses,
  partitionClients,
  summarise,
} from "./bulk-actions";

describe("partitionInvoices", () => {
  it("deletes drafts and voided invoices", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "draft", hasFinancialRecords: false },
      { id: "b", invoice_number: "INV-2", status: "void", hasFinancialRecords: false },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result.skips).toEqual([]);
  });

  it("skips issued, sent and paid invoices with a void-instead reason", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "draft", hasFinancialRecords: false },
      { id: "b", invoice_number: "INV-2", status: "issued", hasFinancialRecords: false },
      { id: "c", invoice_number: "INV-3", status: "sent", hasFinancialRecords: false },
      { id: "d", invoice_number: "INV-4", status: "paid", hasFinancialRecords: false },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a"]);
    expect(result.skips).toEqual([
      { count: 3, reason: "3 invoices have been sent — void them instead" },
    ]);
  });

  it("skips a voided invoice that still has payments or credit notes attached", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "void", hasFinancialRecords: true },
      { id: "b", invoice_number: "INV-2", status: "draft", hasFinancialRecords: false },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["b"]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 invoice has payments or credit notes attached" },
    ]);
  });

  it("reports both skip reasons separately", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "sent", hasFinancialRecords: false },
      { id: "b", invoice_number: "INV-2", status: "void", hasFinancialRecords: true },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable).toEqual([]);
    expect(result.skips).toHaveLength(2);
  });

  it("uses singular wording for one skipped invoice", () => {
    const rows = [{ id: "a", invoice_number: "INV-1", status: "sent", hasFinancialRecords: false }];
    expect(partitionInvoices(rows).skips).toEqual([
      { count: 1, reason: "1 invoice has been sent — void it instead" },
    ]);
  });
});

describe("partitionEstimates", () => {
  it("deletes estimates that were never converted", () => {
    const rows = [
      { id: "a", estimate_number: "EST-1", converted_invoice_id: null },
      { id: "b", estimate_number: "EST-2", converted_invoice_id: null },
    ];
    const result = partitionEstimates(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result.skips).toEqual([]);
  });

  it("skips converted estimates", () => {
    const rows = [
      { id: "a", estimate_number: "EST-1", converted_invoice_id: null },
      { id: "b", estimate_number: "EST-2", converted_invoice_id: "inv-1" },
    ];
    const result = partitionEstimates(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a"]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 estimate has been converted to an invoice" },
    ]);
  });
});

describe("partitionExpenses", () => {
  it("deletes expenses that have not been billed", () => {
    const rows = [{ id: "a", title: "Train", amount: 40, invoice_id: null }];
    expect(partitionExpenses(rows).deletable.map((r) => r.id)).toEqual(["a"]);
  });

  it("skips expenses already billed to an invoice", () => {
    const rows = [
      { id: "a", title: "Train", amount: 40, invoice_id: null },
      { id: "b", title: "Hotel", amount: 120, invoice_id: "inv-1" },
    ];
    const result = partitionExpenses(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a"]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 expense has been billed to an invoice" },
    ]);
  });
});

describe("partitionClients", () => {
  it("deletes clients with no linked records", () => {
    const rows = [{ id: "a", name: "Acme", hasLinkedRecords: false }];
    expect(partitionClients(rows).deletable.map((r) => r.id)).toEqual(["a"]);
  });

  it("skips clients with linked records and suggests archiving", () => {
    const rows = [
      { id: "a", name: "Acme", hasLinkedRecords: false },
      { id: "b", name: "Globex", hasLinkedRecords: true },
      { id: "c", name: "Initech", hasLinkedRecords: true },
    ];
    const result = partitionClients(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a"]);
    expect(result.skips).toEqual([
      { count: 2, reason: "2 clients have invoices or expenses — archive them instead" },
    ]);
  });
});

describe("summarise", () => {
  it("counts ids that never came back from the database as skipped", () => {
    const partition = { deletable: [{ id: "a" }], skips: [] };
    const result = summarise(partition, ["a", "b", "c"]);
    expect(result.deleted).toBe(1);
    expect(result.skipped).toBe(2);
    expect(result.reasons).toEqual([
      { count: 2, reason: "2 records could not be found" },
    ]);
  });

  it("merges rule-based skips with missing rows", () => {
    const partition = {
      deletable: [{ id: "a" }],
      skips: [{ count: 1, reason: "1 invoice has been sent — void it instead" }],
    };
    const result = summarise(partition, ["a", "b", "c"]);
    expect(result.deleted).toBe(1);
    expect(result.skipped).toBe(2);
    expect(result.reasons).toHaveLength(2);
  });
});
```

- [ ] **Step 5: Run the tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Failed to resolve import "./bulk-actions"`.

- [ ] **Step 6: Write the implementation**

Create `src/lib/bulk-actions.ts`:

```ts
/**
 * Eligibility rules for bulk delete. Pure functions — no database access — so the
 * rules that protect financial records can be tested in isolation.
 *
 * These are the only definition of the rules. The client never re-implements them;
 * it asks the API with `dryRun: true` instead.
 */

export type SkipReason = { count: number; reason: string };

export type Partition<T> = {
  deletable: T[];
  skips: SkipReason[];
};

export type InvoiceRow = {
  id: string;
  invoice_number: string;
  status: string;
  /** True when the invoice has payments, refunds or credit notes attached. */
  hasFinancialRecords: boolean;
};

export type EstimateRow = {
  id: string;
  estimate_number: string;
  converted_invoice_id: string | null;
};

export type ExpenseRow = {
  id: string;
  title: string;
  amount: number;
  invoice_id: string | null;
};

export type ClientRow = {
  id: string;
  name: string;
  /** True when the client is referenced by any invoice, estimate or expense. */
  hasLinkedRecords: boolean;
};

const DELETABLE_INVOICE_STATUSES = new Set(["draft", "void"]);

function skip(count: number, singular: string, plural: string): SkipReason[] {
  if (count === 0) return [];
  return [{ count, reason: count === 1 ? `1 ${singular}` : `${count} ${plural}` }];
}

export function partitionInvoices(rows: InvoiceRow[]): Partition<InvoiceRow> {
  const deletable: InvoiceRow[] = [];
  let wrongStatus = 0;
  let encumbered = 0;

  for (const row of rows) {
    if (!DELETABLE_INVOICE_STATUSES.has(row.status)) {
      wrongStatus++;
    } else if (row.hasFinancialRecords) {
      encumbered++;
    } else {
      deletable.push(row);
    }
  }

  return {
    deletable,
    skips: [
      ...skip(
        wrongStatus,
        "invoice has been sent — void it instead",
        "invoices have been sent — void them instead"
      ),
      ...skip(
        encumbered,
        "invoice has payments or credit notes attached",
        "invoices have payments or credit notes attached"
      ),
    ],
  };
}

export function partitionEstimates(rows: EstimateRow[]): Partition<EstimateRow> {
  const deletable = rows.filter((r) => r.converted_invoice_id === null);
  const converted = rows.length - deletable.length;

  return {
    deletable,
    skips: skip(
      converted,
      "estimate has been converted to an invoice",
      "estimates have been converted to invoices"
    ),
  };
}

export function partitionExpenses(rows: ExpenseRow[]): Partition<ExpenseRow> {
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

export function partitionClients(rows: ClientRow[]): Partition<ClientRow> {
  const deletable = rows.filter((r) => !r.hasLinkedRecords);
  const linked = rows.length - deletable.length;

  return {
    deletable,
    skips: skip(
      linked,
      "client has invoices or expenses — archive it instead",
      "clients have invoices or expenses — archive them instead"
    ),
  };
}

export type BulkActionResult = {
  deleted: number;
  skipped: number;
  reasons: SkipReason[];
};

/**
 * Turns a partition into the API response shape. Ids that never came back from the
 * database — because they belong to another org, or no longer exist — are counted
 * as skipped rather than silently dropped.
 */
export function summarise<T extends { id: string }>(
  partition: Partition<T>,
  requestedIds: string[]
): BulkActionResult {
  const seen = partition.deletable.length + partition.skips.reduce((n, s) => n + s.count, 0);
  const missing = requestedIds.length - seen;

  return {
    deleted: partition.deletable.length,
    skipped: requestedIds.length - partition.deletable.length,
    reasons: [
      ...partition.skips,
      ...skip(missing > 0 ? missing : 0, "record could not be found", "records could not be found"),
    ],
  };
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests in `src/lib/bulk-actions.test.ts`.

- [ ] **Step 8: Verify the build still compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/bulk-actions.ts src/lib/bulk-actions.test.ts
git commit -m "feat: add bulk delete eligibility rules with vitest"
```

---

### Task 2: Row selection hook

Lifts the selection state currently inlined in `InvoicesTable` so all four lists share one implementation.

**Files:**
- Create: `src/hooks/useRowSelection.ts`
- Test: `src/hooks/useRowSelection.test.ts`
- Modify: `vitest.config.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `useRowSelection()` returning `{ selected: Set<string>, count: number, isSelected(id), toggleOne(id), toggleAll(visibleIds), allSelected(visibleIds), clear() }`. Tasks 6–9 consume it.

- [ ] **Step 1: Add React testing support**

```bash
npm install --save-dev @testing-library/react@^16 jsdom@^26
```

Then change `test.environment` in `vitest.config.ts` from `"node"` to `"jsdom"`.

- [ ] **Step 2: Write the failing tests**

Create `src/hooks/useRowSelection.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRowSelection } from "./useRowSelection";

describe("useRowSelection", () => {
  it("starts empty", () => {
    const { result } = renderHook(() => useRowSelection());
    expect(result.current.count).toBe(0);
  });

  it("toggles a single id on and off", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggleOne("a"));
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.count).toBe(1);

    act(() => result.current.toggleOne("a"));
    expect(result.current.isSelected("a")).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it("selects every visible id when none are selected", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggleAll(["a", "b", "c"]));
    expect(result.current.count).toBe(3);
    expect(result.current.allSelected(["a", "b", "c"])).toBe(true);
  });

  it("deselects the visible ids when all of them are already selected", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggleAll(["a", "b"]));
    act(() => result.current.toggleAll(["a", "b"]));
    expect(result.current.count).toBe(0);
  });

  it("preserves selections made outside the visible set", () => {
    const { result } = renderHook(() => useRowSelection());

    // Selected before searching.
    act(() => result.current.toggleOne("hidden"));
    // Select-all while a search narrows the list to a and b.
    act(() => result.current.toggleAll(["a", "b"]));

    expect(result.current.count).toBe(3);
    expect(result.current.isSelected("hidden")).toBe(true);

    // Deselecting the visible ids must not clear the hidden one.
    act(() => result.current.toggleAll(["a", "b"]));
    expect(result.current.count).toBe(1);
    expect(result.current.isSelected("hidden")).toBe(true);
  });

  it("reports allSelected as false for an empty visible set", () => {
    const { result } = renderHook(() => useRowSelection());
    expect(result.current.allSelected([])).toBe(false);
  });

  it("clears everything", () => {
    const { result } = renderHook(() => useRowSelection());

    act(() => result.current.toggleAll(["a", "b"]));
    act(() => result.current.clear());
    expect(result.current.count).toBe(0);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm test src/hooks/useRowSelection.test.ts`
Expected: FAIL — `Failed to resolve import "./useRowSelection"`.

- [ ] **Step 4: Write the implementation**

Create `src/hooks/useRowSelection.ts`:

```ts
"use client";

import { useState, useCallback } from "react";

/**
 * Selection state for a list with checkboxes.
 *
 * `toggleAll` operates only on the ids currently visible, so selections made
 * before a search was typed survive selecting or clearing the filtered rows.
 */
export function useRowSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const allSelected = useCallback(
    (visibleIds: string[]) => visibleIds.length > 0 && visibleIds.every((id) => selected.has(id)),
    [selected]
  );

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((visibleIds: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const everyVisibleSelected =
        visibleIds.length > 0 && visibleIds.every((id) => prev.has(id));

      if (everyVisibleSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));

      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  return {
    selected,
    count: selected.size,
    isSelected,
    allSelected,
    toggleOne,
    toggleAll,
    clear,
  };
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS — both test files.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/hooks/useRowSelection.ts src/hooks/useRowSelection.test.ts
git commit -m "feat: add shared row selection hook"
```

---

### Task 3: Shared bulk UI components

**Files:**
- Create: `src/components/ui/RowCheckbox.tsx`
- Create: `src/components/ui/BulkActionBar.tsx`
- Create: `src/components/ui/BulkDeleteDialog.tsx`
- Modify: `src/components/ui/index.ts`

**Interfaces:**
- Consumes: `BulkActionResult`, `SkipReason` from `@/lib/bulk-actions` (Task 1).
- Produces: `RowCheckbox({ checked, onChange, label })`, `BulkActionBar({ count, onClear, children })`, `BulkDeleteDialog({ open, endpoint, ids, noun, nounPlural, onCancel, onDeleted })`. Tasks 6–9 consume them.

`BulkDeleteDialog` owns the whole delete interaction: on open it POSTs `{ ids, dryRun: true }` to `endpoint` to learn what would happen, renders that, and on confirm POSTs `{ ids, dryRun: false }`. Callers supply only the endpoint and the ids.

- [ ] **Step 1: Create the row checkbox**

Create `src/components/ui/RowCheckbox.tsx`:

```tsx
"use client";

interface Props {
  checked: boolean;
  onChange: () => void;
  /** Accessible label, e.g. "Select INV-0012" or "Select all". */
  label: string;
}

export function RowCheckbox({ checked, onChange, label }: Props) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="rounded border-neutral-300 dark:border-neutral-600 accent-neutral-950 dark:accent-neutral-50"
    />
  );
}
```

- [ ] **Step 2: Create the bulk action bar**

Create `src/components/ui/BulkActionBar.tsx`. This is the bar currently inlined at `src/components/invoices/InvoicesTable.tsx:134`, with the actions passed in as children:

```tsx
"use client";

import type { ReactNode } from "react";

interface Props {
  count: number;
  onClear: () => void;
  children: ReactNode;
}

export function BulkActionBar({ count, onClear, children }: Props) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 py-3 bg-neutral-950 dark:bg-neutral-800 text-white rounded-xl text-sm">
      <span className="font-medium mr-1">{count} selected</span>
      {children}
      <button
        onClick={onClear}
        className="ml-auto text-neutral-400 hover:text-white transition-colors text-xs"
      >
        Clear
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Create the delete dialog**

Create `src/components/ui/BulkDeleteDialog.tsx`:

```tsx
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
```

- [ ] **Step 4: Confirm the Button has a `destructive` variant**

Run: `grep -n "destructive" src/components/ui/button.tsx`
Expected: a `destructive` entry in `buttonVariants`. If it is missing, add one styled `bg-red-600 text-white hover:bg-red-700` alongside the existing variants rather than inventing a new component.

- [ ] **Step 5: Export the new components**

In `src/components/ui/index.ts`, add:

```ts
export * from './RowCheckbox';
export * from './BulkActionBar';
export * from './BulkDeleteDialog';
```

- [ ] **Step 6: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/RowCheckbox.tsx src/components/ui/BulkActionBar.tsx src/components/ui/BulkDeleteDialog.tsx src/components/ui/index.ts src/components/ui/button.tsx
git commit -m "feat: add shared bulk action bar, row checkbox and delete dialog"
```

---

### Task 4: Invoices bulk delete route

The most involved route: it checks three child tables and cleans up billed expenses before deleting.

**Files:**
- Create: `src/app/api/invoices/bulk/delete/route.ts`
- Reference: `src/app/api/invoices/bulk/void/route.ts` (the pattern to follow)

**Interfaces:**
- Consumes: `partitionInvoices`, `summarise`, `InvoiceRow` from `@/lib/bulk-actions`; `requireOrg` from `@/lib/auth`; `createClient` from `@/lib/supabase/server`.
- Produces: `POST /api/invoices/bulk/delete` accepting `{ ids: string[], dryRun?: boolean }` and returning `BulkActionResult`.

- [ ] **Step 1: Write the route**

Create `src/app/api/invoices/bulk/delete/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { partitionInvoices, summarise, type InvoiceRow } from "@/lib/bulk-actions";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun } = parsed.data;

  // Rows outside this org simply do not come back, and summarise() counts them as skipped.
  const { data: invoices, error: fetchError } = await supabase
    .from("invoices")
    .select("id, invoice_number, status")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const candidateIds = (invoices ?? []).map((i) => i.id);

  // A voided invoice can still carry payment history. Deleting it would cascade
  // through payments, refunds and credit_notes and destroy those records.
  const encumbered = new Set<string>();
  if (candidateIds.length > 0) {
    const [payments, refunds, creditNotes] = await Promise.all([
      supabase.from("payments").select("invoice_id").in("invoice_id", candidateIds),
      supabase.from("refunds").select("invoice_id").in("invoice_id", candidateIds),
      supabase.from("credit_notes").select("invoice_id").in("invoice_id", candidateIds),
    ]);
    for (const set of [payments.data, refunds.data, creditNotes.data]) {
      for (const row of set ?? []) encumbered.add(row.invoice_id as string);
    }
  }

  const rows: InvoiceRow[] = (invoices ?? []).map((i) => ({
    id: i.id,
    invoice_number: i.invoice_number,
    status: i.status,
    hasFinancialRecords: encumbered.has(i.id),
  }));

  const partition = partitionInvoices(rows);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const deleteIds = partition.deletable.map((i) => i.id);

  // expenses.invoice_id is ON DELETE SET NULL, so without this an expense billed to a
  // deleted invoice would keep invoiced_at set while pointing at nothing.
  const { error: expenseError } = await supabase
    .from("expenses")
    .update({ invoice_id: null, invoiced_at: null })
    .in("invoice_id", deleteIds)
    .eq("org_id", org.id);

  if (expenseError) return NextResponse.json({ error: expenseError.message }, { status: 500 });

  const { error: deleteError } = await supabase
    .from("invoices")
    .delete()
    .in("id", deleteIds)
    .eq("org_id", org.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  await supabase.from("audit_logs").insert(
    partition.deletable.map((inv) => ({
      org_id: org.id,
      user_id: user.id,
      action: "invoice.deleted",
      entity_type: "invoice",
      entity_id: inv.id,
      meta: { invoice_number: inv.invoice_number, status: inv.status, bulk: true },
    }))
  );

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Verify the route by hand**

Start the dev server (`npm run dev`), sign in, and from the browser console on any app page:

```js
await (await fetch("/api/invoices/bulk/delete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ids: ["<a-sent-invoice-id>"], dryRun: true }),
})).json();
```

Expected: `{ deleted: 0, skipped: 1, reasons: [{ count: 1, reason: "1 invoice has been sent — void it instead" }] }`, and the invoice still exists.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/invoices/bulk/delete/route.ts
git commit -m "feat: add invoices bulk delete route"
```

---

### Task 5: Estimates and expenses bulk delete routes

Two routes with the same simple shape, built together.

**Files:**
- Create: `src/app/api/estimates/bulk/delete/route.ts`
- Create: `src/app/api/expenses/bulk/delete/route.ts`

**Interfaces:**
- Consumes: `partitionEstimates`, `partitionExpenses`, `summarise` from `@/lib/bulk-actions`.
- Produces: `POST /api/estimates/bulk/delete` and `POST /api/expenses/bulk/delete`, both accepting `{ ids: string[], dryRun?: boolean }` and returning `BulkActionResult`.

- [ ] **Step 1: Write the estimates route**

Create `src/app/api/estimates/bulk/delete/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { partitionEstimates, summarise } from "@/lib/bulk-actions";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun } = parsed.data;

  const { data: estimates, error: fetchError } = await supabase
    .from("estimates")
    .select("id, estimate_number, converted_invoice_id")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const partition = partitionEstimates(estimates ?? []);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const deleteIds = partition.deletable.map((e) => e.id);

  // estimate_items cascade on delete.
  const { error: deleteError } = await supabase
    .from("estimates")
    .delete()
    .in("id", deleteIds)
    .eq("org_id", org.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  await supabase.from("audit_logs").insert(
    partition.deletable.map((est) => ({
      org_id: org.id,
      user_id: user.id,
      action: "estimate.deleted",
      entity_type: "estimate",
      entity_id: est.id,
      meta: { estimate_number: est.estimate_number, bulk: true },
    }))
  );

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Write the expenses route**

Create `src/app/api/expenses/bulk/delete/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { partitionExpenses, summarise } from "@/lib/bulk-actions";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun } = parsed.data;

  const { data: expenses, error: fetchError } = await supabase
    .from("expenses")
    .select("id, title, amount, invoice_id")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const partition = partitionExpenses(expenses ?? []);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const deleteIds = partition.deletable.map((e) => e.id);

  const { error: deleteError } = await supabase
    .from("expenses")
    .delete()
    .in("id", deleteIds)
    .eq("org_id", org.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  await supabase.from("audit_logs").insert(
    partition.deletable.map((exp) => ({
      org_id: org.id,
      user_id: user.id,
      action: "expense.deleted",
      entity_type: "expense",
      entity_id: exp.id,
      meta: { title: exp.title, amount: exp.amount, bulk: true },
    }))
  );

  return NextResponse.json(result);
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Verify by hand**

With the dev server running, dry-run an estimate that has been converted to an invoice:

```js
await (await fetch("/api/estimates/bulk/delete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ids: ["<converted-estimate-id>"], dryRun: true }),
})).json();
```

Expected: `deleted: 0` with the reason `"1 estimate has been converted to an invoice"`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/estimates/bulk/delete/route.ts src/app/api/expenses/bulk/delete/route.ts
git commit -m "feat: add estimates and expenses bulk delete routes"
```

---

### Task 6: Clients bulk delete route

**Files:**
- Create: `src/app/api/clients/bulk/delete/route.ts`

**Interfaces:**
- Consumes: `partitionClients`, `summarise`, `ClientRow` from `@/lib/bulk-actions`.
- Produces: `POST /api/clients/bulk/delete` accepting `{ ids: string[], dryRun?: boolean }` and returning `BulkActionResult`.

- [ ] **Step 1: Write the route**

Create `src/app/api/clients/bulk/delete/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { partitionClients, summarise, type ClientRow } from "@/lib/bulk-actions";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun } = parsed.data;

  const { data: clients, error: fetchError } = await supabase
    .from("clients")
    .select("id, name")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const candidateIds = (clients ?? []).map((c) => c.id);

  // invoices, estimates and expenses all reference clients with ON DELETE SET NULL,
  // so deleting a referenced client would silently orphan its history.
  const linked = new Set<string>();
  if (candidateIds.length > 0) {
    const [invoices, estimates, expenses] = await Promise.all([
      supabase.from("invoices").select("client_id").in("client_id", candidateIds),
      supabase.from("estimates").select("client_id").in("client_id", candidateIds),
      supabase.from("expenses").select("client_id").in("client_id", candidateIds),
    ]);
    for (const set of [invoices.data, estimates.data, expenses.data]) {
      for (const row of set ?? []) {
        if (row.client_id) linked.add(row.client_id as string);
      }
    }
  }

  const rows: ClientRow[] = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    hasLinkedRecords: linked.has(c.id),
  }));

  const partition = partitionClients(rows);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const deleteIds = partition.deletable.map((c) => c.id);

  const { error: deleteError } = await supabase
    .from("clients")
    .delete()
    .in("id", deleteIds)
    .eq("org_id", org.id);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  await supabase.from("audit_logs").insert(
    partition.deletable.map((client) => ({
      org_id: org.id,
      user_id: user.id,
      action: "client.deleted",
      entity_type: "client",
      entity_id: client.id,
      meta: { name: client.name, bulk: true },
    }))
  );

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Verify by hand**

Dry-run a client that has at least one invoice:

```js
await (await fetch("/api/clients/bulk/delete", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ ids: ["<client-with-invoices-id>"], dryRun: true }),
})).json();
```

Expected: `deleted: 0` with the reason `"1 client has invoices or expenses — archive it instead"`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/clients/bulk/delete/route.ts
git commit -m "feat: add clients bulk delete route"
```

---

### Task 7: Invoices list — shared primitives, Delete, ungated checkboxes

**Files:**
- Modify: `src/components/invoices/InvoicesTable.tsx`

**Interfaces:**
- Consumes: `useRowSelection` (Task 2); `BulkActionBar`, `BulkDeleteDialog`, `RowCheckbox` (Task 3); `POST /api/invoices/bulk/delete` (Task 4).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the selection state with the hook**

In `src/components/invoices/InvoicesTable.tsx`, delete the `selected` state, `toggleAll`, `toggleOne`, `allSelected` and `someSelected` definitions (lines 43, 60–82) and replace them with:

```tsx
const selection = useRowSelection();
const [deleteOpen, setDeleteOpen] = useState(false);
```

Add the imports:

```tsx
import { useRowSelection } from "@/hooks/useRowSelection";
import { BulkActionBar, BulkDeleteDialog, RowCheckbox } from "@/components/ui";
```

Update the derived values:

```tsx
const allFilteredIds = filtered.map((i) => i.id);
const selectedInvoices = invoices.filter((i) => selection.isSelected(i.id));
const selectedIds = selectedInvoices.map((i) => i.id);
```

Replace every remaining `setSelected(new Set())` with `selection.clear()`.

- [ ] **Step 2: Ungate the checkboxes**

The `canBulk` prop currently hides the entire checkbox column. It must now gate only Send and Void. In the table header, change the guard from `{canBulk && (` to an unconditional cell, and use the shared checkbox:

```tsx
<th className="py-3 pl-4 pr-2 w-8">
  <RowCheckbox
    checked={selection.allSelected(allFilteredIds)}
    onChange={() => selection.toggleAll(allFilteredIds)}
    label="Select all"
  />
</th>
```

And in the row body, likewise unconditional:

```tsx
<td className="py-3 pl-4 pr-2">
  <RowCheckbox
    checked={selection.isSelected(invoice.id)}
    onChange={() => selection.toggleOne(invoice.id)}
    label={`Select ${invoice.invoice_number}`}
  />
</td>
```

Keep `const isSelected = selection.isSelected(invoice.id);` for the row's highlight class.

- [ ] **Step 3: Swap in the shared bar and add Delete**

Replace the inlined bar (the block starting `{canBulk && someSelected && (`) with:

```tsx
<BulkActionBar count={selection.count} onClear={selection.clear}>
  {canBulk && canSend && (
    <button
      onClick={handleBulkSend}
      disabled={bulkState !== "idle"}
      className="px-3 py-1.5 bg-white text-neutral-950 font-medium rounded-lg hover:bg-neutral-100 disabled:opacity-50 transition-colors"
    >
      {bulkState === "sending" ? "Sending…" : "Send"}
    </button>
  )}
  <button
    onClick={handleBulkExport}
    className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors"
  >
    Export CSV
  </button>
  {canBulk && canVoid && (
    <button
      onClick={handleBulkVoid}
      disabled={bulkState !== "idle"}
      className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
    >
      {bulkState === "voiding" ? "Voiding…" : "Void"}
    </button>
  )}
  <button
    onClick={() => setDeleteOpen(true)}
    disabled={bulkState !== "idle"}
    className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
  >
    Delete
  </button>
</BulkActionBar>
```

- [ ] **Step 4: Mount the dialog**

Just before the closing `</div>` of the component, alongside the toast:

```tsx
<BulkDeleteDialog
  open={deleteOpen}
  endpoint="/api/invoices/bulk/delete"
  ids={selectedIds}
  noun="invoice"
  nounPlural="invoices"
  onCancel={() => setDeleteOpen(false)}
  onDeleted={(result) => {
    setDeleteOpen(false);
    selection.clear();
    showToast(
      `Deleted ${result.deleted} invoice${result.deleted !== 1 ? "s" : ""}` +
        (result.skipped > 0 ? `, ${result.skipped} skipped` : "") +
        "."
    );
    router.refresh();
  }}
/>
```

- [ ] **Step 5: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Verify in the browser**

With the dev server running, open `/invoices` and check:
1. Checkboxes appear even on a free-plan org (Send and Void do not).
2. Selecting a draft and a sent invoice, then Delete, shows "Delete 1 invoice?" and the sent-invoice skip line.
3. Confirming deletes only the draft; the toast reads "Deleted 1 invoice, 1 skipped."
4. Selecting only sent invoices shows the disabled-confirm "Nothing can be deleted" state.
5. The list looks right in dark mode and at a narrow viewport.

- [ ] **Step 7: Commit**

```bash
git add src/components/invoices/InvoicesTable.tsx
git commit -m "feat: add bulk delete to invoices list"
```

---

### Task 8: Estimates list — extract the table, add selection and Delete

**Files:**
- Create: `src/components/estimates/EstimatesTable.tsx`
- Modify: `src/app/(app)/estimates/page.tsx`

**Interfaces:**
- Consumes: `useRowSelection`; `BulkActionBar`, `BulkDeleteDialog`, `RowCheckbox`; `POST /api/estimates/bulk/delete`.
- Produces: `EstimatesTable({ estimates })`, consumed by the estimates page.

- [ ] **Step 1: Create the table component**

Create `src/components/estimates/EstimatesTable.tsx`, moving the markup currently inline in the page and adding selection:

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import EstimateStatusBadge from "./EstimateStatusBadge";
import { BulkActionBar, BulkDeleteDialog, RowCheckbox } from "@/components/ui";
import { useRowSelection } from "@/hooks/useRowSelection";
import type { EstimateWithClient } from "@/lib/supabase/types";

interface Props {
  estimates: EstimateWithClient[];
}

export default function EstimatesTable({ estimates }: Props) {
  const router = useRouter();
  const selection = useRowSelection();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const allIds = estimates.map((e) => e.id);
  const selectedIds = allIds.filter((id) => selection.isSelected(id));

  return (
    <div className="space-y-4">
      <BulkActionBar count={selection.count} onClear={selection.clear}>
        <button
          onClick={() => setDeleteOpen(true)}
          className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </BulkActionBar>

      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-800">
                <th className="py-3 pl-5 pr-2 w-8">
                  <RowCheckbox
                    checked={selection.allSelected(allIds)}
                    onChange={() => selection.toggleAll(allIds)}
                    label="Select all"
                  />
                </th>
                <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Number</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Client</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Date</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Expires</th>
                <th className="text-right px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Total</th>
                <th className="text-left px-5 py-3 font-medium text-neutral-500 dark:text-neutral-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {estimates.map((est) => (
                <tr
                  key={est.id}
                  className={`transition-colors ${
                    selection.isSelected(est.id)
                      ? "bg-neutral-50 dark:bg-neutral-800/60"
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  <td className="py-3.5 pl-5 pr-2">
                    <RowCheckbox
                      checked={selection.isSelected(est.id)}
                      onChange={() => selection.toggleOne(est.id)}
                      label={`Select ${est.estimate_number}`}
                    />
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/estimates/${est.id}`} className="font-medium text-neutral-950 dark:text-neutral-50 hover:underline">
                      {est.estimate_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                    {est.clients?.name ?? <span className="text-neutral-400">No client</span>}
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                    {formatDate(est.issue_date)}
                  </td>
                  <td className="px-5 py-3.5 text-neutral-600 dark:text-neutral-400">
                    {est.expiry_date ? formatDate(est.expiry_date) : <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-neutral-950 dark:text-neutral-50">
                    {formatCurrency(est.total, est.currency)}
                  </td>
                  <td className="px-5 py-3.5">
                    <EstimateStatusBadge status={est.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <BulkDeleteDialog
        open={deleteOpen}
        endpoint="/api/estimates/bulk/delete"
        ids={selectedIds}
        noun="estimate"
        nounPlural="estimates"
        onCancel={() => setDeleteOpen(false)}
        onDeleted={(result) => {
          setDeleteOpen(false);
          selection.clear();
          showToast(
            `Deleted ${result.deleted} estimate${result.deleted !== 1 ? "s" : ""}` +
              (result.skipped > 0 ? `, ${result.skipped} skipped` : "") +
              "."
          );
          router.refresh();
        }}
      />

      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-neutral-950 text-white text-sm font-medium rounded-xl shadow-lg z-50 pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Use it from the page**

In `src/app/(app)/estimates/page.tsx`, replace the whole `<div className="bg-white dark:bg-neutral-900 rounded-2xl …">…</div>` block (the non-empty branch of the ternary) with:

```tsx
<EstimatesTable estimates={estimates} />
```

Add `import EstimatesTable from "@/components/estimates/EstimatesTable";` and remove the now-unused imports: `formatCurrency`, `formatDate` and `EstimateStatusBadge`. Keep the empty-state branch and `Topbar` exactly as they are.

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no unused-import warnings for the page.

- [ ] **Step 4: Verify in the browser**

Open `/estimates`: the table renders as before with a new checkbox column; selecting rows shows the bar; deleting a converted estimate is refused with the right reason; the empty state is unchanged when there are no estimates.

- [ ] **Step 5: Commit**

```bash
git add src/components/estimates/EstimatesTable.tsx "src/app/(app)/estimates/page.tsx"
git commit -m "feat: extract estimates table and add bulk delete"
```

---

### Task 9: Clients list — selection and Delete

**Files:**
- Modify: `src/components/clients/ClientsTable.tsx`

**Interfaces:**
- Consumes: `useRowSelection`; `BulkActionBar`, `BulkDeleteDialog`, `RowCheckbox`; `POST /api/clients/bulk/delete`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the state and imports**

At the top of `src/components/clients/ClientsTable.tsx` add:

```tsx
import { useRouter } from "next/navigation";
import { BulkActionBar, BulkDeleteDialog, RowCheckbox } from "@/components/ui";
import { useRowSelection } from "@/hooks/useRowSelection";
```

Inside the component, after the `query` state:

```tsx
const router = useRouter();
const selection = useRowSelection();
const [deleteOpen, setDeleteOpen] = useState(false);
const [toast, setToast] = useState<string | null>(null);

const showToast = (msg: string) => {
  setToast(msg);
  setTimeout(() => setToast(null), 4000);
};
```

After the existing `filtered` definition:

```tsx
const filteredIds = filtered.map((c) => c.id);
const selectedIds = clients.filter((c) => selection.isSelected(c.id)).map((c) => c.id);
```

- [ ] **Step 2: Add the bar above the table**

Immediately before the `<div className="bg-white dark:bg-neutral-900 rounded-xl …">` wrapper:

```tsx
<BulkActionBar count={selection.count} onClear={selection.clear}>
  <button
    onClick={() => setDeleteOpen(true)}
    className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
  >
    Delete
  </button>
</BulkActionBar>
```

- [ ] **Step 3: Add the checkbox column**

As the first `<th>` in the header row:

```tsx
<th className="py-3 pl-5 pr-2 w-8">
  <RowCheckbox
    checked={selection.allSelected(filteredIds)}
    onChange={() => selection.toggleAll(filteredIds)}
    label="Select all"
  />
</th>
```

As the first `<td>` in each body row:

```tsx
<td className="py-3 pl-5 pr-2">
  <RowCheckbox
    checked={selection.isSelected(client.id)}
    onChange={() => selection.toggleOne(client.id)}
    label={`Select ${client.name}`}
  />
</td>
```

Change the existing name cell's padding from `py-3 px-5` to `py-3 px-4` so the row still aligns with the header.

- [ ] **Step 4: Mount the dialog and toast**

Before the component's final closing `</div>`:

```tsx
<BulkDeleteDialog
  open={deleteOpen}
  endpoint="/api/clients/bulk/delete"
  ids={selectedIds}
  noun="client"
  nounPlural="clients"
  onCancel={() => setDeleteOpen(false)}
  onDeleted={(result) => {
    setDeleteOpen(false);
    selection.clear();
    showToast(
      `Deleted ${result.deleted} client${result.deleted !== 1 ? "s" : ""}` +
        (result.skipped > 0 ? `, ${result.skipped} skipped` : "") +
        "."
    );
    router.refresh();
  }}
/>

{toast && (
  <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-neutral-950 text-white text-sm font-medium rounded-xl shadow-lg z-50 pointer-events-none">
    {toast}
  </div>
)}
```

- [ ] **Step 5: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Verify in the browser**

Open `/clients`: selecting a client with invoices and one without, then Delete, offers to delete only the unlinked one and shows the "archive them instead" line for the other. Check the archived view still works and the row layout is intact on mobile.

- [ ] **Step 7: Commit**

```bash
git add src/components/clients/ClientsTable.tsx
git commit -m "feat: add bulk delete to clients list"
```

---

### Task 10: Expenses list — selection and Delete

`ExpensesList` holds its rows in local state and refetches through `fetchExpenses`, so this list refreshes by calling that rather than `router.refresh()`.

**Files:**
- Modify: `src/components/expenses/ExpensesList.tsx`

**Interfaces:**
- Consumes: `useRowSelection`; `BulkActionBar`, `BulkDeleteDialog`, `RowCheckbox`; `POST /api/expenses/bulk/delete`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Add the state and imports**

Add to the imports:

```tsx
import { BulkActionBar, BulkDeleteDialog, RowCheckbox } from "@/components/ui";
import { useRowSelection } from "@/hooks/useRowSelection";
```

Alongside the existing `useState` calls in the component (near line 71):

```tsx
const selection = useRowSelection();
const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
const [toast, setToast] = useState<string | null>(null);

const showToast = (msg: string) => {
  setToast(msg);
  setTimeout(() => setToast(null), 4000);
};
```

This file has no existing toast or inline-status pattern — `handleDelete` at line 144 removes rows silently — so the toast block above matches what `InvoicesTable` does rather than inventing something new.

After the component's derived values:

```tsx
const visibleIds = expenses.map((e) => e.id);
const selectedIds = visibleIds.filter((id) => selection.isSelected(id));
```

- [ ] **Step 2: Add the bar above the table**

Immediately before the wrapper that contains `<table className="w-full text-sm">` (around line 344):

```tsx
<BulkActionBar count={selection.count} onClear={selection.clear}>
  <button
    onClick={() => setBulkDeleteOpen(true)}
    className="px-3 py-1.5 bg-neutral-800 dark:bg-neutral-700 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
  >
    Delete
  </button>
</BulkActionBar>
```

If the bar would land inside the table's bordered card, place it just outside that card so it sits above the border, matching the invoices list.

- [ ] **Step 3: Add the checkbox column**

As the first `<th>` in the header row at line 346:

```tsx
<th className="py-3 pl-4 pr-2 w-8">
  <RowCheckbox
    checked={selection.allSelected(visibleIds)}
    onChange={() => selection.toggleAll(visibleIds)}
    label="Select all"
  />
</th>
```

As the first `<td>` in the row rendered at line 361:

```tsx
<td className="py-3 pl-4 pr-2">
  <RowCheckbox
    checked={selection.isSelected(expense.id)}
    onChange={() => selection.toggleOne(expense.id)}
    label={`Select ${expense.title}`}
  />
</td>
```

- [ ] **Step 4: Mount the dialog**

Near the existing modal mounts at the end of the component:

```tsx
<BulkDeleteDialog
  open={bulkDeleteOpen}
  endpoint="/api/expenses/bulk/delete"
  ids={selectedIds}
  noun="expense"
  nounPlural="expenses"
  onCancel={() => setBulkDeleteOpen(false)}
  onDeleted={async (result) => {
    setBulkDeleteOpen(false);
    selection.clear();
    // This list owns its rows in state, so refetch rather than router.refresh().
    // Every parameter of fetchExpenses defaults to the current filter state,
    // so calling it with no arguments preserves the active period and category.
    await fetchExpenses();
    showToast(
      `Deleted ${result.deleted} expense${result.deleted !== 1 ? "s" : ""}` +
        (result.skipped > 0 ? `, ${result.skipped} skipped` : "") +
        "."
    );
  }}
/>

{toast && (
  <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 bg-neutral-950 text-white text-sm font-medium rounded-xl shadow-lg z-50 pointer-events-none">
    {toast}
  </div>
)}
```

- [ ] **Step 5: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 6: Verify in the browser**

Open `/expenses`: select a billed and an unbilled expense, delete, and confirm only the unbilled one goes and the list refreshes without a full page reload. Check the period and category filters still work afterwards.

- [ ] **Step 7: Commit**

```bash
git add src/components/expenses/ExpensesList.tsx
git commit -m "feat: add bulk delete to expenses list"
```

---

### Task 11: Cross-cutting verification and docs

**Files:**
- Modify: `docs/INV-001-current-state-audit.md`

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: PASS — `src/lib/bulk-actions.test.ts` and `src/hooks/useRowSelection.test.ts`.

- [ ] **Step 2: Run the build**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 3: Verify the org-scoping guarantee by hand**

With two orgs available, take an invoice id belonging to org B while signed in as org A and dry-run it against `/api/invoices/bulk/delete`.
Expected: `{ deleted: 0, skipped: 1, reasons: [{ count: 1, reason: "1 record could not be found" }] }`, and the invoice still exists in org B.

- [ ] **Step 4: Verify the billed-expense cleanup**

Create a draft invoice, bill an expense onto it, then bulk-delete the draft.
Expected: the invoice is gone, and the expense reappears as unbilled — `invoice_id` and `invoiced_at` both null — rather than sitting in limbo.

- [ ] **Step 5: Update the docs**

In `docs/INV-001-current-state-audit.md`, find the section describing the list views and bulk actions and record: multi-select delete on invoices, estimates, expenses and clients; ungated on all plans; the per-resource eligibility rules; that Send and Void remain Business-plan features. Match the surrounding document's heading style and tone.

If Part 2 has already been implemented when you reach this step, also record the invoice quick actions (mark as paid, send reminders, duplicate, download PDFs) and their eligibility rules. If not, leave that for the end of Part 2.

- [ ] **Step 6: Commit**

```bash
git add docs/INV-001-current-state-audit.md
git commit -m "docs: record bulk delete behaviour"
```

---

## Self-review notes

Checked against the spec:

- Four lists, four routes, ungated — Tasks 4, 5, 6 and 7–10.
- Invoice rule (draft/void, minus anything with payments, refunds or credit notes) — Task 1 tests, Task 4 route.
- Billed-expense `invoiced_at` cleanup — Task 4, verified in Task 11 Step 4.
- Estimate `converted_invoice_id` and expense `invoice_id` rules — Tasks 1 and 5.
- Client linked-records rule with the archive nudge — Tasks 1 and 6.
- Shared `useRowSelection`, `BulkActionBar`, `BulkDeleteDialog`, `RowCheckbox` — Tasks 2 and 3.
- Audit rows for all four resources with `meta.bulk = true` — Tasks 4, 5 and 6.
- Loading, success, partial, nothing-eligible, error and empty states — Task 3's dialog and each list task.
- Selection surviving search — Task 2's test, `useRowSelection` preserving hidden ids.
- 50-id cap and Zod validation on every route — Tasks 4, 5 and 6.
- Docs — Task 11.

The spec's client-side preview rules are deliberately not implemented; the dry-run request replaces them, as recorded under "Refinement of the spec" above.

---

## Part 2: Invoice quick actions

Added after the delete work was planned. Extends the same bulk bar with Mark as paid, Send reminders,
Duplicate and Download PDFs. Every one is a server route following the Part 1 pattern: Zod input,
org-scoped queries, server-side eligibility, audit logs, `{ done, skipped, reasons }` back.

**Rule note:** `CLAUDE.md` forbids marking invoices paid from the frontend, and
`src/components/invoices/RecordPaymentModal.tsx:46-73` already does exactly that from the browser.
These tasks do **not** change that file — the decision was to keep bulk clean rather than refactor
working payment code in the same pass. The pre-existing violation stands and is worth a follow-up.

### Task 12: Eligibility rules for the new actions

**Files:**
- Modify: `src/lib/bulk-actions.ts`
- Test: `src/lib/bulk-actions.test.ts`

**Interfaces:**
- Consumes: `Partition`, `SkipReason`, `skip` from Task 1.
- Produces: `MarkPaidRow`, `RemindRow`, `partitionMarkPaid`, `partitionRemind`. Tasks 13–14 use them.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/bulk-actions.test.ts`:

```ts
import { partitionMarkPaid, partitionRemind } from "./bulk-actions";

describe("partitionMarkPaid", () => {
  it("accepts invoices that are awaiting payment", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "sent", total: 100, amount_paid: 0 },
      { id: "b", invoice_number: "INV-2", status: "overdue", total: 100, amount_paid: 0 },
      { id: "c", invoice_number: "INV-3", status: "partial", total: 100, amount_paid: 40 },
      { id: "d", invoice_number: "INV-4", status: "issued", total: 100, amount_paid: 0 },
    ];
    expect(partitionMarkPaid(rows).deletable.map((r) => r.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("skips drafts, which have not been issued to anyone", () => {
    const rows = [{ id: "a", invoice_number: "INV-1", status: "draft", total: 100, amount_paid: 0 }];
    expect(partitionMarkPaid(rows).skips).toEqual([
      { count: 1, reason: "1 invoice is still a draft — issue it first" },
    ]);
  });

  it("skips invoices that are already paid or voided", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "paid", total: 100, amount_paid: 100 },
      { id: "b", invoice_number: "INV-2", status: "void", total: 100, amount_paid: 0 },
    ];
    const result = partitionMarkPaid(rows);
    expect(result.deletable).toEqual([]);
    expect(result.skips).toEqual([
      { count: 2, reason: "2 invoices are already paid or voided" },
    ]);
  });

  it("skips an invoice with nothing left outstanding", () => {
    const rows = [{ id: "a", invoice_number: "INV-1", status: "sent", total: 100, amount_paid: 100 }];
    expect(partitionMarkPaid(rows).skips).toEqual([
      { count: 1, reason: "1 invoice has nothing outstanding" },
    ]);
  });
});

describe("partitionRemind", () => {
  it("accepts active invoices whose client has an email address", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "overdue", clientEmail: "a@example.com" },
      { id: "b", invoice_number: "INV-2", status: "sent", clientEmail: "b@example.com" },
      { id: "c", invoice_number: "INV-3", status: "issued", clientEmail: "c@example.com" },
    ];
    expect(partitionRemind(rows).deletable).toHaveLength(3);
  });

  it("skips invoices that are not awaiting payment", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "draft", clientEmail: "a@example.com" },
      { id: "b", invoice_number: "INV-2", status: "paid", clientEmail: "b@example.com" },
    ];
    expect(partitionRemind(rows).skips).toEqual([
      { count: 2, reason: "2 invoices are not awaiting payment" },
    ]);
  });

  it("skips invoices whose client has no email address", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "sent", clientEmail: null },
      { id: "b", invoice_number: "INV-2", status: "sent", clientEmail: "b@example.com" },
    ];
    const result = partitionRemind(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["b"]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 invoice has a client with no email address" },
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test src/lib/bulk-actions.test.ts`
Expected: FAIL — `partitionMarkPaid is not a function`.

- [ ] **Step 3: Write the implementation**

Append to `src/lib/bulk-actions.ts`:

```ts
export type MarkPaidRow = {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  amount_paid: number;
};

export type RemindRow = {
  id: string;
  invoice_number: string;
  status: string;
  clientEmail: string | null;
};

const PAYABLE_STATUSES = new Set(["issued", "sent", "overdue", "partial"]);
const REMINDABLE_STATUSES = new Set(["issued", "sent", "overdue"]);

export function partitionMarkPaid(rows: MarkPaidRow[]): Partition<MarkPaidRow> {
  const deletable: MarkPaidRow[] = [];
  let drafts = 0;
  let settled = 0;
  let nothingOutstanding = 0;

  for (const row of rows) {
    if (row.status === "draft") {
      drafts++;
    } else if (!PAYABLE_STATUSES.has(row.status)) {
      settled++;
    } else if (Number(row.total) - Number(row.amount_paid) <= 0) {
      nothingOutstanding++;
    } else {
      deletable.push(row);
    }
  }

  return {
    deletable,
    skips: [
      ...skip(drafts, "invoice is still a draft — issue it first", "invoices are still drafts — issue them first"),
      ...skip(settled, "invoice is already paid or voided", "invoices are already paid or voided"),
      ...skip(nothingOutstanding, "invoice has nothing outstanding", "invoices have nothing outstanding"),
    ],
  };
}

export function partitionRemind(rows: RemindRow[]): Partition<RemindRow> {
  const deletable: RemindRow[] = [];
  let wrongStatus = 0;
  let noEmail = 0;

  for (const row of rows) {
    if (!REMINDABLE_STATUSES.has(row.status)) wrongStatus++;
    else if (!row.clientEmail) noEmail++;
    else deletable.push(row);
  }

  return {
    deletable,
    skips: [
      ...skip(wrongStatus, "invoice is not awaiting payment", "invoices are not awaiting payment"),
      ...skip(noEmail, "invoice has a client with no email address", "invoices have clients with no email address"),
    ],
  };
}
```

Note: `skip` is currently module-private in `bulk-actions.ts`. It stays private — these functions
live in the same file.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/bulk-actions.ts src/lib/bulk-actions.test.ts
git commit -m "feat: add eligibility rules for bulk mark-paid and remind"
```

---

### Task 13: Bulk mark as paid

Records a real payment per invoice, server-side, then recomputes status. This is the compliant
counterpart to the frontend-written status in `RecordPaymentModal`.

**Files:**
- Create: `src/app/api/invoices/bulk/mark-paid/route.ts`

**Interfaces:**
- Consumes: `partitionMarkPaid`, `summarise` from `@/lib/bulk-actions`.
- Produces: `POST /api/invoices/bulk/mark-paid` accepting `{ ids, dryRun?, method?, paidAt? }`.

- [ ] **Step 1: Write the route**

Create `src/app/api/invoices/bulk/mark-paid/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { partitionMarkPaid, summarise } from "@/lib/bulk-actions";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  dryRun: z.boolean().optional().default(false),
  method: z.enum(["bank_transfer", "card", "cash", "other"]).optional().default("bank_transfer"),
  paidAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun, method } = parsed.data;
  const paidAt = parsed.data.paidAt ?? new Date().toISOString();

  const { data: invoices, error: fetchError } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total, amount_paid, currency")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const partition = partitionMarkPaid(invoices ?? []);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const rows = invoices ?? [];
  const currencyOf = new Map(rows.map((i) => [i.id, i.currency as string]));

  // Outstanding balance matches RecordPaymentModal: total minus what has been paid.
  const paymentRows = partition.deletable.map((inv) => ({
    org_id: org.id,
    invoice_id: inv.id,
    amount: Number(inv.total) - Number(inv.amount_paid),
    currency: currencyOf.get(inv.id) ?? "GBP",
    method,
    reference: null,
    paid_at: paidAt,
  }));

  const { error: payError } = await supabase.from("payments").insert(paymentRows);
  if (payError) return NextResponse.json({ error: payError.message }, { status: 500 });

  // Status is computed here, on the server, from the invoice's own totals.
  for (const inv of partition.deletable) {
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ amount_paid: Number(inv.total), status: "paid", paid_at: paidAt })
      .eq("id", inv.id)
      .eq("org_id", org.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await supabase.from("audit_logs").insert(
    partition.deletable.map((inv) => ({
      org_id: org.id,
      user_id: user.id,
      action: "invoice.paid",
      entity_type: "invoice",
      entity_id: inv.id,
      meta: {
        invoice_number: inv.invoice_number,
        amount: Number(inv.total) - Number(inv.amount_paid),
        method,
        bulk: true,
      },
    }))
  );

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Verify by hand**

Dry-run a draft and a sent invoice together. Expected: `deleted: 1` with the reason
`"1 invoice is still a draft — issue it first"`. Then run it for real on the sent invoice and confirm
in the UI that a payment row appears on the invoice, the status reads Paid, and `/payments` lists it.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/invoices/bulk/mark-paid/route.ts
git commit -m "feat: add server-side bulk mark as paid"
```

---

### Task 14: Bulk send reminders

**Files:**
- Create: `src/app/api/invoices/bulk/remind/route.ts`
- Reference: `src/app/api/invoices/[id]/remind/route.ts`

**Interfaces:**
- Consumes: `partitionRemind`, `summarise` from `@/lib/bulk-actions`.
- Produces: `POST /api/invoices/bulk/remind` accepting `{ ids, dryRun? }`.

- [ ] **Step 1: Read the single-invoice route first**

Read `src/app/api/invoices/[id]/remind/route.ts` end to end. The bulk route sends the same
`OverdueReminderEmail` through the same `sendTransactionalEmail` helper — which is what writes
`email_logs`, satisfying the "all transactional emails must be logged" rule. Do not hand-roll the
email or bypass that helper.

- [ ] **Step 2: Write the route**

Create `src/app/api/invoices/bulk/remind/route.ts`, mirroring the single route's email construction
for each eligible invoice:

```ts
import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { OverdueReminderEmail } from "@/emails/transactional/OverdueReminderEmail";
import { formatCurrency, formatDate } from "@/lib/utils";
import { partitionRemind, summarise, type RemindRow } from "@/lib/bulk-actions";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun } = parsed.data;

  const { data: invoices, error: fetchError } = await supabase
    .from("invoices")
    .select("*, clients(*), organisations(name, accent_color, logo_url, from_email)")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const unwrap = <T,>(v: T | T[] | null): T | null => (Array.isArray(v) ? (v[0] ?? null) : v);

  const rows: RemindRow[] = (invoices ?? []).map((inv) => ({
    id: inv.id,
    invoice_number: inv.invoice_number,
    status: inv.status,
    clientEmail: unwrap(inv.clients)?.email ?? null,
  }));

  const partition = partitionRemind(rows);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const byId = new Map((invoices ?? []).map((i) => [i.id, i]));
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  for (const row of partition.deletable) {
    const invoice = byId.get(row.id);
    if (!invoice) continue;

    const client = unwrap(invoice.clients);
    const orgRow = unwrap(invoice.organisations);
    if (!client?.email) continue;

    const payUrl = invoice.public_token ? `${appUrl}/pay/${invoice.public_token}` : appUrl;
    const logoUrl = orgRow?.logo_url ? orgRow.logo_url.split("?")[0] : null;
    const daysOverdue = invoice.due_date
      ? Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / 86_400_000)
      : null;

    const subject = daysOverdue && daysOverdue > 0
      ? `Reminder: Invoice ${invoice.invoice_number} is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`
      : `Reminder: Invoice ${invoice.invoice_number} is due`;

    await sendTransactionalEmail({
      orgId: org.id,
      invoiceId: invoice.id,
      to: client.email,
      subject,
      templateName: "overdue-reminder",
      fromEmail: orgRow?.from_email,
      react: createElement(OverdueReminderEmail, {
        clientName: client.name ?? "there",
        orgName: orgRow?.name ?? "",
        logoUrl,
        accentColor: orgRow?.accent_color ?? "#111827",
        invoiceNumber: invoice.invoice_number,
        dueDate: invoice.due_date ? formatDate(invoice.due_date) : "—",
        balanceDue: formatCurrency(
          invoice.total + (invoice.late_fee_amount ?? 0) - invoice.amount_paid,
          invoice.currency
        ),
        payUrl,
      }),
    });
  }

  await supabase.from("audit_logs").insert(
    partition.deletable.map((inv) => ({
      org_id: org.id,
      user_id: user.id,
      action: "invoice.reminded",
      entity_type: "invoice",
      entity_id: inv.id,
      meta: { invoice_number: inv.invoice_number, bulk: true },
    }))
  );

  return NextResponse.json(result);
}
```

Before finalising, compare the `OverdueReminderEmail` props above against the single-invoice route —
if its prop names differ, follow that file, not this snippet.

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Verify by hand**

Send reminders for two overdue invoices. Expected: two emails arrive, and two new rows appear in
`email_logs` with template `overdue-reminder`.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/invoices/bulk/remind/route.ts
git commit -m "feat: add bulk invoice reminders"
```

---

### Task 15: Bulk duplicate

**Files:**
- Create: `src/app/api/invoices/bulk/duplicate/route.ts`
- Reference: `src/app/api/invoices/[id]/duplicate/route.ts`

**Interfaces:**
- Consumes: `generateInvoiceNumber` from `@/lib/invoice-number`; `summarise` from `@/lib/bulk-actions`.
- Produces: `POST /api/invoices/bulk/duplicate` accepting `{ ids, dryRun? }`.

Any invoice can be duplicated, so there is no eligibility rule — only ids that could not be found are
skipped. **Invoice numbers must be generated sequentially**, never in a `Promise.all`: concurrent
calls to `generateInvoiceNumber` would race and collide with the `unique (org_id, invoice_number)`
constraint.

- [ ] **Step 1: Write the route**

Create `src/app/api/invoices/bulk/duplicate/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import { summarise } from "@/lib/bulk-actions";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun } = parsed.data;

  const { data: sources, error: fetchError } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const partition = { deletable: sources ?? [], skips: [] };
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const today = new Date().toISOString().slice(0, 10);

  // Sequential: generateInvoiceNumber must not run concurrently or numbers collide.
  for (const source of partition.deletable) {
    const newNumber = await generateInvoiceNumber(org.id);

    const { data: created, error: insertError } = await supabase
      .from("invoices")
      .insert({
        org_id: org.id,
        client_id: source.client_id,
        invoice_number: newNumber,
        template: source.template,
        status: "draft",
        currency: source.currency,
        issue_date: today,
        due_date: null,
        notes: source.notes,
        terms: source.terms,
        subtotal: source.subtotal,
        vat_amount: source.vat_amount,
        total: source.total,
        amount_paid: 0,
      })
      .select()
      .single();

    if (insertError || !created) {
      return NextResponse.json({ error: insertError?.message ?? "Failed to duplicate" }, { status: 500 });
    }

    const items = (source.invoice_items ?? []) as Array<{
      description: string;
      quantity: number;
      unit_price: number;
      vat_rate: number;
      sort_order: number;
    }>;

    if (items.length > 0) {
      await supabase.from("invoice_items").insert(
        items.map((item, idx) => ({
          invoice_id: created.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          sort_order: item.sort_order ?? idx,
        }))
      );
    }

    await supabase.from("audit_logs").insert({
      org_id: org.id,
      user_id: user.id,
      action: "invoice.duplicated",
      entity_type: "invoice",
      entity_id: created.id,
      meta: { source_invoice_id: source.id, invoice_number: newNumber, bulk: true },
    });
  }

  return NextResponse.json(result);
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Verify by hand**

Duplicate three invoices at once. Expected: three new drafts with consecutive, distinct invoice
numbers, each carrying the source's line items.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/invoices/bulk/duplicate/route.ts
git commit -m "feat: add bulk invoice duplicate"
```

---

### Task 16: Extract PDF rendering, then bulk download as a zip

The PDF generator currently lives inline in the per-invoice route. Bulk download needs the same code,
so it moves to a library module first — a refactor with no behaviour change — and both routes call it.

**Files:**
- Create: `src/lib/invoice-pdf.ts`
- Modify: `src/app/api/invoices/[id]/pdf/route.ts`
- Create: `src/app/api/invoices/bulk/pdf/route.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `renderInvoicePdf(invoiceId: string): Promise<{ buffer: Uint8Array; invoiceNumber: string } | null>`.

- [ ] **Step 1: Extract the generator**

Read `src/app/api/invoices/[id]/pdf/route.ts` in full. Move everything from the invoice fetch through
`renderToBuffer` into `src/lib/invoice-pdf.ts` as `renderInvoicePdf(invoiceId)`, returning
`{ buffer, invoiceNumber }`, or `null` when the invoice does not exist. Keep the plan/watermark and
branding logic (`getOrgPlan`, `canAccess`) exactly as it is — this step changes no behaviour.

- [ ] **Step 2: Make the existing route use it**

Rewrite `src/app/api/invoices/[id]/pdf/route.ts` to keep its auth check, call `renderInvoicePdf(id)`,
404 on `null`, and return the same `NextResponse` with the same headers as before.

- [ ] **Step 3: Verify the refactor changed nothing**

Run: `npm run build`, then download a PDF from an invoice page.
Expected: byte-for-byte the same document as before the refactor — same template, same watermark
behaviour on a free-plan org.

- [ ] **Step 4: Commit the refactor on its own**

```bash
git add src/lib/invoice-pdf.ts "src/app/api/invoices/[id]/pdf/route.ts"
git commit -m "refactor: extract invoice PDF rendering into a library module"
```

- [ ] **Step 5: Add the zip dependency**

```bash
npm install jszip@^3
```

- [ ] **Step 6: Write the bulk route**

Create `src/app/api/invoices/bulk/pdf/route.ts`. It returns a zip file rather than JSON, so it has no
`dryRun` branch — the client calls it directly from a button, not through `BulkDeleteDialog`:

```ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { renderInvoicePdf } from "@/lib/invoice-pdf";

const schema = z.object({ ids: z.array(z.string().uuid()).min(1).max(50) });

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  // Scope to the org before rendering anything.
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id")
    .in("id", parsed.data.ids)
    .eq("org_id", org.id);

  if (!invoices?.length) {
    return NextResponse.json({ error: "No invoices found" }, { status: 404 });
  }

  const zip = new JSZip();

  // Sequential: rendering many PDFs concurrently is memory-hungry on a serverless function.
  for (const { id } of invoices) {
    const rendered = await renderInvoicePdf(id);
    if (rendered) zip.file(`invoice-${rendered.invoiceNumber}.pdf`, rendered.buffer);
  }

  const archive = await zip.generateAsync({ type: "uint8array" });
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(archive, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="invoices-${stamp}.zip"`,
    },
  });
}
```

- [ ] **Step 7: Verify it compiles and works**

Run: `npm run build`. Then select three invoices and download.
Expected: a zip containing three correctly-named PDFs that open cleanly.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json src/app/api/invoices/bulk/pdf/route.ts
git commit -m "feat: add bulk invoice PDF download as zip"
```

---

### Task 17: Wire the quick actions into the invoices bulk bar

Five actions plus delete is too many to sit in a row. Primary actions stay inline; the rest move into
a dropdown built on the existing `src/components/ui/dropdown-menu.tsx`.

**Files:**
- Modify: `src/components/invoices/InvoicesTable.tsx`
- Modify: `src/components/ui/BulkDeleteDialog.tsx`

**Interfaces:**
- Consumes: every bulk route from Tasks 4, 13, 14, 15 and 16.

- [ ] **Step 1: Generalise the dialog**

`BulkDeleteDialog` already does exactly what these actions need: dry-run, show the breakdown, confirm.
Add two optional props so it can speak for actions other than delete, defaulting to today's wording:

```tsx
/** Verb shown in the title and button, e.g. "Mark as paid". Defaults to "Delete". */
verb?: string;
/** Set false for non-destructive actions to drop the "cannot be undone" line. */
destructive?: boolean;
```

Use `verb ?? "Delete"` in the title and confirm button, and render the "This cannot be undone."
description only when `destructive !== false`. Keep the confirm button's `variant="destructive"` only
when `destructive !== false`; otherwise use the default variant. Do not rename the component — it is
already imported by four lists.

- [ ] **Step 2: Add the action state**

In `InvoicesTable`, replace the single `deleteOpen` boolean with:

```tsx
type BulkAction = "delete" | "mark-paid" | "remind" | "duplicate";

const ACTIONS: Record<BulkAction, { endpoint: string; verb: string; destructive: boolean; past: string }> = {
  "delete":    { endpoint: "/api/invoices/bulk/delete",    verb: "Delete",       destructive: true,  past: "Deleted" },
  "mark-paid": { endpoint: "/api/invoices/bulk/mark-paid", verb: "Mark as paid", destructive: false, past: "Marked paid" },
  "remind":    { endpoint: "/api/invoices/bulk/remind",    verb: "Send reminders", destructive: false, past: "Reminded" },
  "duplicate": { endpoint: "/api/invoices/bulk/duplicate", verb: "Duplicate",    destructive: false, past: "Duplicated" },
};

const [action, setAction] = useState<BulkAction | null>(null);
```

- [ ] **Step 3: Restructure the bar**

Inline: **Send** (Business only), **Mark as paid**, **Delete**. In a `More` dropdown: Export CSV,
Download PDFs, Duplicate, Send reminders, Void (Business only). Use the existing
`DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent` and `DropdownMenuItem` imports from
`@/components/ui/dropdown-menu`, styled to sit on the dark bar. Match the button classes already used
in the bar rather than inventing new ones.

- [ ] **Step 4: Add the PDF download handler**

The zip route returns a file, not JSON, so it bypasses the dialog:

```tsx
async function handleDownloadPdfs() {
  setBulkState("downloading");
  const res = await fetch("/api/invoices/bulk/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: selectedIds }),
  });

  if (!res.ok) {
    setBulkState("idle");
    showToast("Could not build the download. Please try again.");
    return;
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `invoices-${new Date().toISOString().slice(0, 10)}.zip`;
  a.click();
  URL.revokeObjectURL(url);
  setBulkState("idle");
  showToast(`Downloaded ${selectedIds.length} invoice${selectedIds.length !== 1 ? "s" : ""}.`);
}
```

Add `"downloading"` to the `bulkState` union.

- [ ] **Step 5: Mount one dialog for all four actions**

Replace the single delete dialog with:

```tsx
{action && (
  <BulkDeleteDialog
    open
    endpoint={ACTIONS[action].endpoint}
    verb={ACTIONS[action].verb}
    destructive={ACTIONS[action].destructive}
    ids={selectedIds}
    noun="invoice"
    nounPlural="invoices"
    onCancel={() => setAction(null)}
    onDeleted={(result) => {
      const past = ACTIONS[action].past;
      setAction(null);
      selection.clear();
      showToast(
        `${past} ${result.deleted} invoice${result.deleted !== 1 ? "s" : ""}` +
          (result.skipped > 0 ? `, ${result.skipped} skipped` : "") +
          "."
      );
      router.refresh();
    }}
  />
)}
```

- [ ] **Step 6: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 7: Verify in the browser**

On `/invoices`, with a mix of statuses selected:
1. Mark as paid refuses drafts with the right reason and marks the rest paid; `/payments` shows the new rows.
2. Send reminders skips paid and draft invoices; emails arrive for the rest.
3. Duplicate creates one draft per selection with distinct numbers.
4. Download PDFs produces a zip.
5. Delete still behaves as it did after Task 7.
6. The bar and its dropdown are usable at a narrow viewport and in dark mode.

- [ ] **Step 8: Commit**

```bash
git add src/components/invoices/InvoicesTable.tsx src/components/ui/BulkDeleteDialog.tsx
git commit -m "feat: add quick actions to the invoices bulk bar"
```

---

## Part 2 self-review

- Mark as paid is server-side only, satisfying the `CLAUDE.md` rule — Task 13.
- The pre-existing frontend violation in `RecordPaymentModal` is called out and deliberately left — see the note at the top of Part 2.
- Reminders go through `sendTransactionalEmail`, so `email_logs` is written — Task 14.
- Duplicate numbers are generated sequentially to avoid unique-constraint collisions — Task 15.
- PDF extraction is committed separately from the bulk feature, so a regression is easy to bisect — Task 16.
- Every new route validates with Zod, scopes by `org_id`, and writes audit logs.
- Task 11's docs step covers Part 1 only; the docs update there should be extended to name these actions too.
