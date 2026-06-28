import { NextResponse } from "next/server";
import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { InvoiceSentEmail } from "@/emails/transactional/InvoiceSentEmail";
import { formatCurrency, formatDate } from "@/lib/utils";

function calcNextRun(frequency: string, from: Date): string {
  const d = new Date(from);
  if (frequency === "weekly") d.setDate(d.getDate() + 7);
  else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
  else if (frequency === "quarterly") d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: due, error } = await supabase
    .from("recurring_invoices")
    .select("*, recurring_invoice_items(*), organisations(invoice_prefix, next_invoice_number, name, accent_color, logo_url, bank_account_name, bank_name, bank_account_number, bank_sort_code, bank_iban, bank_bic)")
    .eq("status", "active")
    .lte("next_run_at", today);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!due?.length) return NextResponse.json({ generated: 0 });

  let generated = 0;

  for (const rec of due) {
    const org = Array.isArray(rec.organisations) ? rec.organisations[0] : rec.organisations;
    if (!org) continue;

    const invoiceNumber = `${org.invoice_prefix}-${String(org.next_invoice_number).padStart(4, "0")}`;
    const items: { description: string; quantity: number; unit_price: number; vat_rate: number }[] =
      rec.recurring_invoice_items ?? [];

    let subtotal = 0;
    let vatAmount = 0;
    for (const item of items) {
      const line = item.quantity * item.unit_price;
      subtotal += line;
      vatAmount += line * (item.vat_rate / 100);
    }
    subtotal = Math.round(subtotal * 100) / 100;
    vatAmount = Math.round(vatAmount * 100) / 100;
    const total = Math.round((subtotal + vatAmount) * 100) / 100;

    const shouldAutoSend = rec.auto_send && rec.client_id;
    const { data: invoice } = await supabase
      .from("invoices")
      .insert({
        org_id: rec.org_id,
        client_id: rec.client_id,
        invoice_number: invoiceNumber,
        status: shouldAutoSend ? "issued" : "draft",
        template: rec.template,
        issue_date: today,
        currency: rec.currency,
        subtotal,
        vat_amount: vatAmount,
        total,
        notes: rec.notes,
        terms: rec.terms,
      })
      .select()
      .single();

    if (!invoice) continue;

    if (items.length > 0) {
      await supabase.from("invoice_items").insert(
        items.map((item, i) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          sort_order: i,
        }))
      );
    }

    await supabase
      .from("organisations")
      .update({ next_invoice_number: org.next_invoice_number + 1 })
      .eq("id", rec.org_id);

    await supabase.from("audit_logs").insert({
      org_id: rec.org_id,
      action: "invoice.created",
      entity_type: "invoice",
      entity_id: invoice.id,
      meta: { invoice_number: invoiceNumber, source: "recurring" },
    });

    if (shouldAutoSend) {
      const { data: clientData } = await supabase
        .from("clients")
        .select("name, email")
        .eq("id", rec.client_id)
        .single();

      if (clientData?.email) {
        const payUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
        const hasBankDetails = org.bank_account_name || org.bank_account_number;
        const logoUrl = org.logo_url ? org.logo_url.split("?")[0] : null;

        const emailResult = await sendTransactionalEmail({
          orgId: rec.org_id,
          invoiceId: invoice.id,
          to: clientData.email,
          subject: `Invoice ${invoiceNumber}${org.name ? ` from ${org.name}` : ""}`,
          templateName: "invoice-sent",
          react: createElement(InvoiceSentEmail, {
            clientName: clientData.name ?? "there",
            orgName: org.name ?? "",
            logoUrl,
            accentColor: org.accent_color ?? "#111827",
            invoiceNumber,
            invoiceTotal: formatCurrency(total, rec.currency),
            issueDate: formatDate(today),
            dueDate: undefined,
            payUrl,
            bankDetails: hasBankDetails
              ? {
                  accountName: org.bank_account_name,
                  bankName: org.bank_name,
                  accountNumber: org.bank_account_number,
                  sortCode: org.bank_sort_code,
                  iban: org.bank_iban,
                  bic: org.bank_bic,
                }
              : null,
          }),
        });

        if (emailResult.ok) {
          await supabase
            .from("invoices")
            .update({ status: "sent", sent_at: new Date().toISOString() })
            .eq("id", invoice.id);

          await supabase.from("audit_logs").insert({
            org_id: rec.org_id,
            action: "invoice.sent",
            entity_type: "invoice",
            entity_id: invoice.id,
            meta: { to: clientData.email, invoice_number: invoiceNumber, source: "recurring_auto_send" },
          });
        }
      }
    }

    const nextRun = calcNextRun(rec.frequency, new Date(rec.next_run_at));
    const ended = rec.end_date && nextRun > rec.end_date;

    await supabase
      .from("recurring_invoices")
      .update({
        last_run_at: today,
        next_run_at: nextRun,
        status: ended ? "ended" : "active",
      })
      .eq("id", rec.id);

    generated++;
  }

  return NextResponse.json({ generated });
}
