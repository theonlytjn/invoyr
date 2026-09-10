/**
 * Writes the `payments` row for money that has already been taken.
 *
 * All three capture paths — the PayPal capture route, the PayPal webhook and the
 * Stripe webhook — used to write this row with the error discarded, then carry on and
 * mark the invoice paid. On 2026-09-10 a real GBP 350 PayPal payment did exactly that:
 * the `payment_method` enum had no 'paypal' value, Postgres rejected the insert, and
 * the invoice went to `paid` with no payment record behind it. Nothing surfaced.
 *
 * The response to a failure here cannot be to abort. The customer's money is already
 * captured, so refusing the request or leaving the invoice unpaid would be worse than a
 * missing row — it would show a paying customer an error and chase them for money they
 * have paid. So the write is best-effort, and a failure is made loud instead: an error
 * log with everything needed to reconstruct the row by hand, and an audit entry so it
 * appears in the invoice's own history rather than only in a log nobody is reading.
 *
 * The database shape is described structurally rather than imported, so the failure
 * path can be tested without a live Supabase client.
 */

export type PaymentMethod =
  | "paypal"
  | "stripe"
  | "bank_transfer"
  | "cash"
  | "cheque"
  | "other";

export type PaymentRow = {
  org_id: string;
  invoice_id: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  /** Historically named for Stripe; also holds the PayPal capture id. */
  stripe_payment_intent_id: string | null;
  paid_at: string;
};

type InsertResult = { error: { message: string } | null };

/**
 * The slice of a Supabase client this needs. `any` on the row is deliberate: the real
 * client's `insert` is generic over the table's row type, and a narrower parameter here
 * would make the concrete client fail to satisfy this type. PromiseLike, not Promise,
 * because the query builder is thenable rather than a Promise.
 */
export type PaymentsDb = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from: (table: string) => { insert: (row: any) => PromiseLike<InsertResult> };
};

export async function recordPaymentRow(
  db: PaymentsDb,
  row: PaymentRow,
  /** Provider identifiers (order id, session id) — carried into the log and audit meta. */
  context: Record<string, unknown> = {}
): Promise<{ recorded: boolean; error?: string }> {
  const { error } = await db.from("payments").insert(row);
  if (!error) return { recorded: true };

  console.error("[payments] money was captured but the payment row was NOT written", {
    ...context,
    invoiceId: row.invoice_id,
    amount: row.amount,
    currency: row.currency,
    method: row.method,
    reference: row.stripe_payment_intent_id,
    error: error.message,
  });

  // Best-effort too: if this also fails there is nothing further to try, and throwing
  // would abort a request whose payment has already succeeded.
  try {
    await db.from("audit_logs").insert({
      org_id: row.org_id,
      action: "payment.record_failed",
      entity_type: "invoice",
      entity_id: row.invoice_id,
      meta: {
        ...context,
        amount: row.amount,
        currency: row.currency,
        method: row.method,
        reference: row.stripe_payment_intent_id,
        error: error.message,
      },
    });
  } catch {
    // swallowed deliberately — the console.error above is the durable record
  }

  return { recorded: false, error: error.message };
}
