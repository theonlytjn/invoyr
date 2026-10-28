# Invoyr — Road to Launch (Monday 1 December 2026)

_Written 26 October 2026. Five weeks to go._
_Pick this up any time: work top to bottom, tick items off, and tell Claude
"carry on from docs/LAUNCH-1-DECEMBER.md"._

Detail behind every item lives in `docs/INV-008-handoff.md` (sections in brackets).

---

## Where things stand

**Working and verified on production:**
- Signup, Google sign-in with the account chooser, onboarding and trials.
- Invoices, estimates and PDFs. Every PDF template carries the company logo, company
  number and registered address.
- Stripe Connect plus a real card payment, tested end to end on 14 October: direct
  charge, webhook, payment row and emails.
- PayPal: a real client has paid an invoice through it.
- Rate limiting, Turnstile, the marketing site, and the new brand and logos.

**Not yet launch-ready:**
- Open Banking, still waiting on TrueLayer approval. Customers see "Coming soon".
- Legal pages: drafted but not reviewed by a lawyer.
- A handful of code fixes, listed below.

---

## 1. Your jobs (only you can do these)

| ✓ | Task | By |
|---|---|---|
| ☐ | **Book a lawyer** to review `/terms`, `/privacy` and `/dpa`. Ask them to focus on the DPA audit clause, the liability cap, and international transfers (SCC/IDTA with each provider). This has the longest lead time, so start now. | Book 31 Oct · done 21 Nov |
| ☐ | **Chase TrueLayer** at sales@truelayer.com for production approval. In parallel, sign up for **Enable Banking** as a backup. | This week |
| ☐ | **Founder signature**: `public/founder-signature.png` (transparent, ~360×120). The photo is done (`public/founder.jpg`, added 28 Oct). | 7 Nov |
| ☐ | **Decide on email open tracking** (handoff §3). Options: disclose it in the Privacy Policy, make it opt-in, or turn it off in Resend. Do this before the lawyer review, so they review the final wording. | 31 Oct |
| ☐ | **Decide on the "preference centre" sentence** in the Privacy Policy. Either build a marketing-emails toggle or reword the sentence. | 31 Oct |
| ☐ | **Register a DMCA agent** ($6, US Copyright Office). | Nov |
| ☐ | **Add the registered office address** in Settings → Company for each real org, so it prints on PDFs. | Any time |
| ☐ | **Local `.env.local`**: swap in the Invoyr Limited `sk_live_`/`sk_test_` key and set `NEXT_PUBLIC_SUPABASE_URL=https://auth.invoyr.io`. | Before local work |
| ☐ | **Stripe housekeeping:** refund the £1.20 test (INV-0016) if wanted, and re-add the WHMCS webhook if you still use it. You can also roll the unused "Invoyr Keys" key on TJN's account. | Any time |
| ☐ | **Comped orgs:** make sure none of the four comped orgs also has a live Stripe subscription. A comp does not stop Stripe billing. | Before launch |

Already done: Chop Life subscription cancelled ✓ · Cakes By Kels logo re-uploaded ✓ ·
Stripe webhooks ✓ · Supabase custom domain ✓ · Rate limiting ✓

---

## 2. Code to finish (Claude can do these; say "do section 2")

### Must fix before launch
These lose data or mislead users.

- ☐ **Settings forms saving from the browser** (`BrandingForm`, `InvoiceSettingsForm`).
  - An **admin** sees "Saved!" while the database silently refuses the update.
  - Saving is also flaky on mobile.
  - Fix: move both server-side, copying `EmailSettingsForm`.
- ☐ **Estimates and recurring invoices can lose their line items** when edited. Their save
  deletes the old lines and inserts the new ones without checking, which is the same bug
  already fixed on invoices.
- ☐ **Team flows:**
  - `team/accept` uses up the invite even when joining fails.
  - `team/transfer-ownership` can leave an org with two owners or none.
  - `account/delete` deletes the login even when other steps failed.
- ☐ **`email_logs` inserts are unchecked.** The overdue-reminder cron reads that table to
  avoid chasing twice, so a failed insert means duplicate reminders.
  - Related: 12 of 16 recent rows had no `resend_id` on 14 Oct. Investigate why.
- ☐ **Invoice number counters increment unchecked**, which risks duplicate or skipped
  numbers.

### Should fix before launch (accessibility and polish)
- ☐ ~41 form fields with no label, mostly in `src/components/settings/*`.
- ☐ Error messages screen readers never announce (`role="alert"`). Worst on the pay page
  and the auth pages.
- ☐ Dark-mode contrast on `text-neutral-500` and light-mode contrast on `text-neutral-400`.
  Fix in the token layer.
- ☐ Five hand-made modals with no Escape key or focus trap. Move them onto the Radix
  dialog.
- ☐ Mark Open Banking as **"coming soon"** on the pricing and features pages, so Pro
  doesn't over-promise.
- ☐ "View PDF" on estimates (invoices already have it).

### Nice to have (fine after launch)
- Preview data for the nine email templates that have none.
- The email restyle, once you send the reference layouts.
- More help guides (estimates, recurring, expenses, client portal) with new-brand
  screenshots.
- Enforcing the CSP. Auth pages need dynamic rendering first; test signed out.
- Inline "add client" on the estimate form.

---

## 3. Week-by-week plan

| Week | Focus |
|---|---|
| **27 Oct – 2 Nov** | Book the lawyer, chase TrueLayer, make the two privacy decisions. Claude: section 2 "Must fix". |
| **3 – 9 Nov** | Founder photo in. Claude: accessibility and polish. You use the app daily as a real customer would (TJN, Love Rooted). |
| **10 – 16 Nov** | Legal changes from the lawyer. Full test pass (section 4) on desktop **and** mobile. |
| **17 – 23 Nov** | **Feature freeze.** Fix only what testing finds. Prepare launch announcements, emails and socials. |
| **24 – 30 Nov** | Final run of section 4 on production. Check Vercel, Supabase, Stripe, Resend and Upstash are on the right plans. Rest. |
| **Mon 1 Dec** | Launch (section 5). |

If TrueLayer hasn't approved by 23 November, **launch with Open Banking as "Coming soon"**.
It is already gated and nothing else depends on it.

---

## 4. Pre-launch test pass (do it signed out, in a private window, on phone and laptop)

- ☐ Sign up with email: Turnstile shows, confirmation email arrives, onboarding completes,
  and the trial starts.
- ☐ Sign up with Google: the account chooser appears, and the "Invoyr App" name and logo
  show.
- ☐ Sign out, then sign back in with a **different** Google account.
- ☐ Forgot password: the email arrives and the reset works.
- ☐ Create a client, invoice and estimate. Download all four PDF templates and check the
  logo, company number and address.
- ☐ Send an invoice: the email arrives, the discount shows correctly, and a row appears in
  `email_logs`.
- ☐ Pay by **card** (Stripe) and by **PayPal** on a real small invoice. The invoice turns
  paid and both emails arrive.
- ☐ Refund one of those payments.
- ☐ Trial expiry: the org locks to Billing, subscribing unlocks it, and Account
  (exporting) stays reachable.
- ☐ Invite a team member as admin, check what they can and can't do, then remove them.
- ☐ Marketing site (dark only since 28 Oct, no theme toggle): logos, the "My account"
  menu when signed in, About in the header menu, and every page loads.
- ☐ Install the PWA on iPhone: new icon, and the new logo shows after one refresh.
- ☐ Delete a test account fully: files, org and login.

---

## 5. Launch day — Monday 1 December

1. Check the latest production deploy is green and you haven't pushed since the final
   test pass.
2. Check the dashboards: Stripe (both webhooks active), Resend (domain verified, no
   bounces), Supabase (no advisor warnings), Upstash.
3. Announce.
4. Watch Vercel runtime errors and Stripe webhook deliveries for the first few hours.
5. Sign up once yourself as a brand-new customer, on your phone.

## 6. First week after launch

- Look at `audit_logs` and `email_logs` daily for failures.
- Reply to every signup personally.
- Keep a list of what people ask for, and don't build anything new until 8 December.

---

## Things that will bite (short version — full list in handoff §5)

- Pushing to `main` deploys straight to production.
- Bump `CACHE_NAME` in `public/sw.js` whenever a file in `/public` changes. Better still,
  give it a new filename, as was done for the logos in `/brand/`.
- `STRIPE_SECRET_KEY` must be a **full** Invoyr Limited `sk_live_` key, not a restricted
  `rk_live_` one.
- Schema changes: apply them to Supabase **and** record them in `supabase/schema.sql`.
- To switch Open Banking on for everyone: set `OPEN_BANKING_LIVE=true` in Vercel and
  redeploy.
