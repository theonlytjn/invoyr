# Invoyr OS v1.0 — Foundation Pack

This pack is designed to be copied into the root of the Invoyr repository and used as the operating manual for Claude Code.

## What this contains

- `docs/INV-000-product-constitution.md` — the product, design, engineering and communication principles for Invoyr.
- `docs/INV-001-current-state-audit.md` — an audit of the current sitemap, repository, database and implementation gaps.
- `docs/INV-002-target-architecture.md` — the recommended repository, app, database, API, email and automation architecture.
- `docs/INV-003-communication-resend-system.md` — the complete communication platform and Resend/React Email plan.
- `docs/INV-004-implementation-roadmap.md` — phased build plan from current state to MVP.
- `prompts/CLAUDE-CODE-MASTER-PROMPT.md` — paste this into Claude Code to create the docs folder, audit the existing build, and implement the email/Resend system.
- `CLAUDE.md` — suggested replacement for the current Claude instruction file.

## How to use

1. Copy the whole `docs/` folder into the Invoyr repository root.
2. Replace the current `CLAUDE.md` with the `CLAUDE.md` in this pack.
3. Open Claude Code in the Invoyr repository.
4. Paste `prompts/CLAUDE-CODE-MASTER-PROMPT.md`.
5. Ask Claude Code to first run in audit mode, then implementation mode.

## Rule

Claude Code must not blindly rewrite the current app. It must first audit what exists, preserve working code, and then implement the target architecture incrementally.
