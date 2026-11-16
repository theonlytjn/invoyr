---
title: INV-003 Communication and Resend System
version: 1.0
status: Foundation
owner: Product / Engineering / Lifecycle Marketing
last_updated: 2026-06-19
---

# INV-003 — Communication and Resend System

## 1. Goal

Build a complete Invoyr communication platform covering transactional emails, lifecycle marketing, in-app notifications and future SMS/WhatsApp support.

For v1, implement email first using Resend and React Email.

## 2. Communication categories

### Transactional
Triggered by product events. Required for core operations.

Examples:

- account verification
- welcome email
- password reset
- invoice sent
- payment received
- payment reminder
- overdue reminder
- receipt
- team invite
- subscription/payment failed

### Lifecycle marketing
Triggered by user state and consent.

Examples:

- onboarding tips
- product updates
- feature announcements
- win-back campaigns
- referral campaigns
- newsletters

### System/admin
Internal notifications.

Examples:

- new signup
- failed webhook
- failed email send
- payment mismatch

## 3. Email design system

All email templates must use shared components:

```txt
EmailShell
EmailHeader
EmailFooter
EmailButton
EmailCard
EmailCallout
InvoiceSummary
PaymentSummary
Divider
Signature
```

### Branding (Nov 2026)

- **Colours** come from `src/emails/theme.ts` (`EMAIL_COLORS`). It mirrors the brand
  palette in `globals.css`: navy `#081026`, lime `#8CD600` and the navy-tinted neutrals.
  Email clients can't read CSS variables, so this file is the email token layer. Never
  put hex values in templates.
- **Two header modes** (`EmailHeader`):
  - *Invoyr's own emails* (no `orgName`: welcome, verify, password reset, trial ending,
    weekly digest, invoice paid (to the owner), billing, team invite, marketing): a
    full-width banner with the reversed wordmark on the left and the tagline ("Get paid
    faster. / Invoicing that runs itself.") on the right, over the homepage hero photo
    tinted navy, with a lime rule beneath. It is one flat JPG
    (`public/brand/invoyr-email-banner.jpg`), because Outlook desktop and some Gmail
    setups drop CSS background images. Rebuild it with `scripts/build-email-banner.sh
    [hero image] [crop gravity]`.
  - *Emails sent for an organisation* (invoice, reminders, estimates, receipts, credit
    notes, statements, automations): the org's logo or name, ruled in the org's accent
    colour. Button labels switch to dark text when the org colour is light.
- **Footer**: "Sent with" plus the Invoyr wordmark, the legal entity and address, and
  links to the site, support and (marketing only) unsubscribe.
- **Logo**: emails use PNG wordmarks (`public/brand/invoyr-logo-email*.png`,
  `BRAND.emailLogoUrl`). Gmail, Outlook and Yahoo block SVG images.
- **Supabase Auth emails** (signup confirmation, password reset) are sent by Supabase,
  not the app. They are generated from `VerifyEmail` / `PasswordResetEmail` by
  `npx tsx scripts/build-auth-email-templates.tsx` into `supabase/templates/`, then
  pasted into Supabase Dashboard → Authentication → Emails → Templates. Re-run and
  re-paste whenever those two emails change.

### Founder notes (Nov 2026)

Personal, signed notes from the founder asking for feedback by reply or on the
public roadmap (INV-009). One template, `FounderNoteEmail` (`note: "signup" |
"trialEnded"`), copy in `FOUNDER_NOTE_COPY` (`src/config/email-copy.ts`), sending
in `src/lib/founder-notes/send.ts`. Both come from "Tony from Invoyr" at the
normal sending address, reply-to support@invoyr.io, always via Invoyr's Resend
account (`skipOrgSmtp`), once per address per kind, ever (checked against
`email_logs`, failing safe). No offer or promotion, so they are sent as
transactional relationship email.

- **Signup follow-up** (`signup-follow-up`): `/api/cron/signup-follow-up`, daily
  at 10:00 UTC, to everyone whose profile was created 72–96 hours earlier,
  including people who never finished onboarding (logged with `org_id` null and
  their `user_id`). Invited teammates are skipped.
- **Trial ended follow-up** (`trial-ended-follow-up`):
  `/api/cron/trial-ended-follow-up`, daily at 10:15 UTC, to the owner of each org
  whose trial ended 72–96 hours earlier with status `trialing`, `canceled` or
  `incomplete`. Skipped when `past_due` (they tried to pay; the payment-failed
  email covers it) or comped. "Sorry to see you go, what got in the way?", with
  a button to the roadmap's suggest form (`/roadmap?suggest=1`).
- `email_logs.org_id` is nullable and the table has `user_id` (migration
  `email_logs_user_scoped`, 15 Nov 2026). Before this, production had `org_id`
  NOT NULL and no `user_id`, so the marketing sender's log writes were failing.

### Fixes from the full preview pass (15 Nov 2026)

- `InvoiceSummary` takes a `kind` (`invoice | estimate | payment`) and reads its row
  labels from `SUMMARY_LABELS`, so estimates say "Estimate" / "Valid until" and the
  owner's payment email says "Paid on" / "Amount paid".
- Subscription activated lists the purchased plan's `highlights` from
  `src/config/plans.ts` (it used to promise Pro features to every plan).
- Weekly digest greets by first name.
- Automation emails format `{{amount}}` as currency ("£2,400.00"), fill
  `{{recipient_name}}` in subject and body, and greet the owner by first name on
  owner notifications.
- Win-back, product update and subscription copy moved to `src/config/email-copy.ts`.
  Win-back day 7 no longer promises a free month (no such offer exists in billing).
- Still open: the marketing emails (newsletter, product update, win-back) are not
  sent from anywhere yet.

## 4. Template rules

- Do not hardcode copy inside layout components.
- Keep text content in `content.ts` or per-template config files.
- Every template must have typed props.
- Every template must support preview data.
- Every email must render well on mobile.
- Every marketing email must include unsubscribe handling.
- Every transactional send must write to `email_logs`.

## 5. Recommended email folder structure

```txt
src/emails/
  components/
    EmailShell.tsx
    EmailHeader.tsx
    EmailFooter.tsx
    EmailButton.tsx
    EmailCard.tsx
    EmailCallout.tsx
    InvoiceSummary.tsx
  layouts/
    TransactionalLayout.tsx
    MarketingLayout.tsx
  transactional/
    WelcomeEmail.tsx
    VerifyEmail.tsx
    PasswordResetEmail.tsx
    InvoiceSentEmail.tsx
    InvoiceViewedEmail.tsx
    PaymentReceivedEmail.tsx
    PaymentReminderEmail.tsx
    OverdueReminderEmail.tsx
    ReceiptEmail.tsx
    TrialStartedEmail.tsx
    TrialEndingEmail.tsx
    PaymentFailedEmail.tsx
    TeamInviteEmail.tsx
  marketing/
    NewsletterEmail.tsx
    ProductUpdateEmail.tsx
    FeatureLaunchEmail.tsx
    WinBackEmail.tsx
  registry.ts
  preview-data.ts
```

## 6. Transactional email list

### Welcome Email

Trigger: user signs up.

Subject: Welcome to Invoyr

Preview: Your invoicing workspace is ready.

Body:

Hi {{firstName}},

Welcome to Invoyr — your new workspace for creating invoices, managing clients and getting paid faster.

Start by adding your business details, uploading your logo and creating your first client.

CTA: Set up my workspace

### Verify Email

Trigger: signup requiring verification.

Subject: Verify your email address

Preview: Confirm your email to finish setting up Invoyr.

Body:

Hi {{firstName}},

Please verify your email address so we can secure your Invoyr account and complete your setup.

CTA: Verify email

### Password Reset

Trigger: user requests reset.

Subject: Reset your Invoyr password

Preview: Use this secure link to reset your password.

Body:

Hi {{firstName}},

We received a request to reset your Invoyr password. Use the button below to choose a new password.

If this was not you, you can ignore this email.

CTA: Reset password

### Invoice Sent

Trigger: user sends invoice to client.

Subject: Invoice {{invoiceNumber}} from {{organisationName}}

Preview: {{organisationName}} has sent you an invoice for {{invoiceTotal}}.

Body:

Hi {{clientName}},

{{organisationName}} has sent you invoice {{invoiceNumber}} for {{invoiceTotal}}.

You can view the invoice, download a PDF and pay securely using the link below.

CTA: View and pay invoice

### Payment Received

Trigger: Stripe webhook or manual payment confirmation.

Subject: Payment received for invoice {{invoiceNumber}}

Preview: We’ve recorded your payment of {{amountPaid}}.

Body:

Hi {{clientName}},

Thank you — your payment of {{amountPaid}} for invoice {{invoiceNumber}} has been received.

You can view your receipt using the link below.

CTA: View receipt

### Payment Reminder

Trigger: invoice is approaching due date or overdue cadence.

Subject: Reminder: invoice {{invoiceNumber}} is due {{dueDate}}

Preview: A quick reminder about your outstanding invoice.

Body:

Hi {{clientName}},

This is a quick reminder that invoice {{invoiceNumber}} from {{organisationName}} is due {{dueDate}}.

Amount due: {{balanceDue}}

CTA: View and pay invoice

### Overdue Reminder

Trigger: invoice overdue by configured cadence.

Subject: Overdue invoice {{invoiceNumber}}

Preview: This invoice is now overdue.

Body:

Hi {{clientName}},

Invoice {{invoiceNumber}} from {{organisationName}} is now overdue.

Amount due: {{balanceDue}}

Please use the secure link below to view and pay the invoice.

CTA: Pay overdue invoice

### Trial Ending

Trigger: trial ending in 3 days.

Subject: Your Invoyr trial ends soon

Preview: Choose a plan to keep your workspace active.

Body:

Hi {{firstName}},

Your Invoyr trial is ending soon. Choose a plan to keep creating invoices, managing clients and collecting payments without interruption.

CTA: Choose my plan

### Payment Failed

Trigger: Stripe subscription invoice payment failed.

Subject: Payment failed for your Invoyr subscription

Preview: Please update your billing details to keep your account active.

Body:

Hi {{firstName}},

We could not process the latest payment for your Invoyr subscription.

Please update your billing details to avoid interruption to your account.

CTA: Update billing details

### Team Invite

Trigger: organisation owner/admin invites teammate.

Subject: You’ve been invited to {{organisationName}} on Invoyr

Preview: Join your team workspace on Invoyr.

Body:

Hi,

{{inviterName}} has invited you to join {{organisationName}} on Invoyr.

Use the link below to accept the invite and access the workspace.

CTA: Accept invite

## 7. Lifecycle marketing journeys

### Onboarding sequence

```txt
Day 0: Welcome / workspace setup
Day 1: Add your first client
Day 3: Create and send your first invoice
Day 5: Connect Stripe to get paid faster
Day 7: Understand dashboard and payment tracking
Day 12: Set up reminders and recurring invoices
```

### Win-back sequence

```txt
Trigger: trial expired or cancelled account
Day 0: We saved your workspace
Day 3: What you can still do with Invoyr
Day 7: Special return offer or upgrade CTA
```

### Product update sequence

```txt
Monthly or major release only
Audience: opted-in users
Content: new features, fixes, tips, roadmap
CTA: Open Invoyr
```

## 8. Resend implementation

Create:

```txt
src/lib/resend/client.ts
src/lib/resend/send-transactional-email.ts
src/lib/resend/send-marketing-email.ts
src/lib/resend/sync-audience.ts
src/app/api/resend/webhook/route.ts
```

### Transactional send contract

```ts
sendTransactionalEmail({
  orgId,
  invoiceId,
  to,
  subject,
  templateName,
  react,
})
```

Responsibilities:

- send through Resend
- capture Resend ID
- insert `email_logs`
- return success/failure object
- never throw raw provider errors to user UI

## 9. Database additions needed

The current `email_logs` table is a good start. Add later:

```txt
email_preferences
email_templates
email_template_versions
marketing_contacts
marketing_events
notification_queue
```

## 10. Acceptance criteria

- React Email templates render locally.
- All core transactional templates exist.
- A central email registry maps template names to components and content.
- Resend send function works with typed props.
- Email logs are written for each transactional send.
- Marketing emails are blocked without consent.
- Unsubscribe handling exists before any broadcast is sent.

### Invoice compose box (Nov 2026)

"Send to client…" on the invoice page opens `SendInvoiceDialog`: To (read-only), CC
(prefilled from the client's "Also send invoices to"), Subject (prefilled) and an optional
Message, shown in the email as "A note from {org}" above the summary. All invoice sends
(single, bulk, recurring auto-send) go through `sendInvoiceEmail`
(`src/lib/invoices/send-invoice-email.ts`), which validates the compose fields with Zod,
always links to the client's `/pay/{token}` page (never the owner's dashboard), logs, and
fires automations and webhooks. InvoiceSentEmail copy lives in `INVOICE_SENT_COPY`.
