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
import { AdminWelcomeEmail } from "./transactional/AdminWelcomeEmail";
import { AutomationEmail } from "./transactional/AutomationEmail";
import { ClientStatementEmail } from "./transactional/ClientStatementEmail";
import { CreditNoteEmail } from "./transactional/CreditNoteEmail";
import { EstimateSentEmail } from "./transactional/EstimateSentEmail";
import { EstimateResponseEmail } from "./transactional/EstimateResponseEmail";
import { InvoicePaidOwnerEmail } from "./transactional/InvoicePaidOwnerEmail";
import { SubscriptionActivatedEmail } from "./transactional/SubscriptionActivatedEmail";
import { WeeklyDigestEmail } from "./transactional/WeeklyDigestEmail";
import { NewsletterEmail } from "./marketing/NewsletterEmail";
import { ProductUpdateEmail } from "./marketing/ProductUpdateEmail";
import { WinBackEmail } from "./marketing/WinBackEmail";
import { FounderNoteEmail } from "./transactional/FounderNoteEmail";

/**
 * Every email that can be previewed, with sample data.
 *
 * Exists so the emails can be reviewed side by side — until now the only way to
 * see one was to trigger the real thing and read your inbox, which is no way to
 * judge a restyle. Every template in transactional/ and marketing/ should have
 * an entry here.
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
  {
    slug: "invoice-paid-owner",
    title: "Invoice paid (to you)",
    description: "To the org owner when a client pays online through Stripe or PayPal. Not sent for payments recorded by hand.",
    element: () => createElement(InvoicePaidOwnerEmail, PREVIEW_DATA.invoicePaidOwner),
  },
  {
    slug: "credit-note",
    title: "Credit note",
    description: "To the client when a credit note is issued against an invoice, if emailing is ticked.",
    element: () => createElement(CreditNoteEmail, PREVIEW_DATA.creditNote),
  },
  {
    slug: "client-statement",
    title: "Client statement",
    description: "To the client when a statement of account is emailed from their page, with the PDF attached.",
    element: () => createElement(ClientStatementEmail, PREVIEW_DATA.clientStatement),
  },
  {
    slug: "estimate-sent",
    title: "Estimate sent",
    description: "To the client when an estimate is sent, with a link to approve or decline it.",
    element: () => createElement(EstimateSentEmail, PREVIEW_DATA.estimateSent),
  },
  {
    slug: "estimate-approved",
    title: "Estimate approved",
    description: "To the org owner when a client approves an estimate.",
    element: () => createElement(EstimateResponseEmail, PREVIEW_DATA.estimateApproved),
  },
  {
    slug: "estimate-declined",
    title: "Estimate declined",
    description: "To the org owner when a client declines an estimate. Same template as approved.",
    element: () => createElement(EstimateResponseEmail, PREVIEW_DATA.estimateDeclined),
  },
  {
    slug: "automation",
    title: "Automation",
    description: "Sent by an automation rule, to the client or the owner, with the rule's own subject and body.",
    element: () => createElement(AutomationEmail, PREVIEW_DATA.automation),
  },
  {
    slug: "weekly-digest",
    title: "Weekly digest",
    description: "To the org owner every Monday at 8am, unless there was nothing to report.",
    element: () => createElement(WeeklyDigestEmail, PREVIEW_DATA.weeklyDigest),
  },
  {
    slug: "signup-follow-up",
    title: "Signup follow-up",
    description: "From the founder about three days after signup, including to people who never finished onboarding: thanks, and a request for feedback via reply or the roadmap.",
    element: () => createElement(FounderNoteEmail, PREVIEW_DATA.signupFollowUp),
  },
  {
    slug: "trial-ended-follow-up",
    title: "Trial ended follow-up",
    description: "From the founder to the owner three days after a trial ends unpaid (not past due, not comped): what got in the way, with a link to suggest an improvement on the roadmap.",
    element: () => createElement(FounderNoteEmail, PREVIEW_DATA.trialEndedFollowUp),
  },
  {
    slug: "subscription-activated",
    title: "Subscription activated",
    description: "To the org owner after a subscription checkout completes.",
    element: () => createElement(SubscriptionActivatedEmail, PREVIEW_DATA.subscriptionActivated),
  },
  {
    slug: "admin-welcome",
    title: "Admin welcome",
    description: "To a new owner when an Invoyr admin creates their account, with a temporary password.",
    element: () => createElement(AdminWelcomeEmail, PREVIEW_DATA.adminWelcome),
  },
  {
    slug: "newsletter",
    title: "Newsletter (marketing)",
    description: "Marketing email to consenting subscribers. Not sent from anywhere in the app yet.",
    element: () => createElement(NewsletterEmail, PREVIEW_DATA.newsletter),
  },
  {
    slug: "product-update",
    title: "Product update (marketing)",
    description: "Feature announcement to consenting subscribers. Not sent from anywhere in the app yet.",
    element: () => createElement(ProductUpdateEmail, PREVIEW_DATA.productUpdate),
  },
  {
    slug: "win-back",
    title: "Win-back (marketing)",
    description: "To lapsed accounts, in day 0, 3 and 7 variants (day 0 shown). Not sent from anywhere in the app yet.",
    element: () => createElement(WinBackEmail, PREVIEW_DATA.winBack),
  },
];

