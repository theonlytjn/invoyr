---
title: INV-002 Target Architecture
version: 1.0
status: Foundation
owner: Engineering
last_updated: 2026-06-19
---

# INV-002 — Target Architecture

## 1. Target repository structure

```txt
invoyr/
  docs/
    INV-000-product-constitution.md
    INV-001-current-state-audit.md
    INV-002-target-architecture.md
    INV-003-communication-resend-system.md
    INV-004-implementation-roadmap.md
  public/
  src/
    app/
      (public)/
      (auth)/
      (app)/
      api/
    components/
      ui/
      layout/
      data-display/
      forms/
      feedback/
    features/
      auth/
      organisations/
      onboarding/
      dashboard/
      clients/
      invoices/
      payments/
      reports/
      settings/
      billing/
      communications/
    emails/
      components/
      layouts/
      transactional/
      marketing/
      registry.ts
    lib/
      supabase/
      stripe/
      resend/
      permissions/
      audit/
      validation/
      formatting/
    hooks/
    types/
    config/
    styles/
  supabase/
    migrations/
    seed.sql
  tests/
  scripts/
  CLAUDE.md
  AGENTS.md
  README.md
```

## 2. Route groups

### Public marketing site

```txt
src/app/(public)/page.tsx
src/app/(public)/features/page.tsx
src/app/(public)/pricing/page.tsx
src/app/(public)/use-cases/page.tsx
src/app/(public)/contact/page.tsx
```

### Authentication

```txt
src/app/(auth)/login/page.tsx
src/app/(auth)/signup/page.tsx
src/app/(auth)/forgot-password/page.tsx
src/app/(auth)/reset-password/page.tsx
```

### App workspace

```txt
src/app/(app)/dashboard/page.tsx
src/app/(app)/clients/page.tsx
src/app/(app)/clients/[clientId]/page.tsx
src/app/(app)/invoices/page.tsx
src/app/(app)/invoices/new/page.tsx
src/app/(app)/invoices/[invoiceId]/page.tsx
src/app/(app)/payments/page.tsx
src/app/(app)/reports/page.tsx
src/app/(app)/settings/page.tsx
```

### Public invoice view

```txt
src/app/invoice/[publicToken]/page.tsx
```

## 3. Data model principles

- Every organisation-owned table must include `org_id`.
- Users can belong to multiple organisations.
- Role checks must happen server-side.
- RLS must enforce organisation boundaries.
- Public invoice access must be token-based and scoped only to the public-safe invoice fields.
- Audit logs should be append-only.
- Email logs should capture template name, recipient, Resend ID and delivery status.

## 4. Payment architecture

Payment state must flow like this:

```txt
Client clicks Pay Now
→ Stripe Checkout / Payment Link
→ Stripe webhook received
→ Signature verified
→ Invoice/payment matched server-side
→ Payment record created
→ Invoice amount_paid updated
→ Invoice status recalculated
→ Receipt email queued/sent
→ Audit log written
```

Never mark an invoice as paid from the frontend.

## 5. Email architecture

Email files should be source-controlled and previewable.

```txt
src/emails/
  components/
    EmailShell.tsx
    EmailHeader.tsx
    EmailFooter.tsx
    EmailButton.tsx
    EmailCallout.tsx
    InvoiceSummary.tsx
  layouts/
    TransactionalLayout.tsx
    MarketingLayout.tsx
  transactional/
    WelcomeEmail.tsx
    VerifyEmail.tsx
    PasswordResetEmail.tsx
    InvoiceSentEmail.tsx
    PaymentReceivedEmail.tsx
    PaymentReminderEmail.tsx
    TrialEndingEmail.tsx
    TeamInviteEmail.tsx
  marketing/
    NewsletterEmail.tsx
    ProductUpdateEmail.tsx
    WinBackEmail.tsx
  registry.ts
  content.ts
```

## 6. API route standards

API routes should exist only where they are clearly needed, such as webhooks and public actions.

```txt
src/app/api/stripe/webhook/route.ts
src/app/api/resend/webhook/route.ts
src/app/api/invoices/[invoiceId]/pdf/route.ts
```

Use server actions for normal authenticated mutations where appropriate.

## 7. Feature module standard

Each feature should be organised like this:

```txt
src/features/invoices/
  actions.ts
  components/
  queries.ts
  schemas.ts
  types.ts
  utils.ts
  permissions.ts
```

## 8. Required foundation services

```txt
src/lib/supabase/server.ts
src/lib/supabase/client.ts
src/lib/stripe/server.ts
src/lib/resend/client.ts
src/lib/resend/send-email.ts
src/lib/permissions/require-org-role.ts
src/lib/audit/create-audit-log.ts
src/lib/formatting/currency.ts
src/lib/formatting/dates.ts
```

## 9. Environment variables

Create `.env.example` with:

```txt
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
EMAIL_FROM_TRANSACTIONAL=
EMAIL_FROM_MARKETING=
```

Do not commit real secrets.
