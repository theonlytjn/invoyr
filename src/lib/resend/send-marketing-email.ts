import { render } from "@react-email/render";
import type { ReactElement } from "react";
import { getResend } from "./client";
import { createServiceClient } from "@/lib/supabase/server";
import type { MarketingTemplateName } from "@/emails/registry";

interface SendMarketingEmailOptions {
  userId: string;
  to: string;
  subject: string;
  templateName: MarketingTemplateName;
  react: ReactElement;
}

interface SendResult {
  ok: boolean;
  resendId?: string;
  error?: string;
}

export async function sendMarketingEmail({
  userId,
  to,
  subject,
  templateName,
  react,
}: SendMarketingEmailOptions): Promise<SendResult> {
  const supabase = await createServiceClient();

  const { data: prefs } = await supabase
    .from("email_preferences")
    .select("marketing_consent, unsubscribed_at")
    .eq("user_id", userId)
    .single();

  if (!prefs?.marketing_consent || prefs.unsubscribed_at) {
    return { ok: false, error: "no-consent" };
  }

  let html: string;
  try {
    html = await render(react);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Render failed";
    return { ok: false, error: msg };
  }

  const resend = getResend();
  const from = process.env.RESEND_FROM_EMAIL ?? "hello@invoyr.io";

  const { data, error: resendErr } = await resend.emails.send({ from, to, subject, html });

  await supabase.from("email_logs").insert({
    user_id: userId,
    org_id: null,
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
