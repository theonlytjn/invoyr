---
title: INV-005 Launch Checklist
version: 1.0
status: Pre-launch
owner: Engineering
last_updated: 2026-07-02
---

# INV-005 — Launch Checklist

Work through each section top-to-bottom before going live. Tick items off as they are confirmed.

---

## 1. Environment & configuration

- [ ] All vars in `.env.local` match `.env.example` — no blank required values
- [ ] `STRIPE_PRICE_ID_STARTER`, `STRIPE_PRICE_ID_PRO`, `STRIPE_PRICE_ID_BUSINESS` point to live Stripe prices
- [ ] `PAYPAL_ENV=live`, `PAYPAL_WEBHOOK_ID` set to the live webhook ID
- [ ] `NEXT_PUBLIC_APP_URL=https://app.invoyr.io` (no trailing slash)
- [ ] `CRON_SECRET` is a long random string (≥ 32 chars), set in both `.env.local` and Vercel environment variables
- [ ] All env vars above are added to Vercel → Project → Settings → Environment Variables (Production)
- [ ] `HUGEICONS_TOKEN` is set in Vercel env vars

---

## 2. Supabase

- [ ] Schema applied cleanly to production project (`supabase/schema.sql` run in full)
- [ ] All 4 V3 tables exist in production: `api_keys`, `webhook_endpoints`, `webhook_deliveries`, `automation_rules`
- [ ] RLS is enabled on every table — verify in Supabase Dashboard → Table Editor → each table shows RLS badge
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is the production project's service role key (not a dev project)
- [ ] Auth providers enabled: Email/Password + Google OAuth
- [ ] Google OAuth redirect URL set to `https://app.invoyr.io/auth/callback` in both Supabase and Google Cloud Console
- [ ] Storage bucket `logos` exists with correct public/private settings
- [ ] Storage bucket `attachments` exists (for statement PDF attachments if applicable)

---

## 3. Stripe

- [ ] Using live keys (`sk_live_`, `pk_live_`) — not test keys
- [ ] Stripe webhook endpoint registered: `https://app.invoyr.io/api/webhooks/stripe`
- [ ] Stripe webhook subscribed to:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- [ ] `STRIPE_WEBHOOK_SECRET` matches the signing secret on the live webhook endpoint
- [ ] Starter, Business, Pro products created with monthly prices — price IDs match env vars
- [ ] Stripe customer portal is configured (branding, cancellation policy, allowed actions)
- [ ] Test a live Starter checkout end-to-end: subscribe → webhook fires → subscription row created
- [ ] Test a live invoice payment: pay portal → Stripe Checkout → webhook fires → invoice marked paid → receipt email sent

---

## 4. PayPal

- [ ] Using live app credentials (not sandbox)
- [ ] `PAYPAL_ENV=live`
- [ ] PayPal webhook registered: `https://app.invoyr.io/api/webhooks/paypal`
- [ ] PayPal webhook subscribed to `PAYMENT.CAPTURE.COMPLETED` only
- [ ] `PAYPAL_WEBHOOK_ID` matches the live webhook ID in PayPal developer dashboard
- [ ] Test a live PayPal payment on a real invoice pay portal

---

## 5. Resend

- [ ] `invoyr.io` domain is verified in Resend (DNS records applied and confirmed)
- [ ] `RESEND_FROM_EMAIL=invoices@invoyr.io` resolves from a verified domain
- [ ] Resend webhook registered: `https://app.invoyr.io/api/resend/webhook`
- [ ] `RESEND_WEBHOOK_SECRET` matches the Resend webhook signing secret
- [ ] `RESEND_AUDIENCE_ID` points to the live Resend audience (for marketing consent)
- [ ] Send a test invoice email end-to-end and confirm it arrives without spam filtering
- [ ] Confirm receipt email, overdue reminder, and weekly digest all render correctly

---

## 6. Vercel

- [ ] Production deployment is on the `main` branch
- [ ] Custom domain `app.invoyr.io` is added and SSL certificate is active
- [ ] All 5 cron jobs are visible in Vercel Dashboard → Project → Cron Jobs:
  - `0 6 * * *` — recurring invoices
  - `0 7 * * *` — payment reminders
  - `0 8 * * *` — overdue processing
  - `0 9 * * *` — trial ending emails
  - `0 8 * * 1` — weekly digest (Mondays)
- [ ] `vercel.json` cron jobs are authenticated via `CRON_SECRET` header — confirm Vercel passes it as `Authorization: Bearer <secret>`
- [ ] Check Vercel function region is closest to Supabase project region to minimise cold-start latency

---

## 7. Security

- [ ] `middleware.ts` protects all `/app/*` routes — unauthenticated requests redirect to `/login`
- [ ] All API routes that mutate data call `supabase.auth.getUser()` and return 401 if no session
- [ ] Public API routes (`/api/v1/*`) only accept `Bearer inv_` tokens via `validateApiKey()`
- [ ] Cron routes reject requests without `Authorization: Bearer <CRON_SECRET>`
- [ ] Stripe and PayPal webhook routes verify signatures before processing
- [ ] Outbound webhooks are HMAC-signed (`X-Invoyr-Signature`)
- [ ] No secret keys are logged or returned in API responses
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never exposed to the client (no `NEXT_PUBLIC_` prefix)

---

## 8. GDPR / compliance

- [ ] Account data export works: Settings → Account → Download data export returns a full JSON file
- [ ] Account deletion works: Settings → Account → Delete account removes all org data and auth user
- [ ] Marketing emails only send to users with `marketing_consent = true` in `email_preferences`
- [ ] Unsubscribe link is present in all marketing emails
- [ ] Privacy policy and terms of service pages exist on the marketing site
- [ ] Cookie consent is handled (if analytics/tracking is added)

---

## 9. Smoke tests (do these on production, not locally)

- [ ] Sign up with a new email — onboarding flow completes, org created, dashboard loads
- [ ] Create a client → create an invoice → send it → client receives email
- [ ] Open pay portal link → pay with Stripe test card (if still on test mode) → invoice marked paid → receipt sent
- [ ] Open pay portal link → pay with PayPal sandbox (if still on sandbox) → invoice marked paid
- [ ] Create a subscription (Starter plan) → confirm subscription row in Supabase → feature gates apply
- [ ] Cancel subscription → confirm downgrade reflected in app
- [ ] Create an API key → call `GET /api/v1/invoices` with Bearer token → returns data
- [ ] Create a webhook endpoint → trigger an event → delivery logged in webhook_deliveries
- [ ] Trigger the overdue cron manually: `GET /api/cron/overdue` with `Authorization: Bearer <CRON_SECRET>` → returns `{ updated, reminders_sent }`
- [ ] Export account data → delete account → confirm user cannot log back in

---

## 10. Go-live

- [ ] All items above are ticked
- [ ] Remove any `console.log` debug statements from production code
- [ ] Confirm error boundaries are in place for the dashboard and invoice builder
- [ ] Set up basic uptime monitoring (e.g. Vercel Analytics, or BetterUptime pinging `/api/health`)
- [ ] Share app URL with first beta users
