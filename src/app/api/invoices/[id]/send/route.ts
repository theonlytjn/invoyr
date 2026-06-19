import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getResend } from "@/lib/resend/client";
import { computeTotals } from "@/lib/invoice-totals";
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
    .select("*, clients(*), invoice_items(*), organisations(name, accent_color)")
    .eq("id", id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  const org = Array.isArray(invoice.organisations) ? invoice.organisations[0] : invoice.organisations;
  if (!client?.email) {
    return NextResponse.json({ error: "Client has no email address" }, { status: 400 });
  }

  const items = invoice.invoice_items ?? [];
  const totals = computeTotals(
    items.map((i: { quantity: number; unit_price: number; vat_rate: number }) => ({
      description: "",
      quantity: i.quantity,
      unit_price: i.unit_price,
      vat_rate: i.vat_rate,
    }))
  );

  const payUrl = invoice.public_token
    ? `${process.env.NEXT_PUBLIC_APP_URL}/pay/${invoice.public_token}`
    : null;

  const { data: emailData, error: emailErr } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "invoices@invoyr.io",
    to: client.email,
    subject: `Invoice ${invoice.invoice_number}${org?.name ? ` from ${org.name}` : ""}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:40px 20px;">
        ${org?.name ? `<p style="color:#6b7280;font-size:14px;margin:0 0 4px;">Invoice from</p><p style="font-size:18px;font-weight:700;color:#111827;margin:0 0 24px;">${org.name}</p>` : ""}
        <h2 style="font-size:24px;font-weight:700;color:#111827;margin:0 0 8px;">Invoice ${invoice.invoice_number}</h2>
        <p style="color:#6b7280;margin:0 0 24px;">Please find your invoice details below.</p>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#6b7280;">Issue date</td><td style="text-align:right;">${formatDate(invoice.issue_date)}</td></tr>
          ${invoice.due_date ? `<tr><td style="padding:8px 0;color:#6b7280;">Due date</td><td style="text-align:right;">${formatDate(invoice.due_date)}</td></tr>` : ""}
          <tr style="border-top:1px solid #e5e7eb;"><td style="padding:12px 0;font-weight:700;font-size:16px;">Total due</td><td style="text-align:right;font-weight:700;font-size:16px;">${formatCurrency(totals.total, invoice.currency)}</td></tr>
        </table>
        ${payUrl ? `<a href="${payUrl}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:${org?.accent_color ?? "#111827"};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Pay now</a>` : ""}
        <p style="margin-top:32px;color:#9ca3af;font-size:12px;">Powered by invoyr</p>
      </div>
    `,
  });

  if (emailErr) {
    return NextResponse.json({ error: emailErr.message }, { status: 500 });
  }

  await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);

  await supabase.from("email_logs").insert({
    org_id: invoice.org_id,
    invoice_id: id,
    resend_id: emailData?.id ?? null,
    to_email: client.email,
    subject: `Invoice ${invoice.invoice_number}`,
    template_name: "invoice-sent",
    status: "sent",
  });

  await supabase.from("audit_logs").insert({
    org_id: invoice.org_id,
    action: "invoice.sent",
    entity_type: "invoice",
    entity_id: id,
    meta: { to: client.email },
  });

  return NextResponse.json({ ok: true });
}
