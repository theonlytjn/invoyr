import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getResend } from "@/lib/resend/client";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const today = new Date().toISOString().split("T")[0];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  const { data: overdueInvoices } = await supabase
    .from("invoices")
    .select("id, org_id, invoice_number, total, currency, due_date, public_token, clients(name, email), organisations(name, accent_color)")
    .in("status", ["sent", "issued"])
    .lt("due_date", today);

  if (!overdueInvoices?.length) {
    return NextResponse.json({ updated: 0 });
  }

  const ids = overdueInvoices.map((i) => i.id);

  await supabase.from("invoices").update({ status: "overdue" }).in("id", ids);

  await supabase.from("audit_logs").insert(
    overdueInvoices.map((inv) => ({
      org_id: inv.org_id,
      action: "invoice.overdue",
      entity_type: "invoice",
      entity_id: inv.id,
      meta: { invoice_number: inv.invoice_number },
    }))
  );

  // Send reminder emails to clients with an email address
  const resend = getResend();
  const reminderResults = await Promise.allSettled(
    overdueInvoices.map(async (inv) => {
      const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
      const org = Array.isArray(inv.organisations) ? inv.organisations[0] : inv.organisations;
      if (!client?.email) return;

      const payUrl = inv.public_token ? `${appUrl}/pay/${inv.public_token}` : null;
      const accentColor = org?.accent_color ?? "#111827";

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "invoices@invoyr.io",
        to: client.email,
        subject: `Payment overdue — Invoice ${inv.invoice_number}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
            <p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Invoice from</p>
            <p style="font-size:18px;font-weight:700;color:#111827;margin:0 0 24px;">${org?.name ?? ""}</p>
            <h2 style="font-size:22px;font-weight:700;color:#dc2626;margin:0 0 8px;">Payment overdue</h2>
            <p style="color:#6b7280;margin:0 0 24px;">Invoice ${inv.invoice_number} was due on ${formatDate(inv.due_date ?? "")} and has not yet been paid.</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <tr><td style="padding:8px 0;color:#6b7280;">Invoice</td><td style="text-align:right;">#${inv.invoice_number}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;">Due date</td><td style="text-align:right;color:#dc2626;font-weight:600;">${formatDate(inv.due_date ?? "")}</td></tr>
              <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 0;font-weight:700;font-size:16px;">Amount due</td><td style="text-align:right;font-weight:700;font-size:16px;">${formatCurrency(inv.total, inv.currency)}</td></tr>
            </table>
            ${payUrl ? `<a href="${payUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:${accentColor};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Pay now</a>` : ""}
            <p style="margin-top:32px;color:#9ca3af;font-size:12px;">Powered by invoyr</p>
          </div>
        `,
      });

      await supabase.from("email_logs").insert({
        org_id: inv.org_id,
        invoice_id: inv.id,
        to_email: client.email,
        subject: `Payment overdue — Invoice ${inv.invoice_number}`,
        template_name: "invoice-overdue-reminder",
        status: "sent",
      });
    })
  );

  const emailsSent = reminderResults.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({ updated: ids.length, reminders_sent: emailsSent });
}
