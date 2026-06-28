import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: estimate } = await supabase
    .from("estimates")
    .select("*, estimate_items(*)")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!estimate) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (estimate.status === "converted") {
    return NextResponse.json({ error: "Already converted" }, { status: 400 });
  }

  // Get next invoice number
  const { data: orgData } = await supabase
    .from("organisations")
    .select("next_invoice_number, invoice_prefix")
    .eq("id", org.id)
    .single();

  if (!orgData) return NextResponse.json({ error: "Could not fetch org" }, { status: 500 });

  const prefix = orgData.invoice_prefix ?? "INV";
  const invoiceNumber = `${prefix}-${String(orgData.next_invoice_number).padStart(4, "0")}`;

  await supabase
    .from("organisations")
    .update({ next_invoice_number: orgData.next_invoice_number + 1 })
    .eq("id", org.id);

  // Create the invoice from the estimate
  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .insert({
      org_id: org.id,
      client_id: estimate.client_id,
      invoice_number: invoiceNumber,
      status: "draft",
      template: estimate.template,
      issue_date: new Date().toISOString().slice(0, 10),
      due_date: null,
      currency: estimate.currency,
      po_number: estimate.po_number,
      subtotal: estimate.subtotal,
      discount: estimate.discount,
      vat_amount: estimate.vat_amount,
      total: estimate.total,
      notes: estimate.notes,
      terms: estimate.terms,
    })
    .select()
    .single();

  if (invErr || !invoice) return NextResponse.json({ error: invErr?.message ?? "Failed to create invoice" }, { status: 500 });

  const items = estimate.estimate_items ?? [];
  if (items.length > 0) {
    await supabase.from("invoice_items").insert(
      items.map((item: { description: string; quantity: number; unit_price: number; vat_rate: number }, i: number) => ({
        invoice_id: invoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        sort_order: i,
      }))
    );
  }

  // Mark estimate as converted
  await supabase
    .from("estimates")
    .update({
      status: "converted",
      converted_at: new Date().toISOString(),
      converted_invoice_id: invoice.id,
    })
    .eq("id", id);

  await supabase.from("audit_logs").insert([
    {
      org_id: org.id,
      action: "estimate.converted",
      entity_type: "estimate",
      entity_id: id,
      meta: { invoice_id: invoice.id, invoice_number: invoiceNumber },
    },
    {
      org_id: org.id,
      action: "invoice.created",
      entity_type: "invoice",
      entity_id: invoice.id,
      meta: { invoice_number: invoiceNumber, from_estimate: estimate.estimate_number },
    },
  ]);

  return NextResponse.json({ ok: true, invoice_id: invoice.id });
}
