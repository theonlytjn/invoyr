import { createElement } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { dispatchWebhook } from "@/lib/webhooks/dispatch";
import { runAutomations } from "@/lib/automations/execute";
import { InvoiceSentEmail } from "@/emails/transactional/InvoiceSentEmail";
import { invoiceEmailAmounts } from "@/lib/invoice-totals";
import { ccRecipients, isValidEmail, MAX_CC_RECIPIENTS } from "@/lib/email-recipients";
import { formatCurrency, formatDate } from "@/lib/utils";
import { INVOICE_SENT_COPY } from "@/config/email-copy";

/** What the owner can change in the compose box. Everything is optional. */
export const composeSchema = z.object({
  /** Replaces the client's saved "Also send invoices to" list for this send. */
  cc: z.array(z.string().trim().refine(isValidEmail, "Invalid email address")).max(MAX_CC_RECIPIENTS).optional(),
  subject: z
    .string()
    .trim()
    .max(INVOICE_SENT_COPY.subjectMaxLength)
    // A subject is one header line; a newline in it could add headers.
    .transform((v) => v.replace(/[\r\n]+/g, " "))
    .optional(),
  message: z.string().trim().max(INVOICE_SENT_COPY.messageMaxLength).optional(),
});

export type ComposeOptions = z.infer<typeof composeSchema>;

type SendSource = "manual" | "bulk" | "recurring";

export type SendInvoiceResult =
  | { ok: true; to: string; cc: string[] }
  | { ok: false; status: 400 | 404 | 500; error: string };

const SELECT =
  "*, clients(*), invoice_items(*), organisations(name, accent_color, logo_url, from_email, bank_account_name, bank_name, bank_account_number, bank_sort_code, bank_iban, bank_bic)";

/**
 * Emails an invoice to its client and marks it sent. The one path for the
 * invoice page, bulk send and recurring auto-send, so they all link to the
 * client's pay page, copy the same people, log, and fire automations and
 * webhooks the same way.
 *
 * `supabase` decides who may send: the signed-in user's client (RLS) for the
 * app, the service client for the recurring cron.
 */
export async function sendInvoiceEmail(
  supabase: SupabaseClient,
  invoiceId: string,
  { compose = {}, source = "manual" }: { compose?: ComposeOptions; source?: SendSource } = {}
): Promise<SendInvoiceResult> {
  const { data: invoice } = await supabase.from("invoices").select(SELECT).eq("id", invoiceId).maybeSingle();
  if (!invoice) return { ok: false, status: 404, error: "Not found" };

  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  const org = Array.isArray(invoice.organisations) ? invoice.organisations[0] : invoice.organisations;

  if (!client?.email) return { ok: false, status: 400, error: "Client has no email address" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
  if (!invoice.public_token) {
    // Without a token there is no page the client can pay on. Never fall back
    // to a link into the owner's own app.
    return { ok: false, status: 500, error: "This invoice has no payment link. Please contact support." };
  }
  const payUrl = `${appUrl}/pay/${invoice.public_token}`;

  const cc = ccRecipients(client.email, compose.cc ?? client.cc_emails);
  const subject = compose.subject || INVOICE_SENT_COPY.subject(invoice.invoice_number, org?.name);
  const hasBankDetails = org?.bank_account_name || org?.bank_account_number;

  const result = await sendTransactionalEmail({
    orgId: invoice.org_id,
    invoiceId: invoice.id,
    to: client.email,
    cc,
    subject,
    templateName: "invoice-sent",
    fromEmail: org?.from_email,
    react: createElement(InvoiceSentEmail, {
      clientName: client.name ?? "there",
      orgName: org?.name ?? "",
      logoUrl: org?.logo_url ? org.logo_url.split("?")[0] : null,
      accentColor: org?.accent_color ?? "#111827",
      invoiceNumber: invoice.invoice_number,
      ...invoiceEmailAmounts(invoice.invoice_items ?? [], invoice, formatCurrency),
      issueDate: invoice.issue_date ? formatDate(invoice.issue_date) : undefined,
      dueDate: invoice.due_date ? formatDate(invoice.due_date) : undefined,
      payUrl,
      message: compose.message || null,
      bankDetails: hasBankDetails
        ? {
            accountName: org?.bank_account_name,
            bankName: org?.bank_name,
            accountNumber: org?.bank_account_number,
            sortCode: org?.bank_sort_code,
            iban: org?.bank_iban,
            bic: org?.bank_bic,
          }
        : null,
    }),
  });

  if (!result.ok) return { ok: false, status: 500, error: result.error ?? "Send failed" };

  await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", invoice.id);

  await supabase.from("audit_logs").insert({
    org_id: invoice.org_id,
    action: "invoice.sent",
    entity_type: "invoice",
    entity_id: invoice.id,
    meta: {
      to: client.email,
      cc,
      invoice_number: invoice.invoice_number,
      source,
      ...(compose.message ? { with_message: true } : {}),
    },
  });

  runAutomations(invoice.org_id, "invoice.sent", {
    invoice_id: invoice.id,
    invoice_number: invoice.invoice_number,
    client_name: client.name ?? undefined,
    client_email: client.email ?? undefined,
    amount: invoice.total,
    currency: invoice.currency,
  }).catch(() => {});

  dispatchWebhook(invoice.org_id, "invoice.sent", {
    id: invoice.id,
    invoice_number: invoice.invoice_number,
    client_email: client.email,
    total: invoice.total,
    currency: invoice.currency,
  }).catch(() => {});

  return { ok: true, to: client.email, cc };
}
