---
title: INV-001 Current State Audit
version: 1.0
status: Foundation
owner: Product / Engineering
last_updated: 2026-06-19
---

# INV-001 — Current State Audit

## 1. Sources reviewed

- Public sitemap: `https://theonlytjn.github.io/invoyr-sitemap/`
- Live app domain: `app.invoyr.io`
- GitHub repository: `https://github.com/theonlytjn/invoyr`
- Uploaded files: `AGENTS.md`, `CLAUDE.md`, `README.md`

## 2. Current product blueprint

The sitemap already defines Invoyr as a SaaS invoicing platform for service businesses, freelancers and agencies. It maps the core stack as Next.js, Supabase, Stripe and Resend. The sitemap covers marketing pages, authentication, onboarding, dashboard, invoices, clients, recurring invoices, payments, reporting, email communications, settings, teams, SaaS billing, database schema, integrations, admin/system layer, security and phased roadmap.

This is a strong product blueprint. It is already much more complete than the current default app shell.

## 3. Current repository snapshot

The public repository currently contains:

```txt
public/
src/
supabase/
.gitignore
AGENTS.md
CLAUDE.md
README.md
components.json
middleware.ts
next.config.ts
package-lock.json
package.json
postcss.config.mjs
tsconfig.json
vercel.json
```

The repository appears to be a public Next.js project with TypeScript as the primary language and PLpgSQL present through Supabase SQL.

## 4. Current package stack

The dependency list already includes most of the right foundation:

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Supabase SSR and Supabase JS
- Stripe
- Resend
- React Email
- React PDF
- React Hook Form
- Zod
- Radix UI
- Recharts
- Lucide / HugeIcons

This means the repository is already prepared for the architecture described in the sitemap. The issue is not dependency readiness; the issue is implementation structure and depth.

## 5. Current app implementation

The homepage currently still appears to be the default create-next-app starter page. This means the product is not yet materially implemented in the public root route.

The layout metadata has been customised to Invoyr with title and description, which is a good early sign of brand direction.

## 6. Current database implementation

The Supabase schema already includes the core v1 tables and policies:

- profiles
- organisations
- org_members
- clients
- invoices
- invoice_items
- payments
- subscriptions
- audit_logs
- email_logs

It also includes helper functions, updated_at triggers and RLS policies for organisation-scoped access.

This is a strong starting point. However, before production use, the schema should be converted into versioned migrations and reviewed for payment, public invoice, role and email edge cases.

## 7. Current Claude/agent instructions

The current `AGENTS.md` contains an important warning that this Next.js version has breaking changes and that agents should inspect `node_modules/next/dist/docs/` before writing code.

The current `CLAUDE.md` only references `AGENTS.md`, so it is too light for the scale of Invoyr. It should be replaced with the expanded Invoyr-specific Claude rules included in this pack.

The current `README.md` is still the default create-next-app README. It should be replaced with an Invoyr-specific README that explains setup, environment variables, database setup, development standards and deployment.

## 8. Strengths

- Strong product sitemap exists.
- Stack is correctly chosen for the product.
- Dependencies already include Resend, React Email, Stripe, Supabase and React PDF.
- Supabase schema already covers core SaaS entities.
- RLS has already been considered.
- Repository is public and version controlled.
- The project is early enough to improve architecture without painful migration.

## 9. Gaps

### Product gaps

- No complete implementation of the marketing site or app shell visible from the root page.
- No documented product constitution inside the repo.
- No docs folder yet.
- No feature-level PRDs yet.

### Engineering gaps

- README is still generic.
- Claude instructions are too thin.
- Supabase schema appears as a single SQL file, not migration-first.
- No visible test strategy.
- No visible email template architecture yet.
- No visible feature-based folder structure yet.

### Communication gaps

- The sitemap identifies email requirements, but the repo needs a proper email design system, content files, template registry, send service, log handling and Resend webhooks.

## 10. Recommended next action

Do not build more product features yet.

First, commit this documentation pack into the repository. Then ask Claude Code to run an audit using the master prompt. After the audit, implement foundation tasks in this order:

1. Replace generic README.
2. Replace `CLAUDE.md` with Invoyr rules.
3. Add `/docs` foundation docs.
4. Create environment variable example.
5. Create feature-based folder structure.
6. Convert Supabase schema into migrations.
7. Build email system skeleton.
8. Build branded app shell.
9. Build auth/onboarding flow.
10. Build client and invoice MVP.

## 11. Addendum — Bulk actions on list views (August 2026)

Sections 1–10 above are a point-in-time snapshot from before implementation began and are left as originally written. This addendum records what shipped later: multi-select delete on the four record lists, plus a set of invoice-only quick actions layered on top.

### Bulk delete (invoices, estimates, expenses, clients)

All four list views — invoices, estimates, expenses, clients — now support multi-select delete through a shared selection UI (`useRowSelection`, `BulkActionBar`, `RowCheckbox`, `BulkDeleteDialog`). Each list posts to its own `POST .../bulk/delete` route (`/api/invoices/bulk/delete`, `/api/estimates/bulk/delete`, `/api/expenses/bulk/delete`, `/api/clients/bulk/delete`), and bulk delete is **ungated — available on every plan**, not behind the `bulk_invoice_actions` Business-plan feature.

Eligibility is decided server-side only, in pure functions in `src/lib/bulk-actions.ts` (unit tested):

- **Invoices** — deletable only when `status` is `draft` or `void`, only when the invoice has no payments, refunds or credit notes attached, and only when no estimate points at it via `converted_invoice_id`. Sent invoices are skipped with "void them instead". The estimate rule exists because conversion produces a *draft* invoice and the FK is `ON DELETE SET NULL`: deleting it would null the link, leave the estimate's status at `converted`, and silently make the estimate deletable too.
- **Estimates** — deletable unless `converted_invoice_id` is set.
- **Expenses** — deletable unless already billed onto an invoice (`invoice_id` set).
- **Clients** — deletable only with zero invoices, estimates and expenses; the rest are skipped with "archive them instead".

The same partition functions are applied by the single-record `DELETE /api/expenses/[id]` and `DELETE /api/estimates/[id]` handlers, which answer 409 with the skip reason — the row's own trash action cannot delete something the bulk bar refuses to touch.

On the invoices list specifically, the row checkboxes themselves are ungated for everyone. The pre-existing `canBulk` gate (the Business-plan `bulk_invoice_actions` feature) is unchanged: it gates Send, Void, Download PDFs and Send reminders. Delete, Export CSV, Mark as paid and Duplicate are available on every plan.

### Invoice quick actions

The invoices bulk bar was later extended with four more actions. Each is its own server route following the same pattern as bulk delete — Zod input validation, org-scoped queries, server-side eligibility, audit logging, a `{ deleted, succeeded, skipped, reasons }` response (`succeeded` is the honest name; `deleted` is kept as its alias for the shared dialog):

- `POST /api/invoices/bulk/mark-paid` — **ungated**. Records a real payment for each invoice's outstanding balance — `total + late_fee_amount − amount_paid − credit_applied`, the codebase's canonical formula, exported as `outstandingBalance()` from `src/lib/bulk-actions.ts` — and recomputes status server-side. Accepted methods are `bank_transfer`, `cash`, `cheque` and `other`; `stripe` is deliberately excluded because the Stripe webhook remains the source of truth for card payments.
- `POST /api/invoices/bulk/duplicate` — **ungated**. Creates a draft copy of each invoice, generating invoice numbers strictly sequentially to avoid colliding with the `unique (org_id, invoice_number)` constraint.
- `POST /api/invoices/bulk/remind` — **gated** on `bulk_invoice_actions`, because each call sends real email.
- `POST /api/invoices/bulk/pdf` — **gated**, because rendering is real compute. Its id cap is `MAX_BULK_PDF_IDS` (15) rather than the usual `MAX_BULK_IDS` (50), and it sets `maxDuration = 60`, because renders are sequential. It returns a zip rather than JSON, so it bypasses the usual confirmation dialog, and reports how many invoices actually rendered in an `X-Rendered-Count` header.

PDF rendering was extracted out of the single-invoice route into `src/lib/invoice-pdf.ts` so both the single and bulk routes share it. `renderInvoicePdf(invoiceId, ctx)` takes a request-scoped context built once by `buildInvoicePdfContext(supabase, org)`, carrying the org (resolved by `requireOrg()`, so the active-org cookie decides the branding), the trial watermark, the `white_label` branding flag and the pre-fetched logo.

### Decisions worth recording

- **Audit-write failures are logged, not fatal.** Every bulk route captures the `audit_logs` insert error and `console.error`s it, but still returns 200 — the records are already changed by that point, so a 500 would misreport what happened. This deliberately diverges from the older `src/app/api/invoices/bulk/void/route.ts`, which discards the error entirely.
- **Secondary lookup queries fail closed.** The invoice route's payments/refunds/credit-notes check and the client route's invoices/estimates/expenses check abort with a 500 if any lookup errors, rather than treating a null result as "nothing linked" — a false negative there would have permanently deleted a referenced client or a paid invoice.
- **Accepted limitation: no transactions.** Routes that perform two writes — notably the invoice bulk delete route, which clears billed expenses (`invoice_id` and `invoiced_at` set to null) before deleting the invoice — are not wrapped in a database transaction. A transient failure between the two writes leaves the affected expenses unbilled while their invoice still exists; retrying the delete heals it. This was accepted deliberately rather than introducing a Postgres function, and the same trade-off applies to any future bulk route that performs more than one write.
- **One batch cap, one dedupe.** `MAX_BULK_IDS` (50) lives in `src/lib/bulk-actions.ts` and is used by both halves: every bulk route's Zod schema via `bulkIdsSchema()` in `src/lib/bulk-request.ts`, and each list's "select all", which takes at most that many and says "First 50 selected" when it capped. `bulkIdsSchema` also dedupes, so a repeated id is not mis-reported by `summarise` as a record that could not be found.
- **Batch resilience.** The remind, duplicate and PDF routes survive a per-item failure: they continue the batch, report accurate success and failure counts, and never 500 mid-loop.
- **Known pre-existing violation, not fixed here.** `src/components/invoices/RecordPaymentModal.tsx` still writes payment and status from the browser, contrary to the `CLAUDE.md` rule that invoices must not be marked paid from the frontend. The new bulk mark-as-paid route is compliant — it computes and writes status server-side — but this pre-existing component was explicitly left out of scope for this work. It remains open as a follow-up.

  **Update, September 2026 — resolved.** See the addendum below: `RecordPaymentModal` no longer writes to Supabase at all.

## 12. Addendum — Bulk edit, client deletion and payment write-off (September 2026)

This addendum records three further pieces of work layered on top of §11: bulk edit on expenses, client deletion (which changes behaviour recorded above), and server-side payment recording with an optional write-off.

### Bulk edit on expenses

`POST /api/expenses/bulk/update` (ungated, every plan) edits `category`, `client_id` and `is_billable` across selected expenses in one request. All three fields are tri-state on the wire: a field absent from the request body means *leave this column unchanged*; `client_id` sent explicitly as `null` means *clear the link*. This distinction is why the route's Zod schema has no `.default()` on any of the three fields — a default would collapse "not sent" and "sent as null" into the same value. Eligibility reuses the same rule bulk delete already applies to expenses: a row already billed to an invoice (`invoice_id` set) is skipped, via a new `partitionExpenseEdit` function in `src/lib/bulk-actions.ts` alongside the existing `partitionExpenses`. As with every other bulk route in §11, a dry run (`dryRun: true`) returns the eligible/skipped counts and reasons with no write, and a real update logs one `audit_logs` row per changed expense before returning.

### Client deletion supersedes the archive-only rule above

§11 recorded that clients were deletable only with zero linked invoices, estimates and expenses — "the rest are skipped with 'archive them instead'." **That rule no longer holds.** `partitionClients` now accepts every client unconditionally; the linked-records check that used to gate deletion still runs, but only to produce counts for the confirmation dialog, not to block anything.

This was possible because of what previously made deletion unsafe: `invoices.client_id` and `estimates.client_id` are `ON DELETE SET NULL`, and neither table stored the client's own billing details — deleting a client stripped name, address and VAT number from every historical document referencing it, including paid invoices and the page a customer pays from. Two new nullable `client_snapshot jsonb` columns — one on `invoices`, one on `estimates` — close that gap. `POST /api/clients/bulk/delete` writes a snapshot (`buildClientSnapshot`, from `src/lib/client-snapshot.ts`) to both tables, scoped to the client being deleted, immediately before deleting it. Five render surfaces resolve a document's client through the paired `resolveDocumentClient` helper, which prefers the live join and falls back to the snapshot once it's gone: the invoice PDF (`src/lib/invoice-pdf.ts`, feeding all four templates), the invoice detail page, the estimate detail page, and both public token pages (`/pay/[token]`, `/estimate/[token]`).

**The route fails closed.** The snapshot writes for a given client run before its row is deleted; if either write errors, the route returns 500 immediately and the delete is never reached. There is no single-client `DELETE` route for clients — deletion is bulk-only, exercised from the clients list with one or many rows selected — and archive remains the reversible alternative, named explicitly in the confirmation copy whenever anything is linked.

**Known limitation, no transactions**, same as every other multi-write bulk route in this document: the snapshot writes and the delete itself are not wrapped in a database transaction (the Supabase JS client has no primitive for it). The ordering — snapshot before delete, and fail closed on a snapshot error — is the safeguard in place of a transaction.

### Server-side payment recording with write-off

New `POST /api/invoices/[id]/record-payment` records a payment against an invoice, recomputes `amount_paid`/`status`/`paid_at` from it, and — when `writeOffRemainder` is set and a balance survives the payment — issues a credit note for exactly that remainder via a shared `createCreditNote` (extracted from the existing `/credit-notes` route into `src/lib/credit-notes.ts` so both routes share one implementation rather than two copies of the arithmetic). The balance itself is computed by `outstandingBalance()` (`total + late_fee_amount − amount_paid − credit_applied`, exported from `src/lib/bulk-actions.ts`, the same formula §11 already established as canonical for the bulk mark-paid route) — never re-derived inline. An invoice update uses a compare-and-swap on `amount_paid` (`.eq("amount_paid", invoice.amount_paid)`) so two concurrent payments on the same invoice can't silently clobber each other; the loser gets a 409 and its own distinct audit action (`payment.invoice_update_conflict`) rather than a misleadingly normal-looking `payment.recorded` entry.

This closes the violation §11 flagged above. `RecordPaymentModal.tsx` no longer imports or calls Supabase at all — it is a thin form that posts to `record-payment` and renders whatever the server reports back, including the credit note's actual number and amount (not a client-side prediction of what the write-off would be).

**Known limitation, no transactions.** Neither `record-payment` nor `createCreditNote` can wrap their writes in a transaction, for the same reason as everywhere else in this document. Both were ordered deliberately to fail in the safer direction: the `payments` row is written before the invoice rollup, and the `credit_notes` row before its own invoice rollup, so a failure between steps leaves more evidence of what happened rather than an aggregate figure claiming something that never occurred. A failed write-off after a successful payment surfaces as a 500 naming both facts ("Payment recorded, but the write-off failed") rather than being swallowed, and every path following a committed payment — clean success, the update error, the CAS conflict, and a write-off failure — writes an audit row before it can return.

### Behaviours that will otherwise look like bugs

- **The `client_snapshot` schema change was applied to the live database by hand.** Both columns, on `invoices` and `estimates`, nullable jsonb. This project has no migration pipeline (§9, "Supabase schema appears as a single SQL file, not migration-first" — still true) and drift between `supabase/schema.sql` and production has caused problems before, so the fact that this one was applied manually — and mirrored into `schema.sql` — matters to whoever reads this next.
- **After a client is deleted, the send/remind/checkout routes find no client and skip that invoice.** `src/app/api/invoices/[id]/send/route.ts`, `.../bulk/send`, `.../[id]/remind`, `.../bulk/remind`, `src/app/api/estimates/[id]/send/route.ts` and `src/app/api/payments/checkout/route.ts` all join `clients(*)` directly (no snapshot fallback) and already skip/decline when the join comes back empty, because they need a live email address to send to. This is correct — a deleted client should not receive email, and a snapshot has no inbox — but it will read as a regression to anyone who deletes a client and then notices reminders stop, so it's recorded here rather than left to be filed as a bug.
