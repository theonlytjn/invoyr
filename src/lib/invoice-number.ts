import { createClient } from "./supabase/server";
import { claimDocumentNumber, formatDocumentNumber } from "./document-number";

export async function generateInvoiceNumber(orgId: string): Promise<string> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organisations")
    .select("invoice_prefix")
    .eq("id", orgId)
    .single();

  if (!org) throw new Error("Organisation not found");

  const n = await claimDocumentNumber(supabase, orgId, "invoice");
  return formatDocumentNumber(org.invoice_prefix ?? "INV", n);
}

/**
 * The number the next invoice will most likely get, for display only. Nothing
 * is reserved: the real number is claimed when the invoice is saved, so
 * opening "New invoice" and walking away no longer burns a number.
 */
export async function previewInvoiceNumber(orgId: string): Promise<string> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from("organisations")
    .select("invoice_prefix, next_invoice_number")
    .eq("id", orgId)
    .single();

  if (!org) throw new Error("Organisation not found");

  return formatDocumentNumber(org.invoice_prefix ?? "INV", org.next_invoice_number);
}
