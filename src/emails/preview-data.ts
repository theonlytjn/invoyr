import { PLAN_MAP } from "@/config/plans";
import type { InvoiceSentEmailProps } from "./transactional/InvoiceSentEmail";
import type { PaymentReceivedEmailProps } from "./transactional/PaymentReceivedEmail";
import type { PaymentReminderEmailProps } from "./transactional/PaymentReminderEmail";
import type { OverdueReminderEmailProps } from "./transactional/OverdueReminderEmail";
import type { WelcomeEmailProps } from "./transactional/WelcomeEmail";
import type { VerifyEmailProps } from "./transactional/VerifyEmail";
import type { PasswordResetEmailProps } from "./transactional/PasswordResetEmail";
import type { TrialEndingEmailProps } from "./transactional/TrialEndingEmail";
import type { PaymentFailedEmailProps } from "./transactional/PaymentFailedEmail";
import type { TeamInviteEmailProps } from "./transactional/TeamInviteEmail";
import type { AdminWelcomeEmailProps } from "./transactional/AdminWelcomeEmail";
import type { AutomationEmailProps } from "./transactional/AutomationEmail";
import type { ClientStatementEmailProps } from "./transactional/ClientStatementEmail";
import type { CreditNoteEmailProps } from "./transactional/CreditNoteEmail";
import type { EstimateSentEmailProps } from "./transactional/EstimateSentEmail";
import type { EstimateResponseEmailProps } from "./transactional/EstimateResponseEmail";
import type { InvoicePaidOwnerEmailProps } from "./transactional/InvoicePaidOwnerEmail";
import type { SubscriptionActivatedEmailProps } from "./transactional/SubscriptionActivatedEmail";
import type { WeeklyDigestEmailProps } from "./transactional/WeeklyDigestEmail";
import type { NewsletterEmailProps } from "./marketing/NewsletterEmail";
import type { ProductUpdateEmailProps } from "./marketing/ProductUpdateEmail";
import type { WinBackEmailProps } from "./marketing/WinBackEmail";
import type { SignupFollowUpEmailProps } from "./transactional/SignupFollowUpEmail";

export const PREVIEW_DATA = {
  welcome: {
    firstName: "Alex",
    ctaUrl: "https://app.invoyr.io/onboarding",
  } satisfies WelcomeEmailProps,

  verifyEmail: {
    firstName: "Alex",
    verifyUrl: "https://app.invoyr.io/auth/verify?token=example",
  } satisfies VerifyEmailProps,

  passwordReset: {
    firstName: "Alex",
    resetUrl: "https://app.invoyr.io/auth/reset?token=example",
  } satisfies PasswordResetEmailProps,

  invoiceSent: {
    clientName: "Sarah Johnson",
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    invoiceNumber: "INV-0012",
    invoiceTotal: "£2,160.00",
    totalBeforeDiscount: "£2,400.00",
    discount: "£240.00",
    discountReason: "10% returning client discount",
    issueDate: "19 Jun 2026",
    dueDate: "3 Jul 2026",
    payUrl: "https://app.invoyr.io/pay/abc123",
    bankDetails: {
      accountName: "Acme Studio Ltd",
      bankName: "Barclays",
      accountNumber: "12345678",
      sortCode: "20-00-00",
    },
  } satisfies InvoiceSentEmailProps,

  paymentReceived: {
    clientName: "Sarah Johnson",
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    invoiceNumber: "INV-0012",
    amountPaid: "£2,400.00",
    receiptUrl: "https://app.invoyr.io/pay/abc123",
  } satisfies PaymentReceivedEmailProps,

  paymentReminder: {
    clientName: "Sarah Johnson",
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    invoiceNumber: "INV-0012",
    dueDate: "3 Jul 2026",
    balanceDue: "£2,400.00",
    payUrl: "https://app.invoyr.io/pay/abc123",
  } satisfies PaymentReminderEmailProps,

  overdueReminder: {
    clientName: "Sarah Johnson",
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    invoiceNumber: "INV-0012",
    dueDate: "1 Jun 2026",
    balanceDue: "£2,400.00",
    payUrl: "https://app.invoyr.io/pay/abc123",
  } satisfies OverdueReminderEmailProps,

  trialEnding: {
    firstName: "Sarah",
    ctaUrl: "https://app.invoyr.io/settings/billing",
    state: "ending",
    daysLeft: 3,
    endsOn: "3 October",
    willBeCharged: true,
    orgName: "Invoyr",
  } satisfies TrialEndingEmailProps,

  paymentFailed: {
    firstName: "Alex",
    ctaUrl: "https://app.invoyr.io/settings/billing",
  } satisfies PaymentFailedEmailProps,

  teamInvite: {
    inviterName: "Jordan Lee",
    orgName: "Acme Studio",
    inviteUrl: "https://app.invoyr.io/invite/abc123",
  } satisfies TeamInviteEmailProps,

  adminWelcome: {
    firstName: "Alex",
    orgName: "Acme Studio",
    email: "alex@acmestudio.co.uk",
    tempPassword: "Tq7-mZp4-Xr2k",
    loginUrl: "https://app.invoyr.io/login",
  } satisfies AdminWelcomeEmailProps,

  automation: {
    recipientName: "Sarah Johnson",
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    subject: "Invoice INV-0012 is 7 days overdue",
    body: "Hi Sarah Johnson,\nJust a quick note that invoice INV-0012 for £2,400.00 is now 7 days overdue.\nIf you've already paid, please ignore this message. Otherwise you can settle it online using the link below.\nThanks,\nAcme Studio",
    ctaUrl: "https://app.invoyr.io/pay/abc123",
    ctaLabel: "View invoice",
  } satisfies AutomationEmailProps,

  clientStatement: {
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    clientName: "Sarah Johnson",
    statementDate: "30 Jun 2026",
    invoices: [
      {
        invoiceNumber: "INV-0009",
        issueDate: "2 Apr 2026",
        dueDate: "16 Apr 2026",
        status: "paid",
        total: 1800,
        amountPaid: 1800,
        balance: 0,
      },
      {
        invoiceNumber: "INV-0010",
        issueDate: "1 May 2026",
        dueDate: "15 May 2026",
        status: "partial",
        total: 1250,
        amountPaid: 500,
        balance: 750,
      },
      {
        invoiceNumber: "INV-0011",
        issueDate: "18 May 2026",
        dueDate: "1 Jun 2026",
        status: "overdue",
        total: 960,
        amountPaid: 0,
        balance: 960,
      },
      {
        invoiceNumber: "INV-0012",
        issueDate: "19 Jun 2026",
        dueDate: "3 Jul 2026",
        status: "sent",
        total: 2400,
        amountPaid: 0,
        balance: 2400,
      },
    ],
    totalBilled: 6410,
    totalPaid: 2300,
    outstanding: 4110,
    currency: "GBP",
  } satisfies ClientStatementEmailProps,

  creditNote: {
    clientName: "Sarah Johnson",
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    creditNoteNumber: "CN-0003",
    amount: "£240.00",
    reason: "Two hours of design time billed twice",
    invoiceNumber: "INV-0012",
    payUrl: "https://app.invoyr.io/pay/abc123",
  } satisfies CreditNoteEmailProps,

  estimateSent: {
    clientName: "Sarah Johnson",
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    estimateNumber: "EST-0004",
    estimateTotal: "£3,600.00",
    issueDate: "12 Jun 2026",
    expiryDate: "12 Jul 2026",
    viewUrl: "https://app.invoyr.io/estimate/abc123",
  } satisfies EstimateSentEmailProps,

  estimateApproved: {
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    estimateNumber: "EST-0004",
    clientName: "Sarah Johnson",
    estimateTotal: "£3,600.00",
    issueDate: "12 Jun 2026",
    response: "approved",
    viewUrl: "https://app.invoyr.io/estimates/abc123",
  } satisfies EstimateResponseEmailProps,

  estimateDeclined: {
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    estimateNumber: "EST-0004",
    clientName: "Sarah Johnson",
    estimateTotal: "£3,600.00",
    issueDate: "12 Jun 2026",
    response: "rejected",
    viewUrl: "https://app.invoyr.io/estimates/abc123",
  } satisfies EstimateResponseEmailProps,

  invoicePaidOwner: {
    firstName: "Alex",
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    invoiceNumber: "INV-0012",
    clientName: "Sarah Johnson",
    amountPaid: "£2,400.00",
    paidAt: "28 Jun 2026",
    viewUrl: "https://app.invoyr.io/invoices/abc123",
  } satisfies InvoicePaidOwnerEmailProps,

  subscriptionActivated: {
    firstName: "Alex",
    planName: "Invoyr Business",
    highlights: PLAN_MAP.business.highlights,
    ctaUrl: "https://app.invoyr.io/dashboard",
  } satisfies SubscriptionActivatedEmailProps,

  weeklyDigest: {
    ownerName: "Alex",
    orgName: "Acme Studio",
    accentColor: "#2563eb",
    outstanding: "£4,110.00",
    overdueCount: 2,
    overdueAmount: "£1,710.00",
    collectedLastWeek: "£1,800.00",
    issuedLastWeek: 3,
    dashboardUrl: "https://app.invoyr.io/dashboard",
    weekEnding: "29 June 2026",
  } satisfies WeeklyDigestEmailProps,

  newsletter: {
    firstName: "Alex",
    subject: "Three ways to get paid faster this quarter",
    bodyHtml:
      '<p style="font-size:15px;line-height:1.6;margin:0 0 16px">Late payments are the most common thing we hear about from small businesses. Here are three habits that make the biggest difference:</p>' +
      '<p style="font-size:15px;line-height:1.6;margin:0 0 8px"><strong>1. Invoice the day the work is done.</strong> The longer you wait, the longer you wait to be paid.</p>' +
      '<p style="font-size:15px;line-height:1.6;margin:0 0 8px"><strong>2. Turn on card payments.</strong> Clients who can pay in one click usually do.</p>' +
      '<p style="font-size:15px;line-height:1.6;margin:0 0 16px"><strong>3. Let reminders do the chasing.</strong> A polite nudge three days before the due date saves an awkward call later.</p>',
    ctaLabel: "Set up reminders",
    ctaUrl: "https://app.invoyr.io/settings/invoices",
    unsubscribeUrl: "https://app.invoyr.io/api/email/unsubscribe?token=example",
  } satisfies NewsletterEmailProps,

  productUpdate: {
    firstName: "Alex",
    updateTitle: "Estimates your clients can approve online",
    updateSummary:
      "Send an estimate, let your client approve or decline it from a link, and turn it into an invoice in one click.",
    features: [
      "Online approval and decline for estimates",
      "One-click conversion from estimate to invoice",
      "Credit notes that update the invoice balance automatically",
      "Client statements with a PDF attached",
    ],
    ctaUrl: "https://app.invoyr.io/estimates",
    unsubscribeUrl: "https://app.invoyr.io/api/email/unsubscribe?token=example",
  } satisfies ProductUpdateEmailProps,

  winBack: {
    firstName: "Alex",
    ctaUrl: "https://app.invoyr.io/dashboard",
    unsubscribeUrl: "https://app.invoyr.io/api/email/unsubscribe?token=example",
    variant: "day0",
  } satisfies WinBackEmailProps,

  signupFollowUp: {
    firstName: "Alex",
    roadmapUrl: "https://invoyr.io/roadmap",
  } satisfies SignupFollowUpEmailProps,
};
