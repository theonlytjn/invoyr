# Invoyr — Development Status & Handoff

_Last updated: 26 September 2026._
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

### Bulk actions
- **Multi-select delete** shipped on all four record lists — invoices, estimates, expenses, clients — via a shared selection UI (`useRowSelection`, `BulkActionBar`, `RowCheckbox`, `BulkDeleteDialog`) and four `POST .../bulk/delete` routes. **Ungated on every plan**, with per-resource server-side eligibility rules in `src/lib/bulk-actions.ts` (unit tested).
- **Invoice quick actions** added to the same bulk bar: mark as paid and duplicate are also **ungated**; send reminders and download PDFs are **gated** on `bulk_invoice_actions` (Business+), same as the existing bulk Send/Void.
- **Single-record delete follows the same rules.** `DELETE /api/expenses/[id]` and `DELETE /api/estimates/[id]` run the record through the same partition functions and answer 409 with the reason, so the row's trash icon can no longer delete a billed expense or a converted estimate that the bulk bar refuses.
- **One batch cap.** `MAX_BULK_IDS` (50) is shared by every bulk route's Zod schema and by each list's "select all"; the PDF route caps lower (`MAX_BULK_PDF_IDS`, 15) because renders are sequential.
- Full detail — eligibility rules, the fail-closed/no-transaction/batch-resilience decisions, and the known `RecordPaymentModal` frontend-payment-write violation left unfixed — is recorded in the `docs/INV-001-current-state-audit.md` addendum (§11).

### Bulk edit, client deletion and payment write-off
- **Bulk edit on expenses.** `POST /api/expenses/bulk/update`, ungated. Edits `category`, `client` and `billable` across a selection in one request — all three tri-state, where an absent field means leave it unchanged and an explicit `null` on client means clear it. Expenses already billed to an invoice are skipped, the same rule bulk delete uses. Dry run first, so the user sees "N will update, M skipped" before committing.
- **Client deletion is now allowed.** Previously clients could only be archived: `invoices.client_id`/`estimates.client_id` are `ON DELETE SET NULL`, and neither table stored the client's own billing details, so deleting a client stripped name, address and VAT number from every historical document, including paid invoices and the page customers pay from. New `client_snapshot` jsonb columns on `invoices` and `estimates` hold a copy written immediately before deletion; five surfaces (the invoice PDF, the invoice detail page, the estimate detail page, and both public `/pay`/`/estimate` token pages) resolve a document's client through `resolveDocumentClient`, falling back to the snapshot once the live link is gone. The delete route **fails closed** — if a snapshot write errors, nothing is deleted. Archive remains available as the reversible option.
- **Payments are now recorded server-side, with an optional write-off.** New `POST /api/invoices/[id]/record-payment` records a payment, recomputes status, and can issue a credit note for whatever balance remains in the same request. `RecordPaymentModal` is now a thin form posting to it — it no longer writes to Supabase directly, which **closes the standing `CLAUDE.md` violation** noted in the §11 audit addendum (that modal used to insert the `payments` row and set `status: 'paid'` from the browser).
- Two things worth knowing before they're mistaken for bugs: (1) once a client is deleted, the send/remind routes correctly find no client and skip that invoice — a deleted client shouldn't get emailed, and a snapshot has no inbox — but checkout does **not** skip; it still creates the Stripe session, just without a prefilled email; (2) neither the record-payment route nor credit-note creation can use a database transaction (the Supabase JS client has no primitive for it) — both are ordered to fail in the safer direction instead, so a failure leaves more evidence than an aggregate figure that never happened.
- Full detail, including the exact ordering/fail-closed reasoning and the render-surface audit, is in the `docs/INV-001-current-state-audit.md` addendum (§12).

### Onboarding was broken for every new signup (24 Sep 2026) — launch blocker
- **Nobody could complete onboarding between 27 Jul and 24 Sep.** The 27 Jul security pass dropped the permissive `orgs_insert` RLS policy (`with check (true)`) on the assumption that organisations are only created server-side by `api/org/create`. **The onboarding wizard was never migrated** — `OnboardingWizard.complete()` still inserted into `organisations` with the browser (RLS-bound) client, which Postgres refused with "new row violates row-level security policy". The failure was **silent**: the wizard only `console.error`-ed, so step 4's "Go to dashboard" just re-enabled itself. Evidence: no `organisations` row has been created since 23 Jul, and an authenticated-role probe insert is still denied.
- **Fix.** Onboarding now posts to `POST /api/org/create`, which validates with Zod (`src/lib/onboarding/org-input.ts`, unit tested) and writes the row with the service client. That route previously accepted only `name` — it now takes the wizard's full payload (contact details, logo, accent colour) and **deletes the org if the `org_members` insert fails**, since an org with no members is invisible to every RLS policy and unreachable forever. The wizard surfaces the error instead of swallowing it. RLS is unchanged: `organisations` still has no authenticated INSERT policy.
- **LESSON (third of its kind, after `logos_select` and the PayPal enum): dropping a policy needs proof that every writer of that table is server-side.** A grep for `.from("organisations").insert` in `src/components` would have caught it. Browser writes fail silently wherever the caller only logs to the console.

### Sending an invoice now confirms itself (6 Oct 2026)
- Sending from the invoice page refreshed silently — no way to tell a send from a no-op. `POST /api/invoices/[id]/send` now returns the resolved recipients and the page shows a confirmation naming them, **including the CC list**, so "did accounts get it?" is answered at the moment of sending rather than by digging through history.

### Accent-colour contrast, linked clients, and first-view tracking (6 Oct 2026)
- **A white or pale accent erased the pay page header** — white text on a white band. `src/lib/contrast.ts` (WCAG relative luminance, unit tested) now picks near-black or white for any accent, and adds a hairline border when the accent is near-white so the band and logo tile don't vanish into the card.
- The same problem exists in reverse — accent used as *text* on white — so `accentOnLight` falls back to near-black for pale accents. Used for the new invoice-number link colour.
- **Invoice list:** invoice numbers now render in the org's accent as an obvious link, and client names link through to the client record (`clients(id, name)` added to the query, which previously fetched only the name).
- **First view of the pay page is recorded** as `invoice.page_viewed`, once per invoice, labelled "Invoice opened by client" — distinct from `invoice.viewed`, which the Resend webhook writes when the *email* is opened. Both now appear in the invoice history. Best-effort: a logging failure never breaks the page for a paying client.
- **Caveat:** the sender opening their own pay link counts as a view; there is no way to tell them apart without a cookie or token.

### Mobile viewport: couldn't reach the top or bottom without over-scrolling (3 Oct 2026)
Three causes, all in the shell:
- **`h-screen` (100vh) on iOS is the height with the toolbars hidden**, so the bottom of every page sat behind Safari's bar. Both shells now use `h-dvh` (dynamic viewport height), which tracks the toolbars as they collapse.
- **`viewport-fit: cover` was missing**, so every `env(safe-area-inset-*)` resolved to 0 — the fixed bottom bar could sit under the iPhone home indicator. Added to the `viewport` export.
- **`main` had `pb-16` (64px)** for a bar that is taller than that once labels and the home indicator are counted, hiding the last of the content. Now `calc(4.5rem + env(safe-area-inset-bottom))`, with the bar itself padded by the inset. The admin shell gets the same treatment at the top for its fixed header, and `overscroll-contain` stops a scroll at the end of the list dragging the page behind it.
- **Not verified on a real device** — the browser here will not resize below desktop width.

### Admin create-user: three bugs stacked (3 Oct 2026)
Each one hid the next, and each only became visible once the error above it stopped being discarded:
1. Organisation insert had no `slug` (NOT NULL, no default) and passed a non-existent `currency` column.
2. `profiles.first_name` / `last_name` did not exist (see below).
3. `profiles` insert collided on the primary key — **`handle_new_user` already inserts the row** when the auth user is created. Now an upsert, which also replaces the trigger's email-derived guess with the names the admin typed.
- **Verified by probe, not by reading:** a throwaway account was driven through the exact sequence (createUser → profile upsert → organisation → membership → audit log) against production, confirmed, then deleted. Worth repeating for any multi-step write that can't be exercised through the UI without making real data.

### profiles.first_name never existed (3 Oct 2026)
- Admin create-user failed with "Could not find the 'first_name' column of 'profiles' in the schema cache" — **surfaced only because the error check added earlier that day stopped the route swallowing it.**
- `first_name`/`last_name` live on `marketing_contacts` and had **never** been on `profiles`, yet **14 code paths read `profiles.first_name`** for email personalisation. Every one used `profile?.first_name ?? "there"`, so each failed select degraded silently: trial, welcome, payment and subscription emails have always greeted people as "there" or by their org name. Nothing ever errored.
- Migration `add_profiles_first_last_name` adds both columns, backfills them by splitting `full_name` (both existing profiles now resolve correctly), and updates `handle_new_user` so new signups populate all three. schema.sql matches.
- **Third drift blind spot of this kind**, after column defaults and enum values: a column the *code* expects that the schema never declared. `information_schema` can only be diffed against what schema.sql says — not against what the code reads. Grep the code for `.select("<column>")` per table when auditing.
- Admin → Users now shows a **Sign-in** column listing each account's identities (Password / Google), so "I can't log in" can be diagnosed at a glance.

### Email settings save moved server-side; admin tables scroll (3 Oct 2026)
- Saving email settings on mobile failed with a bare **"TypeError: Load failed"**. `edge_logs` showed **no PATCH ever reached Supabase** — the browser's cross-origin write died on the phone's network (Safari's wording for a failed fetch).
- Now posts to `POST /api/settings/email`: same-origin, Zod-validated, permission-checked against `manage_settings`, writing with the service client and treating zero updated rows as failure. **That also fixes the silent no-op flagged in the 25 Sep sweep** — `orgs_update` is owner-only while `manage_settings` allows admins, and an RLS-filtered UPDATE returns no error, so an admin saw "Saved!" having saved nothing. The form now reports a lost connection distinctly from a rejected save.
- `BrandingForm` and `InvoiceSettingsForm` still write straight from the browser and have the same two weaknesses — not yet migrated.
- Admin tables (`users`, `organisations`, `connections`, `email-logs`, `audit-logs`) were inside `rounded-2xl overflow-hidden` cards, so on a phone the columns were clipped with no way to reach them. Cards now use `overflow-x-auto` and the tables carry `min-w-[44rem]`, so they scroll horizontally instead of being cut off.

### Admin "create user" had never worked (3 Oct 2026)
- `POST /api/admin/users` inserted `{ name, currency: "GBP" }` into `organisations`. **`slug` is NOT NULL with no default and was never supplied, and `currency` is not a column on that table** — either alone fails the insert. The route then discarded the error (`const { data: org }` with no `error`), rolled the auth user back and returned a bare "Failed to create organisation", so the real cause never surfaced.
- Now builds the row with `buildOrgRow` (same helper as onboarding, so the slug rule lives in one place), checks every write, and rolls back the org as well as the user on failure. The audit-log insert stays best-effort but is logged.
- Same shape as the other silent-write bugs: the write that failed was the one whose error was thrown away.

### Password reset, magic links and password sign-in were all broken (3 Oct 2026)
- **Symptom:** "Something went wrong. Please try again." on reset and magic link. **Cause, from `auth_logs`:** `400: captcha protection: request disallowed (no captcha_token found)` (`error_code: captcha_failed`) on `/recover` and `/otp`. Turnstile CAPTCHA was enabled in Supabase Auth on 27 Jul, but **only `/signup` ever sent a token** — login (password and magic link) and forgot-password never did.
- **Password sign-in was broken too and nobody had noticed**, because existing sessions renew via refresh tokens and Google OAuth is not CAPTCHA-protected. The logs show no `/token` captcha failures simply because no one had tried a password login since July.
- Fixed by sending `captchaToken` on `signInWithPassword`, `signInWithOtp` and `resetPasswordForEmail`, and rendering the widget on both login modes and the reset page.
- **Turnstile tokens are single-use.** Every form now remounts the widget (via a changing `key`) after a failed attempt, so a second try gets a fresh token instead of replaying a spent one. Signup had this bug too and is fixed.
- **`friendlyAuthError` was hiding the cause.** Anything unrecognised became "Something went wrong", so a configuration failure looked like a transient glitch. Captcha errors now get their own message. **Lesson: a catch-all friendly error makes a whole class of failure undiagnosable from the UI — check `auth_logs` before believing the message.**

### Lockout now follows the active org (2 Oct 2026)
- The entitlement check added on 26 Sep took the **first** `org_members` row, ignoring the `active_org_id` cookie. Harmless while everyone had one org; with several it would let a locked-out org in on a comped sibling's entitlement, or lock a valid org out because a lapsed one was returned first. Found before it bit, while planning a third comped org (Love Rooted).
- The cookie is only honoured when it matches a real membership, so it cannot be edited to borrow another org's access; otherwise it falls back to the first membership.
- `ACTIVE_ORG_COOKIE` moved to `src/lib/org-cookie.ts` (no imports). Importing it from `lib/auth` would have pulled `next/headers` and the Supabase server client into the **edge middleware bundle** — the same trap as the CSP breakage. `src/lib/trial.ts` exists for the same reason.

### Test accounts removed (2 Oct 2026)
- Deleted `tony+qa1@theonlytjn.com` (Tony The Rapper), `tony@finerfleet.com` (Tester) and `muckydesignz@gmail.com` (DD) with all their data and storage files. Remaining: TJN Agency and Cakes By Kels, both comped pro. Verified after: 2 orgs, 2 users, 5 invoices, 0 orphaned files, 0 orphaned email logs.
- **Postgres refuses `delete from storage.objects`** ("Use the Storage API instead"), so SQL-only cleanup leaves orphaned files behind. Deletion ran through a one-off service-role script: Storage API first, then org rows (which cascade), then `auth.admin.deleteUser`. Worth reusing that order for any future account deletion.

### Invoices can be copied to additional recipients (30 Sep 2026)
- A client's organisation often has more than one person who needs the invoice (an accounts inbox, a manager). New nullable `clients.cc_emails text[]` (max 5, enforced by `clients_cc_emails_max` and the form), edited on the client form as a comma-separated list and shown on the client page as "Also copied".
- Applied everywhere that emails a client, not just the send button: invoice send (single + bulk), reminders (manual, bulk and the payment-reminder cron), credit notes, estimate send and client statements. `sendTransactionalEmail` takes a `cc` option and passes it to both Resend and the custom-SMTP path.
- **A bad CC address never blocks the invoice.** `ccRecipients` (unit tested in `src/lib/email-recipients.ts`) drops invalid entries and removes the primary recipient so nobody is both To and CC. Validation on the form catches typos up front; the send-time filter is the backstop.
- `email_logs` has no cc column, so `to_email` records every recipient joined with commas — the invoice history therefore shows who actually received it. The Resend webhook matches on `resend_id`, so this doesn't affect delivery or open tracking.

### Card-first 14-day trial, and no free tier (26 Sep 2026)
Product decision: there is **no free plan**. Access is bought by trialling (with a card on file) or paying.
- **`TRIAL_DAYS` is now 14**, shared by Stripe checkout and all copy.
- **Onboarding ends at Stripe Checkout.** The last step's button is now "Add payment details" and posts to `/api/billing/checkout` with `origin: "onboarding"`, returning to `/dashboard?welcome=1` on success. The self-serve `trialing` row written earlier the same day was **removed** from `/api/org/create` — the trial now lives in Stripe, which collects the card (`payment_method_collection: "always"`), charges when the 14 days end (i.e. at the start of day 15, standard practice), and cancels a trial left without a payment method.
- **Lockout in `middleware.ts`.** Any app route redirects to `/settings/billing?reason=subscription_required` unless the org is comped or has an active/valid-trial subscription. `/settings/billing` and `/settings/account` stay reachable **on purpose: a lapsed customer must still be able to export their own invoices** rather than have their records held hostage.
- **Edge-safety:** entitlement helpers moved to `src/lib/trial.ts`, which imports nothing. `lib/billing.ts` pulls in the Supabase service client and `next/headers`, and importing that into middleware risks an edge-runtime failure — the same class of problem as the CSP breakage.
- **Two reminder emails, not four.** The daily `trial-ending` cron previously emailed everyone within 3 days of expiry, so it fired on days 3, 2, 1 and 0. It now sends only at **3 days** and **1 day** (`TRIAL_EMAIL_COPY.reminderDays`), deduped against `email_logs` within 20 hours. `TrialEndingEmail` moved from `MarketingLayout` to `TransactionalLayout` — a notice that an account is about to be charged or locked is transactional and must not depend on marketing consent — and its copy now lives in `src/config/email-copy.ts` per CLAUDE.md.
- **Marketing copy corrected.** Eight places advertised a "7-day free trial, no credit card required" — both halves are now false. All say 14 days, and the "no card required" claims are gone.
- **Grandfathering:** TJN Agency and Cakes By Kels (comped pro) and Tester (comped, qa_sandbox) are unaffected. The QA org "Tony The Rapper" holds a trial row to 3 Oct, so it stays in until then and is a live test of the lockout. DD has no plan and will hit the billing wall — the intended upsell case.
- **Three lifecycle emails**, all from one `TrialEndingEmail` component driven by `TRIAL_EMAIL_COPY` (a second near-identical component would be duplication): reminders at **3 days** and **1 day**, plus a **trial-ended** notice sent once when a trial lapses without converting (status still `trialing`/`canceled`/`past_due`/`incomplete`). The ended notice says plainly that nothing has been deleted and that data export is still reachable — which is true, because the lockout leaves `/settings/account` open. Each is deduped against `email_logs` (20h) and a failed dedupe lookup counts as "already sent" so a lookup error can't cause a double-send. The ended pass only looks back 24h, so a long-lapsed account isn't mailed every morning.
- **Still unhandled:** Stripe's `customer.subscription.trial_will_end` webhook (the cron covers reminders instead), and nothing yet emails on a *failed charge* at trial end beyond the existing `PaymentFailedEmail` path.

### The 7-day trial that started at signup — superseded the same day (26 Sep 2026)
- Onboarding promised "Starter · 7-Day Trial" but wrote no `subscriptions` row, so `getOrgPlan` fell through to *no plan* — a brand-new org couldn't even use Starter's `custom_branding`. `POST /api/org/create` now inserts `{ plan: <chosen>, status: 'trialing', trial_ends_at: now + TRIAL_DAYS }` (best-effort: a failure logs rather than failing the signup). The plan chosen in step 3 is what gets trialled.
- **`isSubscriptionActive` now checks `trial_ends_at`.** Nothing external moves a self-serve trial off `trialing` — there is no Stripe subscription behind it — so without the date check every signup would keep its plan free forever. Stripe-backed trials pass `trial_ends_at: null` semantics through the webhook, which moves them to `active`/`past_due`, so they are unaffected. Unit tested in `src/lib/billing.test.ts`; `TRIAL_DAYS` is now shared with the Stripe checkout.

### CSP: flipped to enforcing, then REVERTED the same day (26 Sep 2026)
- Enforcing it **broke `/login` (blank page) and stopped Turnstile rendering on `/signup`**. Reverted to Report-Only within minutes.
- **Root cause: the auth pages are statically prerendered, so Next.js never injects the per-request nonce** — `curl https://app.invoyr.io/login` shows zero `nonce=` attributes. Next's own CSP guide is explicit that nonces **require dynamic rendering**. The inline hydration script was therefore blocked, the page never hydrated (blank login), and Turnstile never rendered because the effect that injects its script never ran. Both symptoms, one cause.
- **Why the earlier checks missed it:** every page verified (pay page, dashboard, admin) is dynamically rendered, and a signed-in browser is redirected away from `/login` and `/signup`, so the two static pages were exactly the ones nobody could see. **Check CSP signed-out, with curl, not only in a logged-in browser.**
- **To try again:** force dynamic rendering on the auth pages (`export const dynamic = 'force-dynamic'`), or adopt the documented `'strict-dynamic'` setup, then verify `/login` and `/signup` **signed out** before flipping. Not a launch blocker — the static partial CSP (base-uri, object-src, frame-ancestors) still enforces.

### The launch checklist re-checked (26 Sep 2026)
- **CSP flipped from Report-Only to enforcing** (`applyCsp` in `middleware.ts`). The two flows that blocked this for two months were checked on production first, under Report-Only: `/pay/[token]` with the PayPal SDK (buttons render, **zero violations — no `'unsafe-eval'` needed**) and the app shell. Re-verified after the flip: pay page and dashboard both render clean with the enforcing header. Turnstile was not directly observable (a signed-in browser can't reach `/signup`), but `challenges.cloudflare.com` is allowed in `script-src`, `frame-src` and `connect-src` — **worth one confirmation in a private window**.
- **TrueLayer is STILL NOT APPROVED for production** (checked live 26 Sep via `/api/bank/connect`): the auth dialog still shows "Testing mode active — This application has not been authorised for production use… reach out to sales@truelayer.com". Open Banking remains developer-only until TrueLayer grants it. **Action: email sales@truelayer.com.**
- Tony completed: PayPal client secret rotated; live PayPal webhook created with its ID set; leaked-password protection enabled; dead Upstash vars removed from Vercel; plan gating verified (upgrade prompts correct); inline client creation, emails and the estimate/credit-note/client-deletion flows all verified working; a real client paid a PayPal invoice successfully.
- **RATE LIMITING IS BACK ON (28 Sep 2026).** A new Upstash Redis database was provisioned and `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` set in Vercel. **Verified by probe, not by assumption:** 13 rapid POSTs to `/api/pay/<bogus>/checkout` (limit 10/60s) returned 404 ×10 then **429 ×3**. The same probe against the pre-redeploy build passed all 13 — worth remembering as the tell: because the limiter fails open by design, "no 429" and "no Redis" look identical from outside, and **the fail-open path logs nothing when the vars are simply absent**. Always probe after changing those vars, and check the deployment being probed is the one carrying them.
- Invoice attachments and the signup Turnstile widget were both **confirmed working** on 28 Sep. Still untested: **everything behind Stripe** — the new card-first signup, the 14-day trial, the lockout and the trial emails — pending the Invoyr Stripe account (expected Mon 28 Sep).

### Swept the codebase for silently-swallowed write failures (25 Sep 2026)
Triggered by the onboarding bug: ~90 write sites ignore their result. Top tier fixed; the rest are listed below as follow-ups.
- **Invoice attachments had NEVER worked in production.** The `attachments` storage bucket did not exist (only `logos` and `receipts` did) and was absent from schema.sql — `invoice_attachments` had zero rows. Created via migration `create_attachments_bucket_and_policies` (public, 10MB cap) with four org-scoped policies mirroring `logos`, and recorded in schema.sql §20. **Note: the bucket is public (unguessable paths), matching receipts/logos. If attachments hold sensitive documents, switch to a private bucket + signed URLs.**
- **Editing an invoice could wipe its line items.** `InvoiceForm` deleted all items then re-inserted, checking neither. New lines are now inserted BEFORE the old ones are deleted by id, so a failure can't leave an invoice with a total and no lines; both results are checked. On create, a failed items insert now rolls back the invoice header. The audit-log insert stays best-effort but is logged.
- **Payment state writes.** New `src/lib/payments/apply-invoice-payment-state.ts` (unit tested) mirrors `recordPaymentRow`: it checks the result, and on failure logs everything needed to fix by hand plus an `invoice.payment_state_failed` audit row. Wired into the Stripe webhook, PayPal webhook, PayPal capture and refund routes. **Both webhooks now answer 500 so the provider retries** — they previously returned 200 after a failed write, so a paid invoice stayed unpaid for good. The Stripe handler had no idempotency guard, so one was added on the payment intent (the PayPal paths already dedupe on capture id). The PayPal capture route deliberately still returns ok to the payer.
- **`.select()` on updates is load-bearing**: a row hidden by RLS is filtered, not rejected, so an UPDATE that changes nothing returns `error: null`. The invoice edit and attachment delete now treat zero rows as failure.
- **Known follow-ups, not yet fixed:** `team/accept` (burns the invite even if membership fails), `team/transfer-ownership` (can leave two owners or none), `account/delete` (deletes the auth user regardless), `estimates`/`recurring-invoices` item delete-then-insert (same wipe shape), document-number counters, `email_logs` inserts inside `send-transactional-email` (the overdue cron reads that table to avoid double-chasing), and `settings` forms that show "Saved!" to an **admin** whose update RLS silently refuses (`orgs_update` is owner-only while `manage_settings` allows admins — decide whether to widen the policy or owner-gate the forms).

### Onboarding takes a logo file instead of a URL (25 Sep 2026)
- The branding step asked for a "Logo URL" as free text and the preview never showed it. It is now a file picker (PNG/JPG/WEBP/SVG, 2MB cap, validated in `src/lib/onboarding/logo-upload.ts` and unit tested) with the chosen image rendered in the preview via an object URL.
- **The upload can't happen during the wizard**: the `logos` storage policies match the path's first segment against `org_members`, and the membership only exists once the org is created on the final step. So the file is held in memory and posted to `POST /api/onboarding/logo` straight after org creation; that route re-checks membership and writes with the service client to `<org_id>/logo.<ext>`, then sets `organisations.logo_url`.
- `complete()` now remembers the created org id, so a retry after a failed logo upload (or a double-click) can never create a second organisation. A failed upload keeps the user on the step with the reason and a "Continue to dashboard" escape, rather than blocking setup over a logo.
- `OnboardingData.logoUrl` was removed — nothing sets it any more. `orgCreateSchema` still accepts `logoUrl` for other callers.

### Inline client creation on the invoice form (24 Sep 2026)
- `ClientQuickCreateDialog` (`src/components/clients/`) adds a client from the invoice form without leaving it: contact name and email required, company name optional. Email is required here (the full client form allows it to be blank) because a client created mid-invoice exists to be sent one; the remaining fields are edited later on the client's page. Inserted with the browser client, which `clients_insert` RLS allows for org members. **Not yet wired into the estimate form.**

### Invoice discounts shown to the client (16 Sep 2026)
- **Bug fixed: the invoice email quoted the pre-discount total.** Both send routes (`api/invoices/[id]/send`, `api/invoices/bulk/send`) recomputed the total from the line items and never passed the invoice's `discount`, so INV-0012 (£675 less a £337.50 discount) was emailed as "£675.00" while the pay page correctly asked for £337.50. The email amounts now come from `invoiceEmailAmounts` in `src/lib/invoice-totals.ts` (unit tested), and the email shows "Before discount", "Discount" and "Total" rows. The invoice detail page's template preview had the same omission and is fixed too.
- **The discount is now visible everywhere the client sees the invoice:** the `/pay/[token]` page (new discount row), the email, all four web templates and all four PDF templates.
- **Optional discount reason.** New nullable `invoices.discount_reason` (max 200 chars, enforced by the `invoices_discount_reason_length` check constraint and the form's `maxLength`). The reason field appears in the invoice form once a discount is entered and renders as "Discount (reason)" via `discountLabel`. It is saved as null when the discount is zero, and invoice duplication copies it. Estimates have no reason field yet (their previews pass `discount_reason: null`), and converting an estimate does not add one.
- Invoices sent **before** this fix still carry the wrong email in the client's inbox — resend them if needed.

### Docs
- `docs/product-overview.md` — source-verified marketing/pitch reference (positioning, tiers, feature breakdown, integrations, messaging).

---

## 🔧 Left to do (pick-up list)

1. **Stripe card payment E2E** — blocked on the Invoyr Stripe account being created.
2. **TrueLayer production approval** (external) — re-checked 26 Sep 2026, still "Testing mode active". Email sales@truelayer.com; real customers cannot connect until approved.
3. **Legal pages — all three drafted, none reviewed by counsel.** `/terms` replaced 28 Sep 2026 with the founder-supplied 38-section Terms & Conditions. Entity details now live in `src/config/legal.ts` so Terms and Privacy cannot drift. `/privacy` rewritten and `/dpa` created the same day, all three driven by `src/config/legal.ts` (entity + sub-processor list) so they cannot drift.
   - **Privacy Policy** now leads with the controller/processor split, matches the Terms on trial auto-conversion and the 7-day deletion window, and lists lawful bases per purpose. States plainly that Customer Data is not sold and not used for model training.
   - **DPA** is structured around UK GDPR Art. 28(3): roles, subject matter/duration/nature/purpose, data types, data subjects, processor obligations, security measures, sub-processors with general authorisation + objection right, audit (questionnaire-first, on-site by exception), breach notification, deletion/return, transfers, liability.
   - **Sub-processor facts verified against the live system**, not assumed: Supabase `eu-central-1` (Frankfurt) at rest, but the Vercel deployment region is `iad1` (US East), so the transfers sections say processing reaches the US. No analytics or advertising cookies exist in the app, so the cookie section lists only auth, active-org and Turnstile.
   - **Outstanding:** (a) `companyNumber` is `null` until Companies House confirms — the clause is omitted rather than printing a placeholder, so set it in `config/legal.ts` and it lands in all three pages at once; (b) counsel should look hardest at the DPA audit clause, the liability position, whether enterprise customers need a signed counterpart, and whether the SCC/IDTA reliance is actually papered with each provider; (c) no cookie banner exists — defensible while only strictly-necessary cookies are used, but it stops being true the moment analytics are added.
4. **Trial never starts at signup** — onboarding shows "Starter · 7-Day Trial" but writes no subscription row, so a new org resolves to *no plan* and even Starter's `custom_branding` is locked. Decide: start a trial at signup, or change the copy.
5. ~~Rate limiting~~ — **done 28 Sep**: new Upstash Redis, verified enforcing (429 after the limit).
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

- **No migration pipeline** — `supabase/schema.sql` is applied to prod **by hand**. Re-run a table+column audit after any schema edit (drift has bitten before). Most recent instance: the two `client_snapshot jsonb` columns (`invoices`, `estimates`) added for client deletion — applied to the live database by hand and mirrored into `schema.sql`.
- **`ADMIN_EMAIL`** is hardcoded `tony@theonlytjn.com` in `middleware.ts` and `src/lib/admin.ts` (real admin gate; not shown publicly).
- **Fail-open patterns**: rate-limiter, Turnstile verify, and token encryption all no-op until their env keys are present — so the app never breaks before keys are added, and activates once they are.
- **Payment state is webhook-driven** — never mark invoices paid from the frontend (per CLAUDE.md / product constitution).
- Vercel deploys on push to `main`; env changes require a redeploy.

---

## Reference docs in-repo
`docs/INV-000-product-constitution.md` · `docs/INV-006-plans-entitlements-and-open-banking.md` · `docs/INV-007-plan-tiers-and-marketing-offering.md` · `docs/product-overview.md` · `AGENTS.md` · `CLAUDE.md`.
