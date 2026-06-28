import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { isSubscriptionActive } from "@/lib/billing";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { OverdueReminderEmail } from "@/emails/transactional/OverdueReminderEmail";
import { formatCurrency, formatDate } from "@/lib/utils";

const DEFAULT_REMINDER_DAYS = [3, 7, 14, 21, 30];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  // Step 1: Mark newly overdue invoices (sent/issued with due_date in the past)
  const { data: newlyOverdue } = await supabase
    .from("invoices")
    .select("id, org_id, invoice_number")
    .in("status", ["sent", "issued"])
    .lt("due_date", todayStr);

  if (newlyOverdue?.length) {
    const ids = newlyOverdue.map((i) => i.id);
    await supabase.from("invoices").update({ status: "overdue" }).in("id", ids);
    await supabase.from("audit_logs").insert(
      newlyOverdue.map((inv) => ({
        org_id: inv.org_id,
        action: "invoice.overdue",
        entity_type: "invoice",
        entity_id: inv.id,
        meta: { invoice_number: inv.invoice_number },
      }))
    );
  }

  // Step 2: Fetch Pro orgs for reminder emails
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
    return NextResponse.json({ updated: newlyOverdue?.length ?? 0, reminders_sent: 0 });
  }

  // Step 3: Fetch all overdue invoices for Pro orgs
  const { data: overdueInvoices } = await supabase
    .from("invoices")
    .select(
      "id, org_id, invoice_number, total, currency, due_date, public_token, clients(name, email), organisations(name, accent_color, logo_url, reminder_days)"
    )
    .eq("status", "overdue")
    .in("org_id", [...proOrgIds])
    .not("due_date", "is", null);

  if (!overdueInvoices?.length) {
    return NextResponse.json({ updated: newlyOverdue?.length ?? 0, reminders_sent: 0 });
  }

  // Step 4: Determine which reminders to send today based on days overdue
  let remindersSent = 0;

  await Promise.allSettled(
    overdueInvoices.map(async (inv) => {
      const client = Array.isArray(inv.clients) ? inv.clients[0] : inv.clients;
      const org = Array.isArray(inv.organisations) ? inv.organisations[0] : inv.organisations;
      if (!client?.email || !inv.due_date) return;

      const daysOverdue = Math.floor(
        (today.getTime() - new Date(inv.due_date).getTime()) / 86_400_000
      );

      const orgReminderDays: number[] = (org as { reminder_days?: number[] | null }).reminder_days ?? DEFAULT_REMINDER_DAYS;
      const matchingDay = orgReminderDays.find((d) => d === daysOverdue);
      if (!matchingDay) return;

      const templateName = `overdue-reminder-${matchingDay}d`;

      // Check if already sent this cadence email for this invoice
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

      const result = await sendTransactionalEmail({
        orgId: inv.org_id,
        invoiceId: inv.id,
        to: client.email,
        subject: `Reminder: Invoice ${inv.invoice_number} is ${matchingDay} days overdue`,
        templateName,
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

      if (result.ok) remindersSent++;
    })
  );

  return NextResponse.json({
    updated: newlyOverdue?.length ?? 0,
    reminders_sent: remindersSent,
  });
}
