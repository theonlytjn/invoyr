import type { BulkActionResult } from "./bulk-actions";

/**
 * The confirmation copy for deleting clients, shared by the clients list and the
 * client detail page.
 *
 * It lives here rather than in either component because both must say exactly the
 * same thing. Two copies of a rule have drifted apart in this codebase before, and
 * the consequence here would be a user consenting to one set of losses on one screen
 * and a different set on another.
 *
 * Every truth must appear and none may be softened into another: the documents keep
 * their billing details, the expenses lose their client attribution, active recurring
 * schedules are stopped, and the deletion still cannot be undone. Archive is named as
 * the reversible alternative whenever there is anything linked to lose.
 */

export function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function describeClientDelete(preview: BulkActionResult): string {
  const totals = (preview.clients ?? []).reduce(
    (acc, c) => ({
      invoices: acc.invoices + c.linkedInvoices,
      estimates: acc.estimates + c.linkedEstimates,
      expenses: acc.expenses + c.linkedExpenses,
      recurring: acc.recurring + c.linkedRecurring,
    }),
    { invoices: 0, estimates: 0, expenses: 0, recurring: 0 }
  );

  const sentences: string[] = [];

  if (totals.invoices > 0 || totals.estimates > 0) {
    const linkedText = [
      totals.invoices > 0 ? pluralize(totals.invoices, "invoice", "invoices") : null,
      totals.estimates > 0 ? pluralize(totals.estimates, "estimate", "estimates") : null,
    ]
      .filter((part): part is string => part !== null)
      .join(" and ");
    const docWord = totals.invoices + totals.estimates === 1 ? "document" : "documents";
    sentences.push(
      `${linkedText} will keep the client's billing details, but the ${docWord} will no longer be linked to a client record.`
    );
  }

  // Expenses carry no billing details, so they need no snapshot — but they do lose
  // their client attribution, which is what per-client profitability is reported
  // from. Silence here would under-report what the delete costs.
  if (totals.expenses > 0) {
    sentences.push(
      `${pluralize(totals.expenses, "expense", "expenses")} will lose ${
        totals.expenses === 1 ? "its" : "their"
      } client attribution.`
    );
  }

  // Recurring schedules are the one linked record that keeps generating work after
  // the client is gone, so the warning names the consequence, not just the count.
  if (totals.recurring > 0) {
    sentences.push(
      `${pluralize(totals.recurring, "active recurring schedule", "active recurring schedules")} will be stopped.`
    );
  }

  if (sentences.length === 0) return "This cannot be undone.";

  sentences.push("This cannot be undone — archive instead if you'd rather keep the link.");
  return sentences.join(" ");
}
