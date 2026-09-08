import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bulkIdsSchema } from "@/lib/bulk-request";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { generateInvoiceNumber } from "@/lib/invoice-number";
import { summarise, type SkipReason } from "@/lib/bulk-actions";

const schema = z.object({
  ids: bulkIdsSchema(),
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

  // A retry with the same id list is not idempotent here — unlike a delete, re-running
  // duplicate on an id that already succeeded creates a second copy. So one failure must
  // never abort the batch or leave the caller unsure which ids actually got duplicated:
  // track outcomes per source and report them honestly instead of 500ing mid-loop.
  const duplicatedIds: string[] = [];
  let failed = 0;

  // Sequential by design — do not parallelise (Promise.all, .map + await, etc).
  // generateInvoiceNumber reads current state to pick the next number, and
  // invoices has a unique (org_id, invoice_number) constraint; concurrent calls
  // would race and collide.
  for (const source of partition.deletable) {
    try {
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
        failed++;
        console.error("[bulk] invoice duplicate failed", {
          sourceInvoiceId: source.id,
          error: insertError?.message ?? "insert returned no row",
        });
        continue;
      }

      const items = (source.invoice_items ?? []) as Array<{
        description: string;
        quantity: number;
        unit_price: number;
        vat_rate: number;
        sort_order: number;
      }>;

      if (items.length > 0) {
        const { error: itemsError } = await supabase.from("invoice_items").insert(
          items.map((item, idx) => ({
            invoice_id: created.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            vat_rate: item.vat_rate,
            sort_order: item.sort_order ?? idx,
          }))
        );

        if (itemsError) {
          // The invoice row exists but carries none of the source's line items, so it is
          // not a usable duplicate — count it as a failure. It is deliberately left in
          // place rather than deleted: a compensating delete here would be its own new
          // failure mode (and this route already establishes that retries are not safe
          // to lean on for cleanup).
          failed++;
          console.error("[bulk] invoice duplicate item copy failed — duplicate left without items", {
            invoiceId: created.id,
            sourceInvoiceId: source.id,
            error: itemsError.message,
          });
          continue;
        }
      }

      duplicatedIds.push(created.id);

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
    } catch (err) {
      failed++;
      console.error("[bulk] invoice duplicate threw", {
        sourceInvoiceId: source.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  // `result` (from `summarise`) describes eligibility, computed before any duplication was
  // attempted. Rewrite it to describe outcome: successes are duplicates that actually got
  // created with their items, and any failure moves from "deleted" to "skipped" with its
  // own reason, so `deleted` + every reason's count still sums to the number of ids requested.
  const failureReasons: SkipReason[] =
    failed > 0
      ? [
          {
            count: failed,
            reason: failed === 1 ? "1 invoice could not be duplicated" : `${failed} invoices could not be duplicated`,
          },
        ]
      : [];

  return NextResponse.json({
    deleted: duplicatedIds.length,
    skipped: result.skipped + failed,
    reasons: [...result.reasons, ...failureReasons],
  });
}
