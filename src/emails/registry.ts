import type { ReactElement } from "react";

export type TransactionalTemplateName =
  | "welcome"
  | "verify-email"
  | "password-reset"
  | "invoice-sent"
  | "estimate-sent"
  | "payment-received"
  | "payment-reminder"
  | "overdue-reminder"
  | "trial-ending"
  | "payment-failed"
  | "team-invite";

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
  "estimate-sent": {
    templateName: "estimate-sent",
    defaultSubject: "Your estimate",
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
};

export type ReactEmailComponent = ReactElement;
