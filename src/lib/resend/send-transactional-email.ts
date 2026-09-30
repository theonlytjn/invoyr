import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { getResend } from "./client";
import { createServiceClient } from "@/lib/supabase/server";
import type { TransactionalTemplateName } from "@/emails/registry";
import { sendViaSmtp } from "@/lib/smtp/send";
import { ccRecipients } from "@/lib/email-recipients";

interface SendTransactionalEmailOptions {
  orgId: string;
  invoiceId?: string | null;
  to: string;
  /** Additional recipients copied on the email; invalid entries are dropped. */
  cc?: string[] | null;
  subject: string;
  templateName: TransactionalTemplateName | string;
  react: ReactElement;
  fromEmail?: string | null;
}

interface SendResult {
  ok: boolean;
  resendId?: string;
  error?: string;
}

export async function sendTransactionalEmail({
  orgId,
  invoiceId,
  to,
  cc,
  subject,
  templateName,
  react,
  fromEmail,
}: SendTransactionalEmailOptions): Promise<SendResult> {
  let html: string;

  try {
    html = await render(react);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Render failed";
    return { ok: false, error: msg };
  }

  const supabase = await createServiceClient();

  // A typo in a CC field must never stop the invoice reaching the client.
  const ccList = ccRecipients(to, cc);
  // email_logs has no cc column, so the history records every recipient here.
  const loggedRecipients = [to, ...ccList].join(", ");

  // Check if the org has custom SMTP configured
  const { data: orgSmtp } = await supabase
    .from("organisations")
    .select("smtp_host, smtp_port, smtp_user, smtp_password, smtp_from_name, smtp_from_email")
    .eq("id", orgId)
    .single();

  if (
    orgSmtp?.smtp_host &&
    orgSmtp?.smtp_user &&
    orgSmtp?.smtp_password &&
    orgSmtp?.smtp_from_email
  ) {
    const result = await sendViaSmtp(
      {
        host: orgSmtp.smtp_host,
        port: orgSmtp.smtp_port ?? 587,
        user: orgSmtp.smtp_user,
        password: orgSmtp.smtp_password,
        fromName: orgSmtp.smtp_from_name ?? orgSmtp.smtp_from_email,
        fromEmail: orgSmtp.smtp_from_email,
      },
      { to, cc: ccList.length ? ccList : undefined, subject, html }
    );

    await supabase.from("email_logs").insert({
      org_id: orgId,
      invoice_id: invoiceId ?? null,
      resend_id: null,
      to_email: loggedRecipients,
      subject,
      template_name: templateName,
      status: result.ok ? "sent" : "failed",
    });

    return result;
  }

  // Fall back to Resend
  const resend = getResend();
  const from = fromEmail ?? process.env.RESEND_FROM_EMAIL ?? "invoices@invoyr.io";

  const { data, error: resendErr } = await resend.emails.send({
    from,
    to,
    ...(ccList.length ? { cc: ccList } : {}),
    subject,
    html,
  });

  await supabase.from("email_logs").insert({
    org_id: orgId,
    invoice_id: invoiceId ?? null,
    resend_id: data?.id ?? null,
    to_email: loggedRecipients,
    subject,
    template_name: templateName,
    status: resendErr ? "failed" : "sent",
  });

  if (resendErr) {
    return { ok: false, error: resendErr.message };
  }

  return { ok: true, resendId: data?.id };
}
