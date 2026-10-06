import { createElement, type ReactElement } from "react";
import { PREVIEW_DATA } from "./preview-data";

import { WelcomeEmail } from "./transactional/WelcomeEmail";
import { VerifyEmail } from "./transactional/VerifyEmail";
import { PasswordResetEmail } from "./transactional/PasswordResetEmail";
import { InvoiceSentEmail } from "./transactional/InvoiceSentEmail";
import { PaymentReceivedEmail } from "./transactional/PaymentReceivedEmail";
import { PaymentReminderEmail } from "./transactional/PaymentReminderEmail";
import { OverdueReminderEmail } from "./transactional/OverdueReminderEmail";
import { TrialEndingEmail } from "./transactional/TrialEndingEmail";
import { PaymentFailedEmail } from "./transactional/PaymentFailedEmail";
import { TeamInviteEmail } from "./transactional/TeamInviteEmail";

/**
 * Every email that can be previewed, with sample data.
 *
 * Exists so the emails can be reviewed side by side — until now the only way to
 * see one was to trigger the real thing and read your inbox, which is no way to
 * judge a restyle. Templates without preview data are listed in
 * MISSING_PREVIEWS rather than silently omitted.
 */
export interface EmailPreview {
  slug: string;
  title: string;
  description: string;
  element: () => ReactElement;
}

export const EMAIL_PREVIEWS: EmailPreview[] = [
  {
    slug: "invoice-sent",
    title: "Invoice sent",
    description: "To the client when an invoice is sent. The one customers see most.",
    element: () => createElement(InvoiceSentEmail, PREVIEW_DATA.invoiceSent),
  },
  {
    slug: "payment-received",
    title: "Payment received",
    description: "Receipt to the client once they have paid.",
    element: () => createElement(PaymentReceivedEmail, PREVIEW_DATA.paymentReceived),
  },
  {
    slug: "payment-reminder",
    title: "Payment reminder",
    description: "Before the due date, when pre-due reminders are enabled.",
    element: () => createElement(PaymentReminderEmail, PREVIEW_DATA.paymentReminder),
  },
  {
    slug: "overdue-reminder",
    title: "Overdue reminder",
    description: "After the due date, on the overdue schedule.",
    element: () => createElement(OverdueReminderEmail, PREVIEW_DATA.overdueReminder),
  },
  {
    slug: "welcome",
    title: "Welcome",
    description: "To a new account after onboarding.",
    element: () => createElement(WelcomeEmail, PREVIEW_DATA.welcome),
  },
  {
    slug: "verify-email",
    title: "Verify email",
    description: "Confirms a new address at sign-up.",
    element: () => createElement(VerifyEmail, PREVIEW_DATA.verifyEmail),
  },
  {
    slug: "password-reset",
    title: "Password reset",
    description: "The reset link.",
    element: () => createElement(PasswordResetEmail, PREVIEW_DATA.passwordReset),
  },
  {
    slug: "trial-ending",
    title: "Trial ending",
    description: "Three days out and the day before. Same template covers trial ended.",
    element: () => createElement(TrialEndingEmail, PREVIEW_DATA.trialEnding),
  },
  {
    slug: "payment-failed",
    title: "Payment failed",
    description: "When a subscription charge is declined.",
    element: () => createElement(PaymentFailedEmail, PREVIEW_DATA.paymentFailed),
  },
  {
    slug: "team-invite",
    title: "Team invite",
    description: "Invites someone into an organisation.",
    element: () => createElement(TeamInviteEmail, PREVIEW_DATA.teamInvite),
  },
];

/**
 * Templates that exist but have no preview data yet. Listed so the gap is
 * visible rather than looking like the template doesn't exist.
 */
export const MISSING_PREVIEWS = [
  "Admin welcome",
  "Automation",
  "Client statement",
  "Credit note",
  "Estimate sent",
  "Estimate response",
  "Invoice paid (to you)",
  "Subscription activated",
  "Weekly digest",
  "Newsletter (marketing)",
  "Product update (marketing)",
  "Win-back (marketing)",
];
