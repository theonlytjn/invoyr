# Claude Code Master Prompt — Invoyr OS v1.0 Foundation

You are working in the Invoyr repository.

Your job is to turn the current Invoyr project into a properly documented, scalable SaaS codebase using the Invoyr OS v1.0 foundation docs.

## Context

Invoyr is a SaaS invoicing platform for freelancers, agencies, studios and service businesses. The intended stack is:

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase Auth/Postgres/RLS/Storage
- Stripe
- Resend
- React Email
- React PDF
- Vercel

The current repo is early-stage. Preserve working code, but replace generic starter content and create a scalable foundation.

## Mandatory first steps

1. Read `AGENTS.md`.
2. Read `CLAUDE.md`.
3. Read every file in `/docs`.
4. Inspect the installed Next.js documentation in `node_modules/next/dist/docs/` before using Next.js APIs.
5. Audit the current file tree before making changes.
6. Create a short implementation plan before editing.

## Mode 1 — Audit first

Before implementation, produce `docs/INV-005-claude-code-audit.md` with:

- current folder structure
- current dependencies
- current routes
- current Supabase schema files
- current middleware behaviour
- current gaps against `INV-000` to `INV-004`
- recommended safe implementation order

Do not make destructive changes during audit mode.

## Mode 2 — Foundation implementation

After audit mode, implement these tasks:

### 1. Documentation

- Ensure `/docs` exists.
- Keep `INV-000` to `INV-004`.
- Add `docs/README.md` as documentation index.

### 2. README

Replace the generic create-next-app README with an Invoyr-specific README including:

- product summary
- stack
- local setup
- environment variables
- Supabase setup
- Stripe setup
- Resend setup
- scripts
- deployment notes
- documentation links

### 3. Environment

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

Do not create or commit real secrets.

### 4. App structure

Create or align this structure:

```txt
src/app/(public)
src/app/(auth)
src/app/(app)
src/app/api
src/components/ui
src/components/layout
src/features
src/emails
src/lib
src/config
src/types
```

### 5. Design foundation

Create:

```txt
src/config/brand.ts
src/config/navigation.ts
src/components/layout/PublicLayout.tsx
src/components/layout/AppShell.tsx
src/components/layout/AppSidebar.tsx
src/components/layout/AppHeader.tsx
```

Use a premium SaaS feel: clean, calm, spacious, finance-focused.

### 6. Email/Resend foundation

Create:

```txt
src/emails/components/EmailShell.tsx
src/emails/components/EmailHeader.tsx
src/emails/components/EmailFooter.tsx
src/emails/components/EmailButton.tsx
src/emails/components/EmailCard.tsx
src/emails/components/InvoiceSummary.tsx
src/emails/layouts/TransactionalLayout.tsx
src/emails/layouts/MarketingLayout.tsx
src/emails/transactional/WelcomeEmail.tsx
src/emails/transactional/VerifyEmail.tsx
src/emails/transactional/PasswordResetEmail.tsx
src/emails/transactional/InvoiceSentEmail.tsx
src/emails/transactional/PaymentReceivedEmail.tsx
src/emails/transactional/PaymentReminderEmail.tsx
src/emails/transactional/OverdueReminderEmail.tsx
src/emails/transactional/TrialEndingEmail.tsx
src/emails/transactional/PaymentFailedEmail.tsx
src/emails/transactional/TeamInviteEmail.tsx
src/emails/registry.ts
src/emails/preview-data.ts
src/lib/resend/client.ts
src/lib/resend/send-transactional-email.ts
src/app/api/resend/webhook/route.ts
```

Rules:

- Use React Email.
- Use typed props.
- Use shared email components.
- Do not hardcode all copy inside layout components.
- Log transactional emails to `email_logs`.
- Marketing emails require consent before sending.

### 7. Supabase

Do not destroy the existing schema.

If the schema currently exists as one large SQL file, create a migration plan:

```txt
supabase/migrations/
```

Add a document explaining how to move from the single schema file into migrations safely.

### 8. Build/test

Run:

```bash
npm run build
```

If build fails, fix the issue or document exactly why it failed.

## Output required

When complete, provide:

1. Summary of files created/changed.
2. Build result.
3. Any unresolved issues.
4. Next recommended task.

## Hard rules

- Do not delete working code without explanation.
- Do not expose secrets.
- Do not skip RLS concerns.
- Do not mark invoices as paid from frontend code.
- Do not create separate visual styles for every page.
- Do not send marketing emails without consent/unsubscribe flow.
- Do not ignore `AGENTS.md`.
