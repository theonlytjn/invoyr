import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { OverdueReminderEmail } from "@/emails/transactional/OverdueReminderEmail";
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
    .select(
      "id, org_id, invoice_number, total, currency, due_date, public_token, clients(name, email), organisations(name, accent_color, logo_url)"
    )
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

  const reminderResults = await Promise.allSettled(
    overdueInvoices.map(async (inv) => {
      const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
      const org = Array.isArray(inv.organisations) ? inv.organisations[0] : inv.organisations;
      if (!client?.email) return;

      const payUrl = inv.public_token ? `${appUrl}/pay/${inv.public_token}` : appUrl;
      const logoUrl = org?.logo_url ? org.logo_url.split("?")[0] : null;

      await sendTransactionalEmail({
        orgId: inv.org_id,
        invoiceId: inv.id,
        to: client.email,
        subject: `Overdue invoice ${inv.invoice_number}`,
        templateName: "overdue-reminder",
        react: createElement(OverdueReminderEmail, {
          clientName: client.name ?? "there",
          orgName: org?.name ?? "",
          logoUrl,
          accentColor: org?.accent_color ?? "#111827",
          invoiceNumber: inv.invoice_number,
          dueDate: inv.due_date ? formatDate(inv.due_date) : "—",
          balanceDue: formatCurrency(inv.total, inv.currency),
          payUrl,
        }),
      });
    })
  );

  const emailsSent = reminderResults.filter((r) => r.status === "fulfilled").length;

  return NextResponse.json({ updated: ids.length, reminders_sent: emailsSent });
}
