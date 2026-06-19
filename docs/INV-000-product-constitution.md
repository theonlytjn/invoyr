---
title: INV-000 Product Constitution
version: 1.0
status: Foundation
owner: Product / Engineering / Design
last_updated: 2026-06-19
---

# INV-000 — Invoyr Product Constitution

## 1. Product definition

Invoyr is a SaaS invoicing and payment platform for freelancers, agencies, studios and service businesses that need to create professional invoices, send them to clients, collect payment, track outstanding balances and manage customer records without using heavy accounting software.

Invoyr should feel fast, premium, simple and trustworthy. It should give small businesses the confidence of a mature finance system without the complexity of enterprise accounting software.

## 2. Primary users

### Freelancers
Need quick invoice creation, clean PDFs, reminders, payment links and simple records.

### Agencies and studios
Need client management, team access, branded invoices, recurring invoices, payment tracking and reporting.

### Service businesses
Need fast invoicing, clear payment status, overdue reminders, client history and reliable receipts.

## 3. Product promise

Invoyr helps businesses invoice faster, get paid sooner and stay in control of their client money.

## 4. Product principles

1. **Speed over complexity** — users should be able to create and send an invoice quickly.
2. **Clarity over clutter** — every dashboard, table, email and PDF should make payment status obvious.
3. **Trust over gimmicks** — finance workflows must be predictable, auditable and secure.
4. **Automation with control** — reminders and recurring invoices should save time without removing user oversight.
5. **Professional by default** — every invoice, email and receipt should make the user’s business look established.
6. **Small-business first** — avoid enterprise bloat until the core workflow is excellent.
7. **Developer-readable architecture** — every major feature must have docs, predictable structure and typed interfaces.

## 5. Design principles

- Invoyr should look like a premium finance SaaS: clean spacing, strong typography, calm colour usage and purposeful data visualisation.
- Data tables must be readable and action-focused.
- Forms must be clear, short where possible, and forgiving.
- Statuses must be consistent across UI, PDF, email and database.
- Empty states must explain what to do next.
- Mobile layouts must support key actions, especially viewing invoice status and client/payment records.

## 6. Engineering principles

- The database is the source of truth.
- Payments are never trusted from client-side state.
- Stripe webhooks and verified server-side events drive payment status.
- Supabase RLS is mandatory for organisation-scoped data.
- Every organisation-scoped table uses `org_id`.
- Every mutation validates input with Zod.
- Every feature is documented before broad implementation.
- Prefer incremental refactors over large unsafe rewrites.
- Claude Code must preserve working code unless explicitly replacing it with a documented improvement.

## 7. Communication principles

Every communication should be:

- clear
- professional
- concise
- branded
- useful
- action-oriented

Transactional emails must never feel spammy. Marketing emails must only go to users with consent and must include unsubscribe handling.

## 8. AI principles

AI should assist, not confuse. AI features must:

- reduce repetitive admin
- help write invoice notes, reminders and client messages
- explain financial status in plain English
- never change financial records without confirmation
- log meaningful automated actions

## 9. Security principles

- Never expose secret keys to the frontend.
- Never trust frontend payment status.
- Verify all webhooks.
- Use RLS for all user/organisation data.
- Keep audit logs for important actions.
- Preserve user data unless deletion is explicitly requested and confirmed.

## 10. What Invoyr should not become in v1

Invoyr v1 is not:

- a full accounting suite
- a payroll platform
- a tax filing platform
- a marketplace
- a CRM replacement for large sales teams
- a complicated automation builder

Those ideas can exist later, but v1 must focus on invoicing, payments, clients, basic reporting, reminders and subscription billing.
