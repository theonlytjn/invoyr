import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/invoice-number";

const paramsSchema = z.object({ id: z.string().uuid() });

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const parsed = paramsSchema.safeParse(await params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

  const org = await requireOrg();
  const supabase = await createClient();

  const { data: source } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .eq("id", parsed.data.id)
    .eq("org_id", org.id)
    .single();

  if (!source) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const newNumber = await generateInvoiceNumber(org.id);
  const today = new Date().toISOString().slice(0, 10);

  const { data: newInvoice, error } = await supabase
    .from("invoices")
    .insert({
      org_id: org.id,
      client_id: source.client_id,
      invoice_number: newNumber,
      template: source.template,
      status: "draft",
      currency: source.currency,
      issue_date: today,
      due_date: null,
      notes: source.notes,
      terms: source.terms,
      subtotal: source.subtotal,
      vat_amount: source.vat_amount,
      total: source.total,
      amount_paid: 0,
    })
    .select()
    .single();

  if (error || !newInvoice) {
    return NextResponse.json({ error: error?.message ?? "Failed to duplicate" }, { status: 500 });
  }

  const items = (source.invoice_items ?? []) as Array<{
    description: string;
    quantity: number;
    unit_price: number;
    vat_rate: number;
    sort_order: number;
  }>;

  if (items.length > 0) {
    await supabase.from("invoice_items").insert(
      items.map((item, idx) => ({
        invoice_id: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        vat_rate: item.vat_rate,
        sort_order: item.sort_order ?? idx,
      }))
    );
  }

  await supabase.from("audit_logs").insert({
    org_id: org.id,
    action: "invoice.duplicated",
    entity_type: "invoice",
    entity_id: newInvoice.id,
    meta: { source_invoice_id: source.id, invoice_number: newNumber },
  });

  return NextResponse.json({ id: newInvoice.id });
}
