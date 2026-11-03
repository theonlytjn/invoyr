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
| ✓ | **Founder signature** and photo: done (`public/brand/tn-signature.svg`, `public/founder.jpg`). | Done |
| ✓ | **Email open tracking: decided 28 Oct — disclose it.** New section 5 of the Privacy Policy. The lawyer should still check it (see the solicitor brief below). | Done |
| ☐ | **Decide on the "preference centre" sentence** in the Privacy Policy. Either build a marketing-emails toggle or reword the sentence. | 31 Oct |
| ☐ | **Register a DMCA agent** ($6, US Copyright Office). | Nov |
| ☐ | **Add the registered office address** in Settings → Company for each real org, so it prints on PDFs. | Any time |
| ☐ | **Local `.env.local`**: swap in the Invoyr Limited `sk_live_`/`sk_test_` key and set `NEXT_PUBLIC_SUPABASE_URL=https://auth.invoyr.io`. | Before local work |
| ☐ | **Stripe housekeeping:** refund the £1.20 test (INV-0016) if wanted, and re-add the WHMCS webhook if you still use it. You can also roll the unused "Invoyr Keys" key on TJN's account. | Any time |
| ☐ | **Comped orgs:** make sure none of the four comped orgs also has a live Stripe subscription. A comp does not stop Stripe billing. | Before launch |

| ✓ | **Monthly prices:** live 3 Nov. `STRIPE_PRICE_ID_{STARTER,BUSINESS,PRO}_MONTHLY` set in Vercel (production only; add to preview if preview deploys need monthly checkout). | Done |
| ☐ | **Stripe customer portal:** check plan switching is off in the portal settings, so plan changes only go through Billing in the app (which avoids a second subscription). | Before launch |

### VAT (decided 3 Nov)

Invoyr Limited is not VAT registered, so no VAT is charged and the pricing pages say
nothing about VAT. Registration becomes compulsory once taxable turnover passes £90,000 in
any rolling 12 months. When registering: add the VAT number in Stripe Tax, set prices to
tax-exclusive, ask Claude to turn on `automatic_tax` in checkout and change
`PRICING_FOOTNOTE` in `src/config/plans.ts` to "Prices exclude VAT".

### Early Adopter programme (updated 3 Nov)

- Page: `invoyr.io/early-access`: your letter, signature, the offer, the product bentos and
  plans. Not in the menu or search engines; share the link.
- Code `FOUNDING` (added automatically by the page's buttons): **30-day trial**, card taken,
  up to 50 businesses.
- **25% off the first yearly payment**, offered in Billing from 7 days before the trial ends
  until 14 days after. One click moves them to the yearly price of their plan with a Stripe
  coupon (`EARLY-YEARLY-25`, created on first claim, applies once). The trial reminder
  emails (3 days and 1 day out) mention it. If they don't claim it, they pay the normal
  price for the plan they picked.
- Codes live in Supabase → Table editor → `trial_codes` (`trial_days`, `max_redemptions`,
  `expires_at`, `active`, `yearly_offer_percent`). Who used which code, and who claimed the
  offer, is in `trial_code_redemptions`.
- If you change the offer, update `src/config/early-access.ts` too (page copy and window).
- Founder signature: done (`public/brand/tn-signature.svg`, also on About).

### Solicitor brief (what to ask them to confirm)

Send them `/terms`, `/privacy` and `/dpa` and ask for sign-off on these seven points:

1. **Liability cap** in the Terms: is it enforceable and pitched right for a B2B SaaS?
2. **DPA audit clause:** is it reasonable for a one-person company to honour?
3. **International transfers:** is there a valid mechanism (IDTA, Addendum or SCCs) for
   each US provider (Vercel, Resend, Stripe, PayPal, Cloudflare, Upstash)? The policy
   says data is stored in Frankfurt.
4. **Email open tracking** (Privacy §5, added 28 Oct). Invoyr stores only the first-open
   time; Resend sees the IP address and email client. Questions for them:
   - Is the processor framing right?
   - Does PECR regulation 6 (which the ICO applies to tracking pixels) mean recipients
     must consent, or that customers must collect that consent?
   - Should the DPA's processing description mention it too?
5. **"Preference centre" sentence** (Privacy §3) says consent can be withdrawn "in your
   settings", but no such setting exists. Agree new wording, or we build the toggle.
6. **Trial auto-renewal:** the last onboarding step now says the price and that it renews
   automatically until cancelled, and Stripe Checkout shows its own notice. The 90-day
   early-access trial is the same mechanism.
7. **Early adopter offer:** the 25% yearly offer is mentioned inside the trial reminder
   emails (treated as billing notices, not marketing). Is that fine under PECR, or does it
   need marketing consent? Is that enough under the new UK subscription
   rules (DMCC Act 2024)?

Already done: Chop Life subscription cancelled ✓ · Cakes By Kels logo re-uploaded ✓ ·
Stripe webhooks ✓ · Supabase custom domain ✓ · Rate limiting ✓

---

## 2. Code to finish (Claude can do these; say "do section 2")

### Must fix before launch — ✓ all done 28 Oct (commit 7aa75cb)

- ✓ **Settings forms** (`BrandingForm`, `InvoiceSettingsForm`, logo) now save through
  `/api/settings/branding`, `/branding/logo` and `/invoices`, with Zod and the shared
  `requireSettingsAccess` gate.
- ✓ **Estimates and recurring invoices** write new lines before removing old ones
  (`src/lib/line-items.ts`). Create and convert undo the header if lines fail.
- ✓ **Team flows:** the invite stays usable if joining fails; ownership transfer is one
  transaction (`transfer_org_ownership`); account delete checks every step, cancels any
  Stripe subscription, removes stored files, and deletes the login last.
- ✓ **`email_logs` inserts** are checked and retried (`src/lib/resend/email-log.ts`).
  - The missing `resend_id`s were not a bug: every one came from an org that sends
    through its own SMTP server, which has no Resend id.
- ✓ **Document numbers** are claimed atomically (`claim_document_number`). This was worse
  than listed: a non-owner's invoice never moved the counter on (owner-only RLS), and the
  recurring job gave two schedules due on the same day the same number. New invoices now
  take their number at save, so an abandoned form doesn't burn one.
- ✓ Found along the way: overdue reminders quoted the invoice total rather than the
  outstanding balance. Fixed.

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
