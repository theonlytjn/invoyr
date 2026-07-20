---
title: INV-007 Plan Tiers and Marketing Offering
version: 1.0
status: Implemented — code & pricing page aligned
owner: Product / Marketing / Engineering
last_updated: 2026-07-20
---

# INV-007 — Plan Tiers and Marketing Offering

Purpose: a single, accurate source of truth for what Invoyr does, what each paid
tier includes, and the customer-facing differences — so marketing (J) can build
the pricing page and sales copy without guessing, and so `src/config/plans.ts`
and the marketing pages can be reconciled to match.

Tiers: **Starter £79/yr**, **Business £149/yr**, **Pro £249/yr** (all billed
annually). Free/complimentary access is handled separately — see
[INV-006](INV-006-plans-entitlements-and-open-banking.md).

---

## 1. Complete feature inventory

Grouped by area. "Gate" = how access is currently enforced in code.

### Invoicing & billing documents
| Feature | Current gate |
| --- | --- |
| Unlimited invoices (create, issue, send, void, duplicate) | All plans |
| Estimates / quotes (send, approve, reject, convert to invoice) | All plans |
| Credit notes | All plans |
| Recurring invoices | **Business+** (`recurring_invoices`) |
| Bulk invoice actions (bulk send / bulk void) | All plans* |
| 4 invoice templates | All plans |
| PDF generation & email delivery | All plans |
| Late fees (percentage / fixed, auto-applied) | All plans |
| Multi-currency & VAT handling | All plans |

### Getting paid
| Feature | Current gate |
| --- | --- |
| Stripe payments (Stripe Connect) | All plans |
| PayPal payments | All plans |
| Client payment portal (`/pay/[token]`) | All plans |
| Estimate approval portal (`/estimate/[token]`) | All plans |
| Refunds | All plans |

### Clients & expenses
| Feature | Current gate |
| --- | --- |
| Client management | All plans |
| Client statements (PDF + email) | All plans* |
| Expenses (manual entry, categories, billable) | All plans |
| **Open Banking — bank sync & expense import (TrueLayer)** | **Pro** (`open_banking`) |

### Reporting & exports
| Feature | Current gate |
| --- | --- |
| Dashboard (headline metrics) | All plans |
| Advanced reports (revenue, ageing, top clients) | **Business+** (`advanced_reports`) |
| Accounting exports (QuickBooks / Xero) | Reached from Reports (Business+); **API itself ungated** — gap |
| CSV export (invoices) | **Pro** (`csv_export`) |

### Team & collaboration
| Feature | Current gate |
| --- | --- |
| Team members & roles/permissions | **Business+** (`team_members`), cap 5 |
| Unlimited team members | **Pro** (`unlimited_team_members`) |
| Ownership transfer | All plans (owner action) |

### Branding & client experience
| Feature | Current gate |
| --- | --- |
| Custom logo & branding | **Business+** (`custom_branding`) |
| White-label client portal (hide Invoyr branding) | **Pro** (`white_label`) |
| Custom email domain (send from your domain) | **Pro** (`custom_email_domain`) |
| Custom SMTP | All plans (settings/email) |

### Automation & lifecycle
| Feature | Current gate |
| --- | --- |
| Automated payment reminders / overdue reminders | **Pro** (`reminder_automation`) |
| Automation rules engine (settings/automations) | **Pro** (`reminder_automation`) |
| Weekly digest email / trial-ending emails (crons) | All plans (system) |

### Developer & compliance
| Feature | Current gate |
| --- | --- |
| API access + API keys (`/v1/*`) | **Pro** (`api_access`) |
| Webhooks (developer endpoints) | **Pro** (`api_access`) |
| Audit log access | **Pro** (`audit_log`) |
| GDPR data export / account deletion | All plans |

\* Currently ungated in code but a candidate to reserve for a higher tier — see §3.

---

## 2. Mismatches to resolve (marketing copy vs enforced code)

The current marketing pricing page (`src/app/(marketing)/pricing/page.tsx`) does
not match what the app enforces. These must be reconciled:

1. **Free trial length.** Marketing says "14-day free trial" (twice). Code sets
   `trial_period_days: 7` in `api/billing/checkout`. Pick one — 7 or 14 — and
   align both.
2. **Automated reminders.** Marketing lists them under **Business**. Code gates
   them to **Pro** (`reminder_automation`). Decide the tier and align.
3. **Reports.** Marketing sells Starter "Basic reports". Code gives Starter **no**
   reports (the page redirects unless `advanced_reports` = Business+). Either add
   a genuine basic-reports tier for Starter, or drop the claim.
4. **Custom branding.** Enforced at Business+, but the marketing pricing page
   omits it entirely. Add it to the Business column.
5. **Open Banking, CSV export, white-label portal, audit log, API access.** All
   enforced at Pro but absent or vague ("Automation workflows", "Priority
   support") on the marketing page. Surface them explicitly — they are the
   strongest Pro upsells.
6. **Accounting exports (QuickBooks/Xero).** Reachable only from the Business+
   reports page, but the API routes have no entitlement check. Add a gate so the
   tier is actually enforced.

---

## 3. Proposed tier offering (recommended)

Customer-facing structure. Each tier is "everything below, plus…". Items marked
⚙ require a code change from today's enforcement; everything else already matches.

### Starter — £79/year · 1 user
*Everything a freelancer needs to bill and get paid.*
- Unlimited invoices & estimates
- Client management
- Credit notes & late fees
- 4 invoice templates
- Stripe & PayPal payments
- Client payment portal
- PDF generation & email
- Expenses (manual entry)
- Multi-currency & VAT

### Business — £149/year · up to 5 users · *Most popular*
*For growing teams that need branding, recurring revenue and insight.*
Everything in Starter, plus:
- Custom logo & branding
- Recurring invoices
- Team roles & permissions (up to 5 users)
- Advanced reports & ageing
- Accounting exports — QuickBooks & Xero ⚙ (add gate)
- Bulk invoice actions ⚙ (currently all-plan)
- Client statements ⚙ (currently all-plan)

### Pro — £249/year · unlimited users
*The full platform for established businesses.*
Everything in Business, plus:
- **Open Banking — bank sync & expense import**
- Automated payment reminders
- CSV export
- Custom email domain
- White-label client portal
- Audit log
- API access & webhooks
- Unlimited team members
- Priority support

### Decisions J/product must confirm
- Trial length: **7 or 14 days**.
- Do the ⚙ items (accounting exports, bulk actions, client statements) move up to
  Business, or stay available on all plans? Moving them up strengthens the ladder
  but requires new gates.
- Should Starter get a real "basic reports" view, or no reporting at all?

---

## 4. Signed-off decisions (2026-07-20)

- **Trial length: 7 days.** Code already sets 7; marketing copy corrected from "14"
  to "7" across all marketing pages (`page`, `features`, `about`, `use-cases`,
  `pricing`).
- **Bulk invoice actions, client statements, accounting exports → Business+.** New
  `Feature`s added (`bulk_invoice_actions`, `client_statements`,
  `accounting_export`), included in the Business and Pro sets.
- **Starter reporting: dashboard only.** No reports page for Starter; "Basic
  reports" claim dropped. No code change to reports gating.

## 5. What shipped

- `src/config/plans.ts`: three new features added to the union, Business + Pro
  sets, `FEATURE_UPGRADE_TARGET`, `FEATURE_LABELS`; marketing `features[]` arrays
  rewritten to match the tiers above.
- Enforcement (`orgHasFeature` helper in `lib/billing.ts`) added to:
  `api/invoices/bulk/send`, `api/invoices/bulk/void`,
  `api/clients/[id]/statement`, `api/clients/[id]/statement/email`,
  `api/exports/quickbooks`, `api/exports/xero` — all 403 for non-entitled orgs.
- UI gating: invoices bulk selection UI hidden unless `bulk_invoice_actions`
  (`InvoicesTable` `canBulk`); client statement buttons hidden unless
  `client_statements`. Accounting exports already sit on the Business+ reports page.
- `src/app/(marketing)/pricing/page.tsx`: rebuilt dark/editorial per PRODUCT.md,
  imports `PLANS` from config (single source of truth) and renders a full
  feature-comparison matrix. Verified rendering in-browser.

## 5b. Offering revisions (2026-07-20, round 2)

Confirmed by owner while reviewing the matrix:

- **Online card payments (Stripe & PayPal) → Business+.** Starter no longer gets
  Stripe/PayPal card payments; Starter invoices are payable by bank transfer only.
  New `online_payments` feature added to Business + Pro sets.
- **Custom logo & branding → all plans** (added to Starter). Starter can upload a
  logo and set brand colour.
- **"Powered by Invoyr" branding → removed at Business+.** Starter always shows the
  badge on invoices and the online invoice/pay pages; Business & Pro remove it.
  Implemented via the existing `white_label` feature, moved from Pro-only to
  Business+ and relabelled "Remove Invoyr branding".

Config (`plans.ts`), marketing `features[]`, the pricing-page matrix, and the
review sheet (md + Notion) are updated. **Enforcement is not yet complete** — see
Outstanding.

## 5c. Round-2 enforcement (shipped 2026-07-20)

- **Online payments gated to Business+.** Pay portal (`pay/[token]`) hides the
  Stripe & PayPal buttons and shows a subtle "Card payments available on Business
  & Pro" note plus bank-transfer details for Starter. Checkout APIs
  (`api/pay/[token]/checkout`, `.../paypal`, `.../paypal/capture`) 403 non-entitled
  orgs. `settings/payments` shows a Business upsell instead of the connect panels.
- **"Powered by Invoyr" badge is plan-driven.** Added optional `showInvoyrBranding`
  to `InvoiceTemplateProps` (and `ClientStatementPdf`), gated the footer in all
  templates/PDFs, and set the flag = `!white_label` at every render site: PDF route,
  invoice/estimate detail previews, public `pay`/`estimate`/`client` portals, and
  statement PDFs. Badge shows for Starter, hidden for Business+.

## 5d. Payments split (2026-07-20, round 3 — supersedes part of 5b)

Positioning headline is **"get paid faster"**, so Starter must have a fast, automated
payment method. Decision revised:

- **Stripe card payments → all plans** (including Starter). No longer gated. The
  Stripe checkout route and the pay-page Stripe button are open to every plan.
- **PayPal → Business+ only.** The `online_payments` feature was renamed
  `paypal_payments` (Business + Pro). PayPal button on the pay page, the PayPal
  checkout/capture APIs, and the PayPal panel in `settings/payments` are gated on it.
- `settings/payments` now shows the Stripe panel to everyone and only the PayPal
  panel is behind a Business upsell. The client-facing "card payments unavailable"
  note on the pay page was removed (Starter now takes cards via Stripe).

Net: Starter gets one fast automated method (Stripe); more methods (PayPal, and
later others) are the upgrade incentive.

## 6. Outstanding / minor follow-ups

- **In-app editor live previews** (`InvoiceForm`, `EstimateForm`,
  `InvoiceSettingsForm`) still default `showInvoyrBranding` to true, so a Business+
  owner sees the badge in the editor preview only (the real PDF/online output is
  correct). Thread the flag through if desired.
- **Transactional email footer** (`EmailFooter`) still shows "Powered by" for all
  plans — not part of the invoice/online scope; gate later if wanted.
- The rest of the marketing site + shared layout are still light `gray-*` theme;
  only `/pricing` is dark/editorial.
- **Local verification note:** the public pay page couldn't be exercised locally
  (the dev `.env.local` service-role key returns no rows for this project); verify
  on the deployed app. Typecheck is clean and the pricing matrix was verified.



- The rest of the marketing site (`page`, `features`, `about`, `use-cases`) and the
  shared marketing `layout` are still in the old light `gray-*` theme. The pricing
  page is dark/editorial; converting the whole marketing site for consistency is a
  follow-up.
