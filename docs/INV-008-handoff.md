# Invoyr — Handoff

_Last updated: 14 October 2026 (evening)._
_Where the product stands, what is blocked on whom, and what to pick up next._
_Launch plan and checklist for 1 December: `docs/LAUNCH-1-DECEMBER.md`._

Working agreement: **every change is committed and pushed immediately**; pushing `main`
deploys to production via Vercel. Verify with typecheck, `npx vitest run` and
`npm run build` before pushing (there is no lint script), then confirm the deploy went
green before claiming anything works.

---

## 1. Where we are

**The company exists.** Invoyr Limited, company number **17502051**, registered office
128 City Road, London EC1V 2NX. Name, number and registered office now appear in the
Terms, Privacy Policy, DPA and the marketing footer, all driven from
`src/config/legal.ts`. Only the **registered** office is published — no trading or home
address anywhere, deliberately.

**The rebrand has landed.** Geom on headings (self-hosted, Envato licence covers web
embedding), Satoshi for body and for invoice PDFs, the navy/lime palette as a token
layer, new logos, icons, favicon and social image, hero photography on the homepage and
every inner page, and the real client logo strip.

**Payments have moved to the new Stripe account**, and invoice payments are now **direct
charges on the business's own connected account** — Invoyr is no longer the merchant of
record and is no longer exposed to other companies' chargebacks.

**Four organisations exist, all comped Pro** (`organisations.comp_plan`): TJN Agency,
Cakes By Kels, Love Rooted Limited, Chop Life Music & Entertainment Ltd. There is **no
free tier**, so an org without a comp or a live subscription is locked to the billing
page.

---

## 2. Blocked on Tony — do these first

| # | Task | Why it matters |
|---|---|---|
| 1 | ~~Test a real card payment end to end~~ | **Done 14 Oct.** TJN Agency connected (`acct_1K34uu…`); INV-0016 paid £1.20 by card as a direct charge on TJN's account, marked paid by the `invoyr-connect` webhook, payment row and both emails logged. |
| 2 | ~~Second Stripe webhook destination for connected accounts~~ | **Done.** `invoyr-app` (your account) and `invoyr-connect` (connected accounts) on Invoyr Limited, both → `/api/webhooks/stripe`, secrets in `STRIPE_WEBHOOK_SECRET` / `STRIPE_WEBHOOK_SECRET_CONNECT`. |
| 3 | **Confirm the Chop Life subscription is cancelled** in the *old* Stripe account | Our record is deleted, which does not touch Stripe. It was last seen `active`, so their card may still be charged. |
| 4 | **Founder photo + signature** → `public/founder.jpg` (~640×800), `public/founder-signature.png` (transparent, ~360×120) | The about page holds the space; the note is written and live. |
| 5 | **Re-export the Cakes By Kels logo** | Light version is 92×75, white version 200×75 — different aspect, so it jumps between light and dark mode. |
| 6 | **Lawyer review** of `/terms`, `/privacy`, `/dpa` | Drafted and live, never reviewed. Flag the DPA audit clause, liability cap, and whether SCC/IDTA reliance is actually papered with each provider. |
| 7 | **TrueLayer production approval** | Chased; still "Testing mode active" as of 26 Sep. Open Banking stays developer-only until granted. Customers see a "Coming soon" preview on Settings → Banking; set `OPEN_BANKING_LIVE=true` in Vercel when approved. |
| 8 | **Rate limiting** — Upstash is live and verified enforcing | Done 28 Sep. Nothing outstanding; listed so it isn't re-checked. |

---

## 3. Decisions waiting on Tony

- **Email open tracking.** Invoyr records when an invoice email is opened and shows it in
  the invoice history. The person tracked is the *customer's client* — a third party with
  no relationship to Invoyr — and it is not disclosed in the Privacy Policy or DPA, while
  the policy says "we do not run third-party analytics". Disclose it, make it opt-in per
  org, or switch it off in Resend. Whether the pixel is actually enabled is a Resend
  dashboard setting, invisible to the code.
- **Privacy Policy promises a preference centre that does not exist** — "withdraw consent
  … using the unsubscribe link or in your settings". There is no marketing toggle in
  settings. Build it or amend the sentence.
- **Auto-renewal disclosure** beside Invoyr's own consent button at the end of onboarding
  (Stripe Checkout does show price and renewal, which is the real consent moment).
- **DMCA agent** — $6 at the Copyright Office, renewed every 3 years, given users upload
  logos, attachments and receipts.
- **Hero scrim strength** — images sit at 50% with a radial scrim behind the headline.
  Raising it further trades against legibility in light mode.

---

## 4. Code backlog, in rough priority order

**Accessibility** (audited 8 Oct; blockers fixed, these remain):
- ~41 form controls with no accessible name, mostly in `src/components/settings/*` —
  a `<Label>` sibling with no `htmlFor` next to an input with no `id`. The correct
  pattern already exists in `BrandingForm` and `InvoiceSettingsForm`.
- ~30 error messages that are never announced — no `role="alert"`. Worst on
  `src/app/pay/[token]/PayButton.tsx` and the auth pages, where a failure is silent.
- `text-neutral-500` with no dark variant fails contrast on the new dark cards (72
  instances); `text-neutral-400` hint text fails in light mode. Best fixed in the token
  layer rather than per file.
- Four hand-rolled modals (`CreditNoteModal`, `RefundModal`, `ExpenseModal`,
  `CreateUserModal`, `BankImportModal`) have no dialog semantics, no Escape, no focus
  trap. Four others already use the Radix primitive correctly.
- Consider `eslint-plugin-jsx-a11y` (`label-has-associated-control`) to stop regressions.

**Silently-swallowed write failures** (swept 25 Sep; top tier fixed, these remain):
- `team/accept` burns the invite even if membership fails; `team/transfer-ownership` can
  leave two owners or none; `account/delete` deletes the login regardless of what else
  failed.
- `estimates` and `recurring-invoices` still delete-then-insert their line items without
  checking — the same shape as the invoice bug that could empty an invoice.
- `email_logs` inserts inside `send-transactional-email` are unchecked, and the overdue
  cron *reads* that table to avoid double-chasing.
- Document-number counters (`next_invoice_number`) increment unchecked.

**Settings forms still writing straight from the browser** — `BrandingForm` and
`InvoiceSettingsForm`. Both carry the mobile fragility that broke the email settings save
("TypeError: Load failed") and the silent no-op where an **admin** sees "Saved!" while
RLS drops the update, because `orgs_update` is owner-only but `manage_settings` allows
admins. `EmailSettingsForm` has already been moved server-side as the pattern to copy.

**Smaller items**
- `View PDF` exists on invoices; estimates still download-only.
- Nine email templates have no preview data, so they can't be reviewed in Admin → Emails
  (statements, credit notes, estimates, weekly digest, the three marketing ones).
- Email restyle — Tony is sending reference layouts. Styling is centralised in
  `src/emails/layouts` + `components`, so it is one change for all 22 templates.
- Help guides: six are live at `/help`. Obvious next ones are estimates, recurring
  invoices, expenses/bank import, and the client portal. No screenshots yet, deliberately
  — they would have been shot in the old brand.
- CSP is **Report-Only**. Enforcing it broke `/login` and `/signup` because those pages
  are statically prerendered and Next cannot inject a nonce into them. To retry: force
  dynamic rendering on the auth pages, then verify **signed out** with curl before
  flipping.

---

## 5. Things that will bite if forgotten

- **A comp does not stop Stripe billing.** `getOrgPlan` reads `comp_plan` first, so a
  comped org with a live subscription shows as free *and* still gets charged.
- **Schema drift has four blind spots**, each of which has caused an outage here: column
  defaults (`base64url`), enum values (`payment_method` had no `'paypal'`), storage
  buckets and policies (the `attachments` bucket did not exist), and **columns the code
  reads that the schema never declared** (`profiles.first_name`, which made every
  personalised email say "there"). `information_schema` cannot catch the last one — grep
  the code for `.select("<column>")` instead.
- **Postgres refuses `delete from storage.objects`.** Deleting an account must go through
  the Storage API first, then the org row (which cascades), then
  `auth.admin.deleteUser` — in that order, or files are orphaned.
- **A fixed service-worker cache name serves stale assets forever.** `/public` filenames
  are not content-hashed, which is why the old logo persisted after the rebrand. Bump
  `CACHE_NAME` in `public/sw.js` whenever public assets change.
- **Edge middleware must not import `lib/auth` or `lib/billing`** — they pull in
  `next/headers` and the Supabase server client. `lib/trial.ts` and `lib/org-cookie.ts`
  exist precisely to keep the middleware's imports pure.
- **`STRIPE_SECRET_KEY` must be a full `sk_live_` key from Invoyr Limited.** A restricted
  (`rk_live_`) key fails the Connect OAuth exchange with "Unable to authenticate the
  request" — that was the 14 Oct "Stripe connection failed". Local `.env.local` still held
  an old TJN Agency key at that point; swap in an Invoyr Limited key before local Stripe work.
- **Supabase is on `auth.invoyr.io`** (custom domain). It's in the CSP `connect-src` in
  `middleware.ts`, and both it and the old `…supabase.co` callback are on the Google OAuth
  client. Local `.env.local` still pointed at the old host on 14 Oct.
- **Check which Stripe account production is actually talking to**, rather than assuming.
  It pointed at Tony's personal TJN Agency account for weeks, and the only way that
  surfaced was reading the account ID back from Stripe.
