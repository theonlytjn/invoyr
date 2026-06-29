import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { OverdueReminderEmail } from "@/emails/transactional/OverdueReminderEmail";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, clients(*), organisations(name, accent_color, logo_url, from_email)")
    .eq("id", id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!["overdue", "sent", "issued"].includes(invoice.status)) {
    return NextResponse.json({ error: "Reminders can only be sent for active invoices" }, { status: 400 });
  }

  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  const org = Array.isArray(invoice.organisations) ? invoice.organisations[0] : invoice.organisations;

  if (!client?.email) return NextResponse.json({ error: "Client has no email address" }, { status: 400 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
  const payUrl = invoice.public_token ? `${appUrl}/pay/${invoice.public_token}` : appUrl;
  const logoUrl = org?.logo_url ? org.logo_url.split("?")[0] : null;

  const daysOverdue = invoice.due_date
    ? Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / 86_400_000)
    : null;

  const subject = daysOverdue && daysOverdue > 0
    ? `Reminder: Invoice ${invoice.invoice_number} is ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} overdue`
    : `Reminder: Invoice ${invoice.invoice_number} is due`;

  const result = await sendTransactionalEmail({
    orgId: invoice.org_id,
    invoiceId: id,
    to: client.email,
    subject,
    templateName: "overdue-reminder",
    fromEmail: (org as { from_email?: string | null })?.from_email,
    react: createElement(OverdueReminderEmail, {
      clientName: client.name ?? "there",
      orgName: org?.name ?? "",
      logoUrl,
      accentColor: org?.accent_color ?? "#111827",
      invoiceNumber: invoice.invoice_number,
      dueDate: invoice.due_date ? formatDate(invoice.due_date) : "—",
      balanceDue: formatCurrency(invoice.total + (invoice.late_fee_amount ?? 0) - invoice.amount_paid, invoice.currency),
      payUrl,
    }),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
  }

  await supabase.from("audit_logs").insert({
    org_id: invoice.org_id,
    action: "invoice.reminder_sent",
    entity_type: "invoice",
    entity_id: id,
    meta: { to: client.email, invoice_number: invoice.invoice_number, manual: true },
  });

  return NextResponse.json({ ok: true });
}
