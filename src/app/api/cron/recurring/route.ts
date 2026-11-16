import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { claimDocumentNumber, formatDocumentNumber } from "@/lib/document-number";
import { getOrgIdsWithFeature } from "@/lib/billing";
import { sendInvoiceEmail } from "@/lib/invoices/send-invoice-email";
import { dueDateFor, nextRunAfter, type RecurringFrequency } from "@/lib/recurring/schedule";

/**
 * Generates the invoices recurring schedules are due to make, daily at 06:00 UTC.
 *
 * Each due schedule makes one invoice dated today, due after the schedule's
 * payment terms. With auto-send on (and a client with an email), it goes
 * straight to the client through the same path as the Send button, so the
 * email links to the client's pay page. Otherwise it waits as a draft.
 *
 * Schedules belonging to an organisation that no longer has recurring
 * invoices on its plan (trial lapsed, downgraded) are skipped and left where
 * they are, so they pick up again if the plan comes back.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: due, error } = await supabase
    .from("recurring_invoices")
    .select("*, recurring_invoice_items(*), organisations(invoice_prefix)")
    .eq("status", "active")
    .lte("next_run_at", today);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!due?.length) return NextResponse.json({ generated: 0 });

  const entitled = await getOrgIdsWithFeature("recurring_invoices");
  let generated = 0;
  let sent = 0;
  let skipped = 0;

  for (const rec of due) {
    const org = Array.isArray(rec.organisations) ? rec.organisations[0] : rec.organisations;
    if (!org) continue;
    if (!entitled.has(rec.org_id)) {
      skipped++;
      continue;
    }

    // Claimed per invoice, not read once from the org row above: two schedules
    // for the same org due on the same day used to get the same number.
    let invoiceNumber: string;
    try {
      invoiceNumber = formatDocumentNumber(
        org.invoice_prefix ?? "INV",
        await claimDocumentNumber(supabase, rec.org_id, "invoice")
      );
    } catch (err) {
      console.error("recurring: invoice number claim failed", { recurring_id: rec.id, err });
      continue;
    }
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
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        org_id: rec.org_id,
        client_id: rec.client_id,
        invoice_number: invoiceNumber,
        status: shouldAutoSend ? "issued" : "draft",
        template: rec.template,
        issue_date: today,
        due_date: dueDateFor(today, rec.due_days ?? 30),
        currency: rec.currency,
        subtotal,
        vat_amount: vatAmount,
        total,
        notes: rec.notes,
        terms: rec.terms,
      })
      .select()
      .single();

    if (!invoice) {
      console.error("recurring: invoice insert failed", { recurring_id: rec.id, error: invoiceError?.message });
      continue;
    }

    if (items.length > 0) {
      const { error: itemsError } = await supabase.from("invoice_items").insert(
        items.map((item, i) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          sort_order: i,
        }))
      );

      // An invoice with a total and no lines must not be sent. Remove it and
      // leave the schedule untouched so tomorrow's run tries again.
      if (itemsError) {
        console.error("recurring: line items insert failed", { recurring_id: rec.id, error: itemsError.message });
        await supabase.from("invoices").delete().eq("id", invoice.id);
        continue;
      }
    }

    await supabase.from("audit_logs").insert({
      org_id: rec.org_id,
      action: "invoice.created",
      entity_type: "invoice",
      entity_id: invoice.id,
      meta: { invoice_number: invoiceNumber, source: "recurring" },
    });

    if (shouldAutoSend) {
      const result = await sendInvoiceEmail(supabase, invoice.id, { source: "recurring" });
      if (result.ok) sent++;
      else console.error("recurring: auto-send failed", { recurring_id: rec.id, invoice_id: invoice.id, error: result.error });
    }

    // From today, not from the missed date: a run that was skipped for days
    // makes one invoice now rather than one every morning until caught up.
    const nextRun = nextRunAfter(rec.start_date, rec.frequency as RecurringFrequency, today);
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

  return NextResponse.json({ generated, sent, skipped });
}
