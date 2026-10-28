import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Replaces a document's line items without ever leaving it empty.
 *
 * The old pattern was delete-all, then insert, with neither result checked: a
 * failed insert left an estimate or recurring invoice carrying a total and no
 * lines, and the route still answered "ok". New lines are written first; the
 * old ones are removed by id only once that has succeeded. This is the same
 * order InvoiceForm uses for invoices.
 *
 * Returns an error message, or null on success.
 */
export async function replaceLineItems(
  supabase: SupabaseClient,
  table: "estimate_items" | "recurring_invoice_items",
  parentColumn: "estimate_id" | "recurring_invoice_id",
  parentId: string,
  rows: Record<string, unknown>[]
): Promise<string | null> {
  const { data: existing, error: readError } = await supabase
    .from(table)
    .select("id")
    .eq(parentColumn, parentId);

  if (readError) return readError.message;

  const { error: insertError } = await supabase
    .from(table)
    .insert(rows.map((row, i) => ({ ...row, [parentColumn]: parentId, sort_order: i })));

  if (insertError) return insertError.message;

  const oldIds = (existing ?? []).map((row: { id: string }) => row.id);
  if (oldIds.length) {
    const { error: deleteError } = await supabase.from(table).delete().in("id", oldIds);
    if (deleteError) {
      return `Your changes were saved, but the previous line items couldn't be removed (${deleteError.message}). Reload before editing again.`;
    }
  }

  return null;
}
