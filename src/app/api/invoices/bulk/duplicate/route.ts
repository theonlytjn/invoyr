import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import { summarise } from "@/lib/bulk-actions";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  dryRun: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun } = parsed.data;

  // Any invoice can be duplicated, so there is no eligibility rule here. Rows outside
  // this org simply do not come back, and summarise() counts them as skipped.
  const { data: sources, error: fetchError } = await supabase
    .from("invoices")
    .select("*, invoice_items(*)")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const partition = { deletable: sources ?? [], skips: [] };
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const today = new Date().toISOString().slice(0, 10);

  // Sequential by design — do not parallelise (Promise.all, .map + await, etc).
  // generateInvoiceNumber reads current state to pick the next number, and
  // invoices has a unique (org_id, invoice_number) constraint; concurrent calls
  // would race and collide.
  for (const source of partition.deletable) {
    const newNumber = await generateInvoiceNumber(org.id);

    const { data: created, error: insertError } = await supabase
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

    if (insertError || !created) {
      return NextResponse.json({ error: insertError?.message ?? "Failed to duplicate" }, { status: 500 });
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
          invoice_id: created.id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          vat_rate: item.vat_rate,
          sort_order: item.sort_order ?? idx,
        }))
      );
    }

    const { error: auditError } = await supabase.from("audit_logs").insert({
      org_id: org.id,
      user_id: user.id,
      action: "invoice.duplicated",
      entity_type: "invoice",
      entity_id: created.id,
      meta: { source_invoice_id: source.id, invoice_number: newNumber, bulk: true },
    });

    if (auditError) {
      console.error("[bulk] audit log write failed", {
        action: "invoice.duplicated",
        ids: [created.id],
        error: auditError.message,
      });
    }
  }

  return NextResponse.json(result);
}
