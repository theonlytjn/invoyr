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
    invoiceTotal: "£2,400.00",
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
    firstName: "Alex",
    ctaUrl: "https://app.invoyr.io/settings/billing",
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
};
