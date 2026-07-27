# Invoyr — Product & Marketing Overview

> A reference brief for creating pitch decks, sales pages, and marketing material.
> Every plan, price, and feature claim here is drawn from the product's source of
> truth (`src/config/plans.ts`) and the internal product docs. Last updated: 27 July 2026.

---

## 1. The one-liner

**Invoyr helps service businesses invoice faster, get paid sooner, and stay in control of their client money — without the weight of accounting software.**

Short variants for headlines:
- "Get paid faster. Invoicing that runs itself."
- "Professional invoicing for people who'd rather be doing the work."
- "From invoice to paid — automatically."

---

## 2. What it is

Invoyr is a SaaS invoicing and payments platform for freelancers, agencies, studios, and service businesses. It covers the full **invoice-to-cash** workflow — create a professional invoice, send it, take payment online, and track what's outstanding — plus expenses, reporting, automation, and a developer platform.

It is deliberately **not** a full accounting suite. There's no payroll, tax filing, or general ledger. That focus is the point: the confidence of a mature finance tool without enterprise complexity. Fast, premium, simple, trustworthy.

---

## 3. Who it's for

| Segment | The pain | How Invoyr helps |
|---|---|---|
| **Freelancers** | Chasing payments, clunky templates, looking unprofessional | Polished invoices, card payments, automatic reminders — all on the £79/yr Starter plan |
| **Agencies & studios** | Multiple clients, retainers, a small team, wanting their own brand | Recurring invoices, white-label, up to 5 seats, reports (Business) |
| **Established service businesses** | Volume, reconciliation, automation, integrations | Open Banking expense import, automation rules, API + webhooks, unlimited team (Pro) |

---

## 4. Why it exists (the problem)

Service businesses lose time and cash to the admin around getting paid: manually chasing overdue invoices, re-keying bank transactions, wrestling with accounting software built for accountants, and looking amateur with plain PDF invoices. Invoyr collapses that into one calm workflow where the invoicing "runs itself" — reminders chase for you, payments reconcile themselves, and the books stay tidy.

---

## 5. Core value propositions (lead with these)

1. **Get paid faster** — Hosted card checkout (Stripe), PayPal, and bank transfer on a single client pay page. Payment status is driven by verified webhooks, never trusted from the browser.
2. **Invoicing that runs itself** — Automated overdue and payment reminders, recurring invoices for retainers, and an event-driven automation rules engine.
3. **Reconciliation without the busywork** — Connect a bank via **Open Banking** and auto-import transactions as categorised expenses (a flagship feature rare at this price point).
4. **Your brand, not ours** — Custom logo and colours on every plan; remove "Powered by Invoyr" and send from your own email domain on higher tiers.
5. **A platform, not a silo** — A public REST API, scoped API keys, and signed webhooks make Invoyr automatable and embeddable.
6. **Trust built in** — Row-level data isolation, webhook-verified payments, a full audit log, GDPR export/deletion, and encrypted bank tokens. An enterprise-grade trust story on an SMB product.

---

## 6. Plans & pricing

All plans are billed **annually** and start with a **7-day free trial** (no card required to try).

| | **Starter** | **Business** — *most popular* | **Pro** |
|---|---|---|---|
| **Price** | **£79 / year** | **£149 / year** | **£249 / year** |
| **Seats** | 1 user | Up to 5 users | Unlimited users |
| **Best for** | Freelancers billing and getting paid | Growing teams that need branding, recurring revenue and insight | Established businesses that want the full platform |

**What's included, by tier** (each tier includes everything in the tier before it):

**Starter** — the essentials to bill and get paid:
- Unlimited invoices & estimates
- Client management
- Custom logo & brand colour
- Credit notes & late fees
- 4 invoice templates, PDF generation & email
- **Card payments (Stripe)**, bank transfer, and the client pay page
- Manual expenses, multi-currency & VAT

**Business** — adds branding, recurring revenue, and team:
- **PayPal payments**
- **White-label** (remove "Powered by Invoyr")
- **Recurring invoices** (retainers/subscriptions)
- **Team members & roles** (up to 5 seats)
- **Advanced reports** (revenue, ageing, top clients)
- **Bulk invoice actions**
- **Client statements**
- **Accounting exports** (QuickBooks & Xero)

**Pro** — the full platform:
- **Open Banking bank sync** → auto-import expenses (TrueLayer)
- **Automation** — automated reminders + rules engine
- **Developer platform** — REST API, API keys, signed webhooks
- **Audit log**
- **Custom email domain** & CSV export
- **Unlimited team members** + priority support

> Accuracy note for copy: **card payments (Stripe) are available on every plan** — position them as core, not a paid unlock. PayPal is the payment method gated to Business+.

---

## 7. Feature breakdown by area

### Invoicing & documents
Unlimited invoices and estimates; issue, send, void, duplicate. Estimates can be approved/rejected online and converted to invoices. Credit notes, late fees, four templates, branded PDFs, multi-currency and VAT. Recurring invoices (Business+) and bulk actions (Business+).

### Getting paid
One public **pay page** per invoice with card (Stripe), PayPal (Business+), and bank transfer. Estimate approval portal for quotes. Refunds against captured payments. Payment state is always webhook-verified.

### Clients & expenses
Central client records with billing history and per-client statements (Business+). Manual expenses with categories and a billable flag. **Open Banking** (Pro) connects a bank and auto-imports transactions as categorised expenses.

### Reporting & exports
A dashboard of headline metrics (revenue, outstanding, overdue, invoice status). Advanced reports and QuickBooks/Xero export (Business+). CSV export (Pro).

### Team & collaboration
Invite teammates with roles and permissions — up to 5 seats on Business, unlimited on Pro. Ownership transfer on all plans.

### Branding & client experience
Custom logo and brand colour on all plans. White-label the invoices and pay/portal pages (Business+). Custom email domain and branded portal (Pro). Bring-your-own SMTP.

### Automation & lifecycle
Automated overdue and payment reminders, plus an automation rules engine that fires on events (invoice sent/paid/overdue, estimate approved/rejected/expired) to email clients or notify the owner (Pro). System emails like a weekly digest run for everyone.

### Developer platform & compliance
Public REST API (`/v1`) with hashed API keys, and signed webhooks across eight event types (invoice sent/paid/void/overdue, estimate approved/rejected, payment received, client created). Full audit log. Self-serve GDPR data export and account deletion.

---

## 8. Integrations

- **Stripe** — card payments (Connect), hosted checkout, and Invoyr's own subscription billing
- **PayPal** — client payments + capture
- **TrueLayer** — Open Banking bank sync → expenses
- **Resend** — transactional and (opt-in) marketing email, custom-domain sending
- **Supabase** — Postgres, Auth, and row-level security on all org data
- **QuickBooks & Xero** — accounting export formats
- **Custom SMTP** — bring your own mail server

---

## 9. How it works (the customer journey)

1. **Set up** — add your business, logo, and brand colour in a short onboarding.
2. **Add a client and create an invoice** — pick a template, add line items, set terms.
3. **Send** — the client gets a branded email with a link to a pay page.
4. **Get paid** — they pay by card, PayPal, or bank transfer; the invoice marks itself paid via webhook.
5. **Stay on top** — reminders chase overdue invoices automatically; the dashboard shows what's outstanding.
6. **Reconcile** — connect your bank (Pro) so spending flows in as categorised expenses; export to QuickBooks/Xero at period end.

---

## 10. Trust & security (proof points for decks)

- **Payments are webhook-verified** — Invoyr never marks an invoice paid from the browser; Stripe/PayPal webhooks are the source of truth.
- **Row-level security** isolates every organisation's data at the database.
- **Encrypted bank tokens** — Open Banking credentials are encrypted at rest (AES-256-GCM).
- **Audit log** of important actions (Pro).
- **GDPR-ready** — self-serve data export and account deletion; marketing email is explicit opt-in.
- **Hardened surface** — rate limiting and CAPTCHA on public forms, security headers, and masked error responses.

---

## 11. Positioning & messaging

**Category:** Invoicing & payments for service businesses (the focused alternative to heavy accounting suites).

**Positioning statement:**
> For freelancers, agencies, and service businesses who are tired of chasing payments and fighting accounting software, Invoyr is an invoicing and payments platform that gets you paid faster and runs the admin for you — with the polish of a premium brand and the trust of a mature finance tool.

**Angles for decks / campaigns:**
- *"Invoicing that runs itself"* — automation-led (reminders, recurring, rules).
- *"Get paid three ways, on one page"* — card, PayPal, bank transfer.
- *"Your bank feed, sorted"* — Open Banking expense import as the Pro hook.
- *"Looks like you, not like us"* — white-label + custom domain.
- *"Built to plug in"* — API + webhooks for the technical buyer.

**Proof-point one-liners:**
- "Payments reconcile themselves — verified by Stripe and PayPal webhooks, never guessed."
- "Connect your bank once; expenses categorise themselves."
- "From £79/year — professional invoicing, card payments, and automatic reminders included."

---

## 12. What Invoyr is deliberately *not*

Not a full accounting suite, payroll system, tax-filing tool, marketplace, or enterprise CRM. Framing this as focus is a strength: Invoyr does invoice-to-cash exceptionally well instead of doing everything adequately.

---

## 13. Quick facts (for slide footnotes)

- 3 plans: Starter £79/yr, Business £149/yr, Pro £249/yr — all billed annually, 7-day free trial
- Seats: 1 / up to 5 / unlimited
- Payments: Stripe (all plans), PayPal (Business+), bank transfer (all)
- Flagship Pro features: Open Banking expense import, automation rules, API + webhooks
- Integrations: Stripe, PayPal, TrueLayer, Resend, Supabase, QuickBooks, Xero
- Marketing site: invoyr.io · App: app.invoyr.io
