import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { InvoiceSentEmail } from "@/emails/transactional/InvoiceSentEmail";
import { computeTotals } from "@/lib/invoice-totals";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      "*, clients(*), invoice_items(*), organisations(name, accent_color, logo_url, from_email, bank_account_name, bank_name, bank_account_number, bank_sort_code, bank_iban, bank_bic)"
    )
    .eq("id", id)
    .single();

  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const client = Array.isArray(invoice.clients) ? invoice.clients[0] : invoice.clients;
  const org = Array.isArray(invoice.organisations)
    ? invoice.organisations[0]
    : invoice.organisations;

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
    : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;

  const hasBankDetails = org?.bank_account_name || org?.bank_account_number;
  const logoUrl = org?.logo_url ? org.logo_url.split("?")[0] : null;

  const result = await sendTransactionalEmail({
    orgId: invoice.org_id,
    invoiceId: id,
    to: client.email,
    subject: `Invoice ${invoice.invoice_number}${org?.name ? ` from ${org.name}` : ""}`,
    templateName: "invoice-sent",
    fromEmail: (org as { from_email?: string | null })?.from_email,
    react: createElement(InvoiceSentEmail, {
      clientName: client.name ?? "there",
      orgName: org?.name ?? "",
      logoUrl,
      accentColor: org?.accent_color ?? "#111827",
      invoiceNumber: invoice.invoice_number,
      invoiceTotal: formatCurrency(totals.total, invoice.currency),
      issueDate: invoice.issue_date ? formatDate(invoice.issue_date) : undefined,
      dueDate: invoice.due_date ? formatDate(invoice.due_date) : undefined,
      payUrl,
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

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
  }

  await supabase
    .from("invoices")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);

  await supabase.from("audit_logs").insert({
    org_id: invoice.org_id,
    action: "invoice.sent",
    entity_type: "invoice",
    entity_id: id,
    meta: { to: client.email, invoice_number: invoice.invoice_number },
  });

  return NextResponse.json({ ok: true });
}
