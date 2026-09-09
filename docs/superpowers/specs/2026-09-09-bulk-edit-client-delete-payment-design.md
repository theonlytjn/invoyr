# Bulk edit, client deletion, and payment write-off — design

**Date:** 2026-09-09
**Status:** Approved, ready for implementation planning
**Builds on:** `docs/superpowers/specs/2026-07-31-bulk-delete-design.md` and the machinery shipped on `feat/bulk-actions`

## Problem

Three requests, from using the app:

1. Re-categorising imported bank transactions is a row-by-row chore. There is no way to edit records in bulk.
2. Clients can only be archived, never deleted. A client created by mistake stays forever.
3. Recording a part payment and forgiving the remainder takes two disconnected steps, and the record-payment modal offers no route to a credit note at all.

## Goals

- Bulk edit for expenses: category, client, billable.
- Real client deletion, with a warning that states the consequences accurately — and without destroying the paperwork.
- A single action that records a payment and writes off whatever remains.

## Non-goals

- Bulk edit on invoices, estimates or clients. Expenses first; extend once the pattern is proven.
- Editing any field that affects money or status — amounts, totals, invoice status, payment state.
- Replacing archive. It stays as the reversible option.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Bulk edit scope | Expenses only: category, client, billable | The actual chore, and none of these fields touch financial totals |
| Bulk edit eligibility | Same dry-run/skip pattern as delete | Reuses shipped machinery; one rule per record type, consistently explained |
| Billed expenses | Skipped, same as delete | Already invoiced; changing their client or billable flag would contradict the invoice |
| Client deletion | Snapshot billing details onto documents, then delete | Without it, deleting a client silently breaks every historical invoice PDF |
| Payment write-off | Server-side route doing payment + credit note | Closes the standing `CLAUDE.md` violation rather than deepening it |
| Branch | New branch off `feat/bulk-actions` | Reuses its shared code; stays separately reviewable while that branch is untested |

---

## 1. Bulk edit on expenses

### Route

`POST /api/expenses/bulk/update`, following the shape every bulk route on `feat/bulk-actions` already uses: auth → `requireOrg()` → `bulkIdsSchema` (dedupe + `MAX_BULK_IDS` cap) → org-scoped fetch → partition → apply → audit → `{ succeeded, deleted, skipped, reasons }`.

Ungated, like the other expense actions.

Request body extends the shared ids schema with three **tri-state** fields:

```ts
// The eight category values, matching the DB check constraint on expenses.category.
// Derive them from EXPENSE_CATEGORIES in src/components/expenses/expense-config.ts
// rather than retyping the list, so the two cannot drift.
category: z.enum(["travel","software","office","meals","marketing","professional","equipment","other"]).optional(),
client_id: z.string().uuid().nullable().optional(),     // absent = unchanged; null = clear
is_billable: z.boolean().optional(),                    // absent = leave unchanged
```

Absent means *leave unchanged*; an explicit `null` on `client_id` means *clear it*. The route must reject a request where all three are absent — a no-op edit is a client bug, not a valid request.

`client_id`, when set, must belong to the caller's org. Verify it rather than trusting the body; a foreign client id would otherwise link expenses across orgs.

### Eligibility

New `partitionExpenseEdit(rows)` in `src/lib/bulk-actions.ts`, pure and unit-tested alongside the others. The rule matches delete: **an expense with `invoice_id` set is skipped**, reusing the established reason wording ("N expenses have been billed to an invoice"). One rule per record type, so the product is explainable.

### UI

The expenses bulk bar gains an **Edit** action beside Delete.

`BulkDeleteDialog` is a confirmation surface, not a form. Rather than bending it further — it already carries four optional props for the invoices list — this gets its own `BulkEditExpensesModal`:

- Three controls, each defaulting to "Leave unchanged".
- On open, a dry run against the same endpoint, so the user sees "12 will update, 3 skipped because they've been billed" before committing.
- Confirm disabled until at least one field is set to something.
- Loading, nothing-eligible, busy and error states, matching the delete dialog's behaviour.
- On success: refresh via `fetchExpenses()` (this list owns its rows in local state — `router.refresh()` would not update it), clear the selection, toast the outcome.

---

## 2. Client deletion with a billing snapshot

### The problem this solves

`invoices.client_id` and `estimates.client_id` are `ON DELETE SET NULL`, and **neither table stores any snapshot of the client's details**. Both the PDF renderer (`src/lib/invoice-pdf.ts`) and the invoice detail page read name, address and VAT number from a live join to `clients`. Deleting a client therefore strips the billing details from every historical document — including paid invoices — not merely the link.

### Schema

Add to `invoices` and `estimates`:

```sql
alter table public.invoices  add column if not exists client_snapshot jsonb;
alter table public.estimates add column if not exists client_snapshot jsonb;
```

The snapshot holds the fields the documents render: `name`, `company_name`, `email`, `phone`, `address_line1`, `address_line2`, `city`, `postcode`, `country`, `vat_number`.

**Apply to the live database by hand** and update `schema.sql` in the same change — this project has no migration pipeline, and drift here is a documented, recurring failure.

### Resolution helper

`resolveDocumentClient(record)` in `src/lib/client-snapshot.ts`: returns the joined client when present, otherwise reconstructs from `client_snapshot`, otherwise null. Pure, so it can be tested without a database.

Used by `src/lib/invoice-pdf.ts` and the invoice detail page. Anywhere else that renders client details on an invoice or estimate should use it too — audit the call sites during implementation rather than assuming these two are the only ones.

### Eligibility change

`partitionClients` currently skips any client with linked records. It changes to report them rather than refuse them: linked clients become deletable, and the route returns the counts so the dialog can warn precisely.

This reverses the earlier "block, offer archive" decision deliberately, now that the snapshot makes deletion non-destructive to the paperwork.

### Route

`POST /api/clients/bulk/delete` gains, before deleting:

1. Fetch the client's full details.
2. Write `client_snapshot` onto their invoices and estimates.
3. Verify the snapshot write succeeded — **fail closed** if it errors, matching the existing rule for secondary queries in these routes. Deleting after a failed snapshot is the exact data loss this design exists to prevent.
4. Delete. The FKs null the links.

Expenses reference clients too but render no billing details, so they need no snapshot — their `client_id` simply nulls.

### UI

The confirmation states the real consequence with real numbers:

> **Delete Globex?**
> Globex has 12 invoices and 3 estimates. Their billing details will be kept on those documents, but they will no longer be linked to a client record. This cannot be undone.
> *Archive instead if you only want to hide them from your list.*

A client with no linked records gets the plain form with no warning. The dialog must not claim "cannot be undone" and then also imply the data survives — say both things plainly, because both are true.

---

## 3. Record a payment and write off the remainder

### Route

New `POST /api/invoices/[id]/record-payment`:

```ts
{ amount: number, method: PaymentMethod, reference?: string, paidAt?: string, writeOffRemainder?: boolean }
```

Server-side it inserts the payment, recomputes `amount_paid` and status, and — when `writeOffRemainder` is true and a balance remains — issues a credit note for exactly that balance.

Balance uses `outstandingBalance()` from `src/lib/bulk-actions.ts`, the canonical formula (`total + late_fee_amount − amount_paid − credit_applied`) that the final review established. Do not recompute it inline; that divergence was the critical bug on the previous branch.

Credit note creation must reuse the existing logic in `src/app/api/invoices/[id]/credit-notes/route.ts` — numbering from `organisations.next_credit_note_number`, the `credit_applied` update, the audit row. Extract the shared part rather than duplicating it, so the two paths cannot drift.

Accepted methods are the full database enum: `bank_transfer`, `stripe`, `cash`, `cheque`, `other` — matching what `RecordPaymentModal` offers today. **This deliberately differs from the bulk mark-paid route, which excludes `stripe`.** The distinction: recording one payment is a considered human action on a known invoice, where "the client paid via a Stripe link I sent manually" is legitimate; asserting Stripe payments across fifty invoices at once is not. Moving this path server-side must not quietly remove an option users have today.

### Closing the standing violation

`src/components/invoices/RecordPaymentModal.tsx` currently inserts the payment row and sets `status: 'paid'` **from the browser**, contrary to the `CLAUDE.md` rule that invoices must not be marked paid from the frontend. It becomes a thin form posting to the new route.

This closes a violation that has been knowingly deferred twice. Keep the modal's existing fields and behaviour otherwise — this is a move, not a redesign.

### UI

One checkbox below the amount, visible only when the entered amount is less than the outstanding balance:

> ☐ Write off the remaining £200.00 as a credit note

The figure updates as the amount changes. When ticked, the confirm button reads "Record payment & write off". On success the toast says what happened to both parts.

---

## States

Every new surface carries loading, empty, success and error states, is responsive and dark-mode aware, and validates on the server with Zod. Every mutation writes an `audit_logs` row, capturing and logging the audit error without failing the request — the pattern established across `feat/bulk-actions`.

## Testing

Unit tests, in the style already established for `bulk-actions.ts`:

- `partitionExpenseEdit`: billed expenses skipped, both grammatical forms of the reason pinned.
- `resolveDocumentClient`: live client wins; snapshot used when the link is null; null when neither exists.
- The tri-state semantics: absent leaves a field unchanged, explicit null clears the client.
- Write-off amount equals `outstandingBalance` after the payment is applied, with a late fee and with a credit already applied.

The previous branch's biggest gap was that no test covered a route. At minimum, the write-off amount calculation must be tested as a pure function, since that is where the equivalent bug appeared last time.

## Documentation

Record all three features in `docs/development-status.md`, and note in `docs/INV-001-current-state-audit.md` §11 that client deletion now supersedes the archive-only behaviour described there.
