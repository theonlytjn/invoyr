import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { outstandingBalance } from "@/lib/bulk-actions";
import { createCreditNote } from "@/lib/credit-notes";
import { formatCurrency } from "@/lib/utils";

// Full db enum (see `payment_method` in supabase/schema.sql). Unlike the bulk
// mark-paid route, "stripe" is included here: recording one payment is a
// considered action on a known invoice, taken by a human who has already seen
// this invoice's history, not a blanket bulk assertion — removing an option
// RecordPaymentModal has always offered would be a silent regression.
const schema = z.object({
  amount: z.number().positive(),
  method: z.enum(["bank_transfer", "stripe", "cash", "cheque", "other"]),
  reference: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  writeOffRemainder: z.boolean().optional().default(false),
});

const NON_PAYABLE_STATUSES = new Set(["draft", "void"]);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
  const { amount, method, reference, writeOffRemainder } = parsed.data;
  const paidAt = parsed.data.paidAt ?? new Date().toISOString();

  const { data: invoice, error: fetchError } = await supabase
    .from("invoices")
    // late_fee_amount and credit_applied are operands of outstandingBalance, so they
    // must be selected or the balance — and therefore the payment we accept — would
    // be computed wrong.
    .select("id, org_id, client_id, status, total, amount_paid, late_fee_amount, credit_applied, currency")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (fetchError || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  if (NON_PAYABLE_STATUSES.has(invoice.status)) {
    return NextResponse.json(
      { error: "Payments cannot be recorded on a draft or voided invoice" },
      { status: 400 }
    );
  }

  // The single source of truth for what this invoice still owes. Never recomputed
  // inline — see the docstring on `outstandingBalance` for why a second copy of
  // this formula previously recorded a payment for the wrong amount.
  const balance = outstandingBalance(invoice);

  if (amount > balance + 0.001) {
    return NextResponse.json(
      { error: `Payment amount cannot exceed the outstanding balance of ${formatCurrency(balance, invoice.currency)}` },
      { status: 400 }
    );
  }

  const { error: payError } = await supabase.from("payments").insert({
    org_id: org.id,
    invoice_id: invoice.id,
    amount,
    currency: invoice.currency,
    method,
    reference: reference?.trim() || null,
    paid_at: paidAt,
  });

  if (payError) return NextResponse.json({ error: payError.message }, { status: 500 });

  // Logged the moment the payment itself is durable — before the invoice update is
  // even attempted, not after it succeeds. `updateError`, the CAS-conflict 409, and
  // a later write-off failure all return early past this point; if the audit insert
  // sat any later, every one of those paths would commit money with no trail. `meta`
  // only records what's actually true right now (the payment as inserted) — not the
  // eventual invoice status, which isn't decided yet and would be wrong on every
  // failure path below.
  const { error: auditError } = await supabase.from("audit_logs").insert({
    org_id: org.id,
    user_id: user.id,
    action: "payment.recorded",
    entity_type: "invoice",
    entity_id: invoice.id,
    meta: { amount, method, reference: reference?.trim() || null },
  });

  if (auditError) {
    console.error("[record-payment] audit log write failed", {
      invoice_id: invoice.id,
      error: auditError.message,
    });
  }

  // amount_paid accumulates the payment just recorded — it is not set from `total`,
  // which would double-count an existing part payment and swallow late fees/credits.
  const newAmountPaid = Number(invoice.amount_paid) + amount;
  const remainderAfterPayment = outstandingBalance({ ...invoice, amount_paid: newAmountPaid });
  const newStatus = remainderAfterPayment <= 0.001 ? "paid" : "partial";
  // Uses the payment's own `paidAt` (the date the user recorded, or "now" if they
  // didn't specify one) rather than a fresh `new Date()` — otherwise a back-dated
  // payment would leave the payment row and the invoice disagreeing about when it
  // was settled.
  const newPaidAt = newStatus === "paid" ? paidAt : null;

  // `.eq("amount_paid", invoice.amount_paid)` makes this a compare-and-swap: if
  // another request changed `amount_paid` between our fetch and this write (two
  // operators recording payments on the same invoice at once), the filter matches
  // zero rows instead of silently overwriting the other write. `.select("id")`
  // is what lets us tell "0 rows matched" apart from "matched, nothing changed".
  const { data: updatedRows, error: updateError } = await supabase
    .from("invoices")
    .update({
      amount_paid: newAmountPaid,
      status: newStatus,
      paid_at: newPaidAt,
    })
    .eq("id", invoice.id)
    .eq("org_id", org.id)
    .eq("amount_paid", invoice.amount_paid)
    .select("id");

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (!updatedRows || updatedRows.length === 0) {
    // The payment is already committed and already audited above — but a reader of
    // the trail scanning for "payment.recorded" alone would see a normal-looking
    // entry and have no way to tell the invoice's own totals never picked it up. A
    // distinct action name makes that state legible without needing to correlate
    // against the 409 response, which isn't itself persisted anywhere.
    const { error: conflictAuditError } = await supabase.from("audit_logs").insert({
      org_id: org.id,
      user_id: user.id,
      action: "payment.invoice_update_conflict",
      entity_type: "invoice",
      entity_id: invoice.id,
      meta: { amount, method },
    });

    if (conflictAuditError) {
      console.error("[record-payment] conflict audit log write failed", {
        invoice_id: invoice.id,
        error: conflictAuditError.message,
      });
    }

    return NextResponse.json(
      {
        error:
          "This invoice changed since it was loaded, so the payment could not be applied. Refresh and try again.",
      },
      { status: 409 }
    );
  }

  let creditNoteIssued = false;
  let creditNoteNumber: string | undefined;
  let creditNoteAmount: number | undefined;

  // Write off whatever the payment didn't cover. `createCreditNote` is handed the
  // invoice as it stands *after* the update above — amount_paid already includes
  // this payment — so its own status recompute lands on "paid" (amount_paid +
  // the new credit_applied equals total + late fee) and its write is the last one
  // to touch the row. Our update above never clobbers it: it only ran first to
  // record the payment-only state for the case where no write-off happens.
  if (writeOffRemainder && remainderAfterPayment > 0.001) {
    const { creditNote, error: creditNoteError } = await createCreditNote({
      supabase,
      org: {
        credit_note_prefix: org.credit_note_prefix,
        next_credit_note_number: org.next_credit_note_number,
      },
      invoice: {
        id: invoice.id,
        org_id: invoice.org_id,
        client_id: invoice.client_id ?? null,
        total: invoice.total,
        amount_paid: newAmountPaid,
        status: newStatus,
        paid_at: newPaidAt,
        late_fee_amount: invoice.late_fee_amount ?? 0,
        credit_applied: invoice.credit_applied ?? 0,
      },
      amount: remainderAfterPayment,
      reason: "Balance written off",
      userId: user.id,
    });

    if (creditNoteError || !creditNote) {
      return NextResponse.json(
        {
          error: `Payment recorded, but the write-off failed: ${creditNoteError ?? "unknown error"}`,
        },
        { status: 500 }
      );
    }

    creditNoteIssued = true;
    creditNoteNumber = creditNote.credit_note_number;
    // The amount actually issued, from the row that was actually written — not the
    // client's predicted remainder, which can be stale (e.g. a late fee landed
    // between page load and submit) and would then misreport what the user consented to.
    creditNoteAmount = creditNote.amount;
  }

  return NextResponse.json({ ok: true, creditNoteIssued, creditNoteNumber, creditNoteAmount });
}
