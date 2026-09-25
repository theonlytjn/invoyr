/**
 * Applies the invoice's new payment state (status / amount_paid / paid_at) after
 * money has moved.
 *
 * Every capture path used to write this as a bare `await supabase.from("invoices")
 * .update(...)` with the result discarded, then return success. A failure there is
 * invisible and expensive: the customer has paid, the invoice still reads unpaid,
 * the overdue cron keeps chasing them — and because the webhook handlers answer
 * 200 regardless, Stripe and PayPal never retry.
 *
 * So the result is checked, and a failure is made loud the same way
 * `recordPaymentRow` does: an error log carrying everything needed to set the
 * state by hand, plus an audit entry so it shows in the invoice's own history.
 * The caller decides whether to fail the request; webhooks should, so the
 * provider retries.
 *
 * `.select("id")` matters beyond reading the row back: a row hidden by RLS is
 * filtered rather than rejected, so an update that touches nothing still returns
 * `error: null`. An empty result is therefore also a failure.
 */

export type InvoicePaymentState = {
  status?: string;
  amount_paid?: number;
  paid_at?: string | null;
};

type UpdateResult = { data: { id: string }[] | null; error: { message: string } | null };

/** The slice of a Supabase client this needs; see PaymentsDb for why `any` is used. */
export type InvoiceStateDb = {
  from: (table: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: (values: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      eq: (column: string, value: any) => { select: (columns: string) => PromiseLike<UpdateResult> };
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    insert: (row: any) => PromiseLike<{ error: { message: string } | null }>;
  };
};

export async function applyInvoicePaymentState(
  db: InvoiceStateDb,
  args: { orgId: string; invoiceId: string; state: InvoicePaymentState },
  /** Provider identifiers (capture id, session id) — carried into the log and audit meta. */
  context: Record<string, unknown> = {}
): Promise<{ applied: boolean; error?: string }> {
  const { data, error } = await db
    .from("invoices")
    .update(args.state)
    .eq("id", args.invoiceId)
    .select("id");

  if (!error && data?.length) return { applied: true };

  const reason = error?.message ?? "no invoice row was updated";

  console.error("[payments] money moved but the invoice state was NOT updated", {
    ...context,
    invoiceId: args.invoiceId,
    state: args.state,
    error: reason,
  });

  try {
    await db.from("audit_logs").insert({
      org_id: args.orgId,
      action: "invoice.payment_state_failed",
      entity_type: "invoice",
      entity_id: args.invoiceId,
      meta: { ...context, ...args.state, error: reason },
    });
  } catch {
    // swallowed deliberately — the console.error above is the durable record
  }

  return { applied: false, error: reason };
}
