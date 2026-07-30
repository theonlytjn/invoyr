# Invoyr — Development Status & Handoff

_Last updated: 30 July 2026._
_Snapshot of everything completed in the recent development phase and what's left before/at launch._

---

## TL;DR

The product is **feature-complete and security-hardened**. Open Banking (TrueLayer) is tested end-to-end in both sandbox and live. What remains is mostly **external dependencies** (legal review, TrueLayer production approval) plus a couple of quick internal flips. Marketing site is fully built (dual-theme, de-personalised demo data, social image).

**Live surfaces:** marketing `invoyr.io` · app `app.invoyr.io` · Supabase project `hvynatbejnwmvbmiqqpe` (org "TJN", **Pro** plan) · Vercel project `prj_Yyrq56Denmk0HsDhbkYFYvCQWvOn` (team `team_VZXKI4gYr7xozP1mZdz5P1xt`).

---

## ✅ Completed this phase

### Marketing site
- **Light/dark dual-theme** across all marketing pages with a header toggle. Time-based default (dark 19:00–07:00 local), explicit toggle persists in `localStorage`, no-flash inline script. Marketing pages kept **static** for speed.
- Removed the redundant standalone `/light` preview page.
- **Social/OG image** → static `public/social.png` (1200×630) via `openGraph`/`twitter` metadata (dynamic `opengraph-image.tsx` removed).
- **Demo data de-personalised** → fictional **Northbridge Creative Ltd / Adam Foster** with clients Atlas Digital Studio Ltd / Oakstone Developments Ltd / Elevate Tech Solutions Ltd. Homepage + Features dashboards mirror the `login.png` image; use-cases keeps a larger-scale snapshot.
- **Contact email** unified to `support@invoyr.io`.
- Prior polish: hero fills viewport, pricing/features/use-cases bento layouts, WCAG 2.2 AA typography/contrast pass, AOS-style scroll reveals, scroll-to-top, header sizing.

### Billing / plans
- **Complimentary (comp) access is first-class** across sidebar, overdue + payment-reminder crons (`getOrgIdsWithFeature`), and the billing page. Comp wins over Stripe in `getOrgPlan`.
- Tiers finalised (Starter £79 / Business £149 / Pro £249, annual; **7-day** trial). Stripe card payments on **all** plans; PayPal is Business+.
- Admin ↔ app navigation buttons for the founder.

### TrueLayer Open Banking — tested E2E (sandbox **and** live)
- Full flow verified: connect → callback (tokens + accounts stored) → sync (transactions) → import (expenses). Sandbox used the Mock Bank; live used a real bank (test data cleaned up after).
- **Code fix:** `src/lib/truelayer/client.ts` `buildAuthUrl` now includes `uk-cs-mock` in **sandbox** (the live provider groups `uk-ob-all uk-oauth-all` resolve to zero providers in sandbox).
- **Gotchas learned:** sandbox needs the `sandbox-` prefixed client ID + sandbox secret; live needs the live pair + `TRUELAYER_ENV=live`; **redirect URIs are registered per-environment** in the TrueLayer console.
- **Open banking is Pro-only** (`open_banking` feature).

### Security hardening (full 11-point pass + Supabase advisor)
Shipped across commits `5a94452`, `ea8cba0`, `70c1f10`, `337cc50`, `3dc4b48`, `4df922a`:
- **Security headers** (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) in `next.config.ts`; partial enforcing CSP (base-uri/object-src/frame-ancestors).
- **Error masking** — `src/lib/api/errors.ts`; applied to public/external routes (contact, `v1/*`, Stripe webhook) so raw DB/provider errors don't leak.
- **RLS**: dropped the anon SELECT policies on invoices/estimates/items (were readable cross-org via the anon key); dropped permissive `orgs_insert`; pinned `touch_updated_at` search_path; revoked RPC EXECUTE on trigger-only `handle_new_user`. (`is_org_member`/`is_org_owner` intentionally kept — RLS depends on them.)
- **Authz/validation**: `onboarding/welcome` org-membership check + Zod; Zod on payment routes; bank OAuth callback requires an authenticated org member.
- **Admin over-return** fixed (stopped shipping `smtp_password`/bank details to the admin browser).
- **Auth error normalisation** (`src/lib/auth/friendly-error.ts`) — kills signup user-enumeration leak.
- **Privacy + Terms pages** created (real entity: Invoyr Ltd, 128 City Road, London EC1V 2NX; England & Wales; support@invoyr.io) — _pending lawyer review_.
- **Rate limiting** (Upstash Redis, `src/lib/rate-limit.ts`) on `/api/contact` + `/api/pay/[token]/*`.
- **CAPTCHA** (Cloudflare Turnstile, `src/lib/turnstile.ts` + `TurnstileWidget`) on contact + signup.
- **Bank tokens encrypted at rest** (AES-256-GCM, `src/lib/crypto/tokens.ts`).
- **GDPR marketing consent** = explicit opt-in checkbox in onboarding.
- **CSP (nonce-based) shipped Report-Only** on app responses (see "Left to do").
- Advisor down to 2 (both intentional/toggle).

### Docs
- `docs/product-overview.md` — source-verified marketing/pitch reference (positioning, tiers, feature breakdown, integrations, messaging).

---

## 🔧 Left to do (pick-up list)

1. **Flip CSP to enforcing.** Currently Report-Only on app pages (`middleware.ts` → `applyCsp` sets `Content-Security-Policy-Report-Only`). Before flipping to `Content-Security-Policy`, confirm **no blocking violations** on: (a) `/pay/[token]` with the **PayPal SDK** loaded (PayPal sometimes needs `'unsafe-eval'`), and (b) `/signup` **Turnstile**. Neither was reachable in-session (no PayPal-configured invoice token; logged-in users can't view `/signup`).
2. **TrueLayer production approval** (external) — live still shows "Testing mode active"; real customers can't connect until approved.
3. **Legal review** of `/privacy` + `/terms` (external).
4. **Leaked-password protection** — Supabase → Authentication → Providers → Email → "Prevent use of leaked passwords" (available on Pro). _Toggle by hand._
5. **Payments E2E test** — a real Stripe card payment via the invoice → pay page → webhook → status flow, ideally from a second account. (Founder intended to self-test.)
6. **Marketing-side CSP** — the nonce CSP is app-only (marketing kept static). A full script-src CSP for marketing would need a hash/nonce approach that preserves static generation.

---

## ⚙️ Prod env vars (must be set in Vercel + `.env.local`)

Standard: Supabase, Stripe (+ price IDs, Connect, webhook secret), PayPal, Resend, `NEXT_PUBLIC_APP_URL`, `CRON_SECRET`, `CONTACT_EMAIL`, `HUGEICONS_TOKEN`.

Added this phase (fail-open until set):
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (rate limiting)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` (CAPTCHA — also enable Turnstile in Supabase Auth)
- `TOKEN_ENCRYPTION_KEY` (base64 32 bytes; bank-token encryption)

TrueLayer: `TRUELAYER_CLIENT_ID`, `TRUELAYER_CLIENT_SECRET`, `TRUELAYER_REDIRECT_URI`, `TRUELAYER_ENV` (currently live).

---

## ⚠️ Gotchas / conventions

- **No migration pipeline** — `supabase/schema.sql` is applied to prod **by hand**. Re-run a table+column audit after any schema edit (drift has bitten before).
- **`ADMIN_EMAIL`** is hardcoded `tony@theonlytjn.com` in `middleware.ts` and `src/lib/admin.ts` (real admin gate; not shown publicly).
- **Fail-open patterns**: rate-limiter, Turnstile verify, and token encryption all no-op until their env keys are present — so the app never breaks before keys are added, and activates once they are.
- **Payment state is webhook-driven** — never mark invoices paid from the frontend (per CLAUDE.md / product constitution).
- Vercel deploys on push to `main`; env changes require a redeploy.

---

## Reference docs in-repo
`docs/INV-000-product-constitution.md` · `docs/INV-006-plans-entitlements-and-open-banking.md` · `docs/INV-007-plan-tiers-and-marketing-offering.md` · `docs/product-overview.md` · `AGENTS.md` · `CLAUDE.md`.
