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
