import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { getResend } from "./client";
import { createServiceClient } from "@/lib/supabase/server";
import type { TransactionalTemplateName } from "@/emails/registry";

interface SendTransactionalEmailOptions {
  orgId: string;
  invoiceId?: string | null;
  to: string;
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

  const resend = getResend();
  const from = fromEmail ?? process.env.RESEND_FROM_EMAIL ?? "invoices@invoyr.io";

  const { data, error: resendErr } = await resend.emails.send({ from, to, subject, html });

  const supabase = await createServiceClient();
  await supabase.from("email_logs").insert({
    org_id: orgId,
    invoice_id: invoiceId ?? null,
    resend_id: data?.id ?? null,
    to_email: to,
    subject,
    template_name: templateName,
    status: resendErr ? "failed" : "sent",
  });

  if (resendErr) {
    return { ok: false, error: resendErr.message };
  }

  return { ok: true, resendId: data?.id };
}
