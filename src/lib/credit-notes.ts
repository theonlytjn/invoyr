import { createClient } from "@/lib/supabase/server";
import type { CreditNote, Invoice, Organisation } from "@/lib/supabase/types";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export type CreditNoteInvoice = Pick<
  Invoice,
  "id" | "org_id" | "client_id" | "total" | "amount_paid" | "status" | "paid_at" | "late_fee_amount" | "credit_applied"
>;

export type CreditNoteOrg = Pick<Organisation, "credit_note_prefix" | "next_credit_note_number">;

export interface CreateCreditNoteParams {
  supabase: SupabaseServerClient;
  org: CreditNoteOrg;
  invoice: CreditNoteInvoice;
  amount: number;
  reason?: string | null;
  userId: string;
}

export type CreateCreditNoteResult =
  | { creditNote: CreditNote; error?: undefined }
  | { creditNote?: undefined; error: string };

/**
 * Creates a credit note against an invoice: numbers it from the org's
 * `credit_note_prefix`/`next_credit_note_number`, increments that counter,
 * accumulates `credit_applied` on the invoice, recomputes its paid/partial
 * status, and writes the audit row.
 *
 * Shared by the invoice-page credit-note route and the "write off the
 * remainder" step of the record-payment flow so this bookkeeping — numbering,
 * accumulation, the status tolerance — has exactly one implementation. Two
 * copies of a balance calculation diverging is what caused a previous bug
 * where invoices silently recorded the wrong payment amounts.
 *
 * Does not send the credit-note email or validate the requested amount
 * against the invoice's remaining balance — both are call-site concerns
 * (the payment-write-off path does not email, and computes its own amount).
 */
export async function createCreditNote({
  supabase,
  org,
  invoice,
  amount,
  reason,
  userId,
}: CreateCreditNoteParams): Promise<CreateCreditNoteResult> {
  const lateFee = invoice.late_fee_amount ?? 0;
  const creditAlready = invoice.credit_applied ?? 0;

  const prefix = org.credit_note_prefix ?? "CN";
  const nextNum = org.next_credit_note_number ?? 1;
  const creditNoteNumber = `${prefix}-${String(nextNum).padStart(4, "0")}`;

  const { data: creditNote, error: insertError } = await supabase
    .from("credit_notes")
    .insert({
      org_id: invoice.org_id,
      invoice_id: invoice.id,
      client_id: invoice.client_id ?? null,
      credit_note_number: creditNoteNumber,
      amount,
      reason: reason ?? null,
      status: "issued",
    })
    .select()
    .single();

  if (insertError || !creditNote) {
    // Log the real Postgres error. This branch previously returned only the generic
    // message, which hid a broken column default for every credit note ever attempted.
    console.error("credit note insert failed", {
      invoice_id: invoice.id,
      credit_note_number: creditNoteNumber,
      error: insertError?.message,
    });
    return { error: insertError?.message ?? "Failed to create credit note" };
  }

  await supabase
    .from("organisations")
    .update({ next_credit_note_number: nextNum + 1 })
    .eq("id", invoice.org_id);

  const newCreditApplied = creditAlready + amount;
  const totalOwed = invoice.total + lateFee;
  let newStatus = invoice.status;
  let paidAt = invoice.paid_at ?? null;

  if (invoice.amount_paid + newCreditApplied >= totalOwed - 0.001) {
    newStatus = "paid";
    paidAt = paidAt ?? new Date().toISOString();
  } else if (invoice.amount_paid + newCreditApplied > 0) {
    newStatus = "partial";
  }

  await supabase
    .from("invoices")
    .update({ credit_applied: newCreditApplied, status: newStatus, paid_at: paidAt })
    .eq("id", invoice.id);

  await supabase.from("audit_logs").insert({
    org_id: invoice.org_id,
    user_id: userId,
    action: "invoice.credit_note_issued",
    entity_type: "invoice",
    entity_id: invoice.id,
    meta: { credit_note_number: creditNoteNumber, amount, reason: reason ?? null },
  });

  return { creditNote };
}
