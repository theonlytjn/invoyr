import type { ReactElement } from "react";

export type TransactionalTemplateName =
  | "welcome"
  | "verify-email"
  | "password-reset"
  | "invoice-sent"
  | "invoice-paid-owner"
  | "estimate-sent"
  | "estimate-approved"
  | "estimate-rejected"
  | "payment-received"
  | "payment-reminder"
  | "overdue-reminder"
  | "subscription-activated"
  | "trial-ending"
  | "payment-failed"
  | "team-invite"
  | "client-statement"
  | "credit-note"
  | "weekly-digest";

export type MarketingTemplateName =
  | "newsletter"
  | "product-update"
  | "win-back";

export interface EmailRegistryEntry {
  templateName: TransactionalTemplateName;
  defaultSubject: string;
}

export const EMAIL_REGISTRY: Record<TransactionalTemplateName, EmailRegistryEntry> = {
  "welcome": {
    templateName: "welcome",
    defaultSubject: "Welcome to Invoyr",
  },
  "verify-email": {
    templateName: "verify-email",
    defaultSubject: "Verify your email address",
  },
  "password-reset": {
    templateName: "password-reset",
    defaultSubject: "Reset your Invoyr password",
  },
  "invoice-sent": {
    templateName: "invoice-sent",
    defaultSubject: "Your invoice",
  },
  "invoice-paid-owner": {
    templateName: "invoice-paid-owner",
    defaultSubject: "Payment received",
  },
  "estimate-sent": {
    templateName: "estimate-sent",
    defaultSubject: "Your estimate",
  },
  "estimate-approved": {
    templateName: "estimate-approved",
    defaultSubject: "Estimate approved",
  },
  "estimate-rejected": {
    templateName: "estimate-rejected",
    defaultSubject: "Estimate declined",
  },
  "payment-received": {
    templateName: "payment-received",
    defaultSubject: "Payment received",
  },
  "payment-reminder": {
    templateName: "payment-reminder",
    defaultSubject: "Invoice payment reminder",
  },
  "overdue-reminder": {
    templateName: "overdue-reminder",
    defaultSubject: "Overdue invoice",
  },
  "subscription-activated": {
    templateName: "subscription-activated",
    defaultSubject: "Your Invoyr subscription is active",
  },
  "trial-ending": {
    templateName: "trial-ending",
    defaultSubject: "Your Invoyr trial ends soon",
  },
  "payment-failed": {
    templateName: "payment-failed",
    defaultSubject: "Payment failed for your Invoyr subscription",
  },
  "team-invite": {
    templateName: "team-invite",
    defaultSubject: "You've been invited to join a workspace on Invoyr",
  },
  "client-statement": {
    templateName: "client-statement",
    defaultSubject: "Statement of account",
  },
  "credit-note": {
    templateName: "credit-note",
    defaultSubject: "Credit note",
  },
  "weekly-digest": {
    templateName: "weekly-digest",
    defaultSubject: "Your weekly summary",
  },
};

export type ReactEmailComponent = ReactElement;
