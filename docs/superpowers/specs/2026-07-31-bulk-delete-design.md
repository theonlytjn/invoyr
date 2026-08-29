# Bulk delete across list views — design

**Date:** 2026-07-31
**Status:** Approved, ready for implementation planning

## Problem

Invoices are the only list with multi-select (`src/components/invoices/InvoicesTable.tsx`), offering
bulk Send, Export CSV and Void. There is no way to delete anything in bulk, and no delete route for
invoices or clients at all. Clearing out abandoned drafts, dead estimates or mistaken expenses means
deleting them one at a time, or not at all.

## Goal

Multi-select delete on the four org-scoped list views: invoices, estimates, expenses, clients.
Available on every plan. Destructive actions must never silently destroy financial records.

## Non-goals

- Soft delete, a `deleted_at` column, a trash view, or undo. Deletion is permanent, matching every
  other delete in the app.
- Bulk actions other than delete on the three lists that have none today.
- Changing the existing plan gate on bulk Send and Void.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Scope | Invoices, estimates, expenses, clients | All four asked for |
| Invoice eligibility | `draft` and `void` only | Issued/sent/paid invoices are financial records; Void already exists as the cancel path |
| Client eligibility | Only clients with no linked records | Deleting a referenced client silently orphans its invoices |
| Plan gating | None | Clearing your own drafts is not a premium feature |
| Confirmation | Shared dialog with a delete/skip breakdown | "Delete 7" usually means "delete 3, skip 4"; a native `confirm()` cannot express that |

## Architecture

### Shared primitives

Four lists need the same machinery, so it is built once rather than copied. This also removes the
selection logic currently inlined in `InvoicesTable`.

- **`src/hooks/useRowSelection.ts`** — owns a `Set<string>` of selected ids. Exposes `selected`,
  `count`, `toggleOne(id)`, `toggleAll(visibleIds)`, `clear()`, `allSelected(visibleIds)`.
  `toggleAll` operates on the currently visible (search-filtered) ids only; selections made before a
  search are preserved, which is the behaviour `InvoicesTable` has today.
- **`src/components/ui/BulkActionBar.tsx`** — the dark bar from `InvoicesTable:134`, extracted.
  Props: `count`, `children` (the action buttons), `onClear`. Renders "N selected", the actions, and
  a right-aligned Clear.
- **`src/components/ui/BulkDeleteDialog.tsx`** — built on the existing `dialog.tsx`. Props:
  `open`, `deletableCount`, `skips: { count: number; reason: string }[]`, `busy`, `onConfirm`,
  `onCancel`. Renders a heading naming the deletable count, one plain sentence per skip reason, and
  a destructive confirm button. When `deletableCount` is 0 the confirm is disabled and the dialog
  explains why nothing can be deleted.
- **`RowCheckbox`** — the repeated `<input type="checkbox">` plus its class string as one component,
  with a required `aria-label`.

### API routes

One route per resource, all `POST`:

```
/api/invoices/bulk/delete
/api/estimates/bulk/delete
/api/expenses/bulk/delete
/api/clients/bulk/delete
```

Each follows the shape of the existing `src/app/api/invoices/bulk/void/route.ts`:

1. `supabase.auth.getUser()` — 401 if absent.
2. `requireOrg()`.
3. Zod: `{ ids: z.array(z.string().uuid()).min(1).max(50) }` — 400 on failure.
4. Select candidate rows filtered by `.in("id", ids).eq("org_id", org.id)`. Rows belonging to another
   org simply do not come back and are counted as skipped.
5. Partition into eligible and skipped using the rules below. **Eligibility is decided server-side.**
   The client's copy of the rules exists only to populate the dialog preview.
6. Delete the eligible ids in one `.in("id", eligibleIds)` call.
7. Insert one `audit_logs` row per deleted record.
8. Return `{ deleted: number, skipped: number, reasons: { count, reason }[] }`.

No `orgHasFeature` check — these routes are ungated.

### Eligibility rules

**Invoices** — deletable when `status` is `draft` or `void`, **and** the invoice has no rows in
`payments`, `refunds` or `credit_notes`. The payment check matters even for void invoices:
`payments.invoice_id`, `refunds.invoice_id` and `credit_notes.invoice_id` are all
`on delete cascade`, so deleting a void invoice that was partly paid before being voided would
destroy the payment records with no warning.

Skip reasons: `"{n} invoices have been sent — void them instead"`, `"{n} invoices have payments or
credit notes attached"`.

Cascades that are intended and require no extra work: `invoice_items`, `invoice_attachments`.

One cleanup is required: `expenses.invoice_id` is `on delete set null`, so an expense billed onto a
deleted invoice would keep `invoiced_at` set while pointing at nothing, leaving it permanently marked
as billed. Before deleting invoices, clear `invoiced_at` (and let `invoice_id` null out) on any
expenses referencing them.

**Estimates** — deletable unless `converted_invoice_id` is set. A converted estimate is the origin
record of a live invoice.

Skip reason: `"{n} estimates have been converted to invoices"`.

Cascade: `estimate_items`.

**Expenses** — deletable unless `invoice_id` is set (already billed onto an invoice).

Skip reason: `"{n} expenses have been billed to an invoice"`.

**Clients** — deletable only when the client has zero rows in `invoices`, `estimates` and `expenses`.
All three FKs are `on delete set null`, so deleting a referenced client would leave historical
invoices rendering as "No client" with no way to recover the name.

Skip reason: `"{n} clients have invoices or expenses — archive them instead"`. Archive already exists
(`ClientArchiveButton.tsx`).

### Audit logging

Every deletion writes an `audit_logs` row, so a hard delete still leaves a trail:

| Resource | `action` | `entity_type` | `meta` |
| --- | --- | --- | --- |
| Invoice | `invoice.deleted` | `invoice` | `{ invoice_number, status, bulk: true }` |
| Estimate | `estimate.deleted` | `estimate` | `{ estimate_number, bulk: true }` |
| Expense | `expense.deleted` | `expense` | `{ title, amount, bulk: true }` |
| Client | `client.deleted` | `client` | `{ name, bulk: true }` |

## UI changes per list

**`InvoicesTable.tsx`** — replace the inlined selection state with `useRowSelection`, swap the bar
for `BulkActionBar`, add a Delete action. **Ungate the checkboxes**: `canBulk` currently hides the
entire selection column, and now controls only whether Send and Void appear. Free-plan users get
checkboxes, Delete and Export CSV.

**`ClientsTable.tsx`** (95 lines) — add the checkbox column, `useRowSelection`, and a bar with
Delete. Selection is independent of the existing archived/unarchived filter.

**`ExpensesList.tsx`** (442 lines) — add selection to the existing row rendering and a bar with
Delete. The file is already large; add only what the feature needs and do not restructure it.

**Estimates** — `src/app/(app)/estimates/page.tsx` renders its table inline in a server component.
Extract the table into `src/components/estimates/EstimatesTable.tsx` as a client component taking
the estimates array, matching the shape of `InvoicesTable`, then add selection. The page keeps its
data fetching.

## States

- **Loading** — during the request, the dialog's confirm shows a busy label and the bar's buttons are
  disabled.
- **Success** — selection cleared, dialog closed, toast reports the outcome
  (`Deleted 3 invoices, 4 skipped`), `router.refresh()`.
- **Partial** — same path; the toast always names the skipped count when it is non-zero.
- **Nothing eligible** — dialog opens with confirm disabled and the skip reasons shown, so the user
  learns why rather than seeing a no-op.
- **Error** — toast carries the server message, selection is preserved so the action can be retried.
- **Empty list** — unchanged; the bar only renders when the count is above zero.

## Testing

- Server-side eligibility per resource, including the case where the client sends an ineligible id
  directly.
- Cross-org ids are rejected (counted as skipped, never deleted).
- A void invoice with a payment attached is skipped.
- Deleting an invoice clears `invoiced_at` on expenses that referenced it.
- `useRowSelection`: `toggleAll` over a filtered subset leaves prior selections intact.

## Documentation

Update `docs/INV-001-current-state-audit.md` where it describes the list views and bulk actions.
