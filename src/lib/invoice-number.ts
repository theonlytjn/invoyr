import { createClient } from "./supabase/server";

export async function generateInvoiceNumber(orgId: string): Promise<string> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organisations")
    .select("invoice_prefix, next_invoice_number")
    .eq("id", orgId)
    .single();

  if (!org) throw new Error("Organisation not found");

  const { invoice_prefix, next_invoice_number } = org;
  const padded = String(next_invoice_number).padStart(4, "0");
  const invoiceNumber = `${invoice_prefix}-${padded}`;

  await supabase
    .from("organisations")
    .update({ next_invoice_number: next_invoice_number + 1 })
    .eq("id", orgId);

  return invoiceNumber;
}
