---
title: INV-004 Implementation Roadmap
version: 1.0
status: Foundation
owner: Product / Engineering
last_updated: 2026-06-19
---

# INV-004 — Implementation Roadmap

## Phase 0 — Audit and stabilise

1. Add `/docs` folder.
2. Replace `CLAUDE.md` with Invoyr-specific rules.
3. Replace generic README.
4. Create `.env.example`.
5. Confirm app builds locally.
6. Confirm Supabase schema applies cleanly.
7. Confirm Vercel deployment pipeline.

## Phase 1 — Foundation app shell

1. Create design tokens.
2. Create app layout components.
3. Create public marketing layout.
4. Create authenticated app shell.
5. Create navigation.
6. Create empty dashboard.
7. Create loading/error/empty state components.

## Phase 2 — Auth and onboarding

1. Supabase auth email/password.
2. Google OAuth.
3. Profile creation.
4. Organisation creation.
5. Branding step.
6. Financial settings step.
7. First client step.
8. First invoice step.

## Phase 3 — Core client + invoice MVP

1. Client CRUD.
2. Invoice list.
3. Invoice builder.
4. Invoice line items.
5. VAT calculations.
6. Invoice status flow.
7. Public invoice token page.
8. PDF generation.
9. Send invoice email.

## Phase 4 — Payments

1. Stripe Connect or Stripe account setup decision.
2. Stripe Checkout/payment link per invoice.
3. Stripe webhook handler.
4. Payment record creation.
5. Invoice payment status recalculation.
6. Receipt generation.
7. Receipt email.
8. Audit logging.

## Phase 5 — Resend communication system

1. React Email components.
2. Transactional email templates.
3. Email registry.
4. Central send service.
5. Email logs.
6. Resend webhook handler.
7. Marketing consent table.
8. Basic lifecycle emails.

## Phase 6 — SaaS billing

1. Plans: Starter, Business, Pro.
2. Trial state.
3. Stripe subscription checkout.
4. Stripe billing portal.
5. Subscription webhook sync.
6. Subscription gating middleware.
7. Trial ending emails.
8. Payment failed emails.

## Phase 7 — Reports and polish

1. Dashboard metrics.
2. Revenue by month.
3. Outstanding invoice totals.
4. Overdue ageing.
5. Top clients.
6. CSV export.
7. Mobile polish.
8. Accessibility pass.
9. Performance pass.

## Phase 8 — Launch readiness

1. Production env audit.
2. Security review.
3. RLS review.
4. Webhook verification review.
5. Email domain verification.
6. Test payments.
7. Trial/billing tests.
8. GDPR basics: export/delete path.
9. Launch checklist.
