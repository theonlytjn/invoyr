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
