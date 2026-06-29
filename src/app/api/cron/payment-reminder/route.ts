import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/billing";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { PaymentReminderEmail } from "@/emails/transactional/PaymentReminderEmail";
import { formatCurrency, formatDate } from "@/lib/utils";

const DEFAULT_PRE_DUE_DAYS = [3];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const today = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  // Only Pro orgs get pre-due reminders
  const { data: proSubs } = await supabase
    .from("subscriptions")
    .select("org_id, status, plan")
    .eq("plan", "pro");

  const proOrgIds = new Set(
    (proSubs ?? [])
      .filter((s) => isSubscriptionActive(s.status))
      .map((s) => s.org_id)
  );

  if (proOrgIds.size === 0) {
    return NextResponse.json({ reminders_sent: 0 });
  }

  // Fetch sent/issued invoices with future due dates for Pro orgs
  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      "id, org_id, invoice_number, total, currency, due_date, public_token, clients(name, email), organisations(name, accent_color, logo_url, from_email, payment_reminder_days)"
    )
    .in("status", ["sent", "issued"])
    .in("org_id", [...proOrgIds])
    .gte("due_date", today.toISOString().slice(0, 10))
    .not("due_date", "is", null);

  if (!invoices?.length) {
    return NextResponse.json({ reminders_sent: 0 });
  }

  let remindersSent = 0;

  await Promise.allSettled(
    invoices.map(async (inv) => {
      const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
      const org = Array.isArray(inv.organisations) ? inv.organisations[0] : inv.organisations;
      if (!client?.email || !inv.due_date) return;

      const daysUntilDue = Math.floor(
        (new Date(inv.due_date).getTime() - today.getTime()) / 86_400_000
      );

      const orgReminderDays: number[] =
        (org as { payment_reminder_days?: number[] | null }).payment_reminder_days ??
        DEFAULT_PRE_DUE_DAYS;

      const matchingDay = orgReminderDays.find((d) => d === daysUntilDue);
      if (matchingDay === undefined) return;

      const templateName = `payment-reminder-${matchingDay}d-before`;

      // Deduplicate: skip if already sent this reminder for this invoice
      const { data: existing } = await supabase
        .from("email_logs")
        .select("id")
        .eq("invoice_id", inv.id)
        .eq("template_name", templateName)
        .limit(1)
        .maybeSingle();

      if (existing) return;

      const payUrl = inv.public_token ? `${appUrl}/pay/${inv.public_token}` : appUrl;
      const logoUrl = org?.logo_url ? org.logo_url.split("?")[0] : null;
      const dueDateLabel =
        matchingDay === 1
          ? "tomorrow"
          : matchingDay === 0
          ? "today"
          : `in ${matchingDay} days`;

      const result = await sendTransactionalEmail({
        orgId: inv.org_id,
        invoiceId: inv.id,
        to: client.email,
        subject: `Reminder: Invoice ${inv.invoice_number} is due ${dueDateLabel}`,
        templateName,
        fromEmail: (org as { from_email?: string | null })?.from_email,
        react: createElement(PaymentReminderEmail, {
          clientName: client.name ?? "there",
          orgName: org?.name ?? "",
          logoUrl,
          accentColor: org?.accent_color ?? "#111827",
          invoiceNumber: inv.invoice_number,
          dueDate: formatDate(inv.due_date),
          balanceDue: formatCurrency(inv.total, inv.currency),
          payUrl,
        }),
      });

      if (result.ok) remindersSent++;
    })
  );

  return NextResponse.json({ reminders_sent: remindersSent });
}
