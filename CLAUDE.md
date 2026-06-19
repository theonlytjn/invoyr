# CLAUDE.md — Invoyr Build Rules

You are working inside the Invoyr repository.

Before writing or changing code:

1. Read `AGENTS.md`.
2. Read `docs/INV-000-product-constitution.md`.
3. Read `docs/INV-001-current-state-audit.md`.
4. Read the relevant feature document before touching a feature.
5. Inspect the installed Next.js documentation in `node_modules/next/dist/docs/` before using Next.js APIs, routing, server actions, middleware, metadata, caching or forms.

## Non-negotiable engineering rules

- Do not duplicate components.
- Do not hardcode brand colours outside the design token layer.
- Do not hardcode email copy inside rendering components; use content/config files.
- Do not mark invoices as paid from the frontend.
- Stripe webhooks and server-side payment verification are the source of truth for payment state.
- Supabase RLS must protect every organisation-scoped table.
- All organisation data must be scoped by `org_id`.
- All new server logic must validate input with Zod.
- All new user-facing forms must have loading, empty, success and error states.
- All new pages must be responsive, accessible and dark-mode aware.
- All transactional emails must be logged in `email_logs`.
- Marketing emails must require consent and include unsubscribe handling.
- Update docs when implementing or changing a feature.

## Current stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Supabase Auth/Postgres/RLS/Storage
- Stripe
- Resend
- React Email
- Vercel

## Implementation style

Prefer feature-based organisation:

```txt
src/
  app/
  components/
  features/
  lib/
  emails/
  types/
  hooks/
  styles/
  config/
supabase/
  migrations/
  seed.sql
docs/
```

Every feature should include:

- types
- validation schema
- server actions or API routes
- UI components
- permissions
- audit log hooks where relevant
- notification/email hooks where relevant
- tests where practical
