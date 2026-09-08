import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { partitionMarkPaid, summarise } from "@/lib/bulk-actions";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
  dryRun: z.boolean().optional().default(false),
  method: z.enum(["bank_transfer", "card", "cash", "other"]).optional().default("bank_transfer"),
  paidAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { ids, dryRun, method } = parsed.data;
  const paidAt = parsed.data.paidAt ?? new Date().toISOString();

  const { data: invoices, error: fetchError } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total, amount_paid, currency")
    .in("id", ids)
    .eq("org_id", org.id);

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });

  const partition = partitionMarkPaid(invoices ?? []);
  const result = summarise(partition, ids);

  if (dryRun || partition.deletable.length === 0) {
    return NextResponse.json(result);
  }

  const rows = invoices ?? [];
  const currencyOf = new Map(rows.map((i) => [i.id, i.currency as string]));

  // Outstanding balance matches RecordPaymentModal: total minus what has been paid.
  const paymentRows = partition.deletable.map((inv) => ({
    org_id: org.id,
    invoice_id: inv.id,
    amount: Number(inv.total) - Number(inv.amount_paid),
    currency: currencyOf.get(inv.id) ?? "GBP",
    method,
    reference: null,
    paid_at: paidAt,
  }));

  const { error: payError } = await supabase.from("payments").insert(paymentRows);
  if (payError) return NextResponse.json({ error: payError.message }, { status: 500 });

  // Status is computed here, on the server, from the invoice's own totals.
  for (const inv of partition.deletable) {
    const { error: updateError } = await supabase
      .from("invoices")
      .update({ amount_paid: Number(inv.total), status: "paid", paid_at: paidAt })
      .eq("id", inv.id)
      .eq("org_id", org.id);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: auditError } = await supabase.from("audit_logs").insert(
    partition.deletable.map((inv) => ({
      org_id: org.id,
      user_id: user.id,
      action: "invoice.paid",
      entity_type: "invoice",
      entity_id: inv.id,
      meta: {
        invoice_number: inv.invoice_number,
        amount: Number(inv.total) - Number(inv.amount_paid),
        method,
        bulk: true,
      },
    }))
  );

  if (auditError) {
    console.error("[bulk] audit log write failed", {
      action: "invoice.paid",
      ids: partition.deletable.map((i) => i.id),
      error: auditError.message,
    });
  }

  return NextResponse.json(result);
}
