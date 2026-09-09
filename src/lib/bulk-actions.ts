/**
 * Eligibility rules for bulk delete. Pure functions — no database access — so the
 * rules that protect financial records can be tested in isolation.
 *
 * These are the only definition of the rules. The client never re-implements them;
 * it asks the API with `dryRun: true` instead.
 */

/**
 * Most ids one bulk request may carry.
 *
 * Defined here so the server's Zod schemas and the lists' "select all" agree on
 * one number: an uncapped select-all on an unpaginated list would otherwise POST
 * more ids than the routes accept and fail validation with a bare "Invalid
 * request". See `bulkIdsSchema` in `bulk-request.ts` for the server half.
 */
export const MAX_BULK_IDS = 50;

/**
 * Most ids one bulk *PDF* request may carry.
 *
 * Lower than `MAX_BULK_IDS` because rendering is the expensive bulk action: each
 * PDF is rendered sequentially (concurrent rendering is memory-hungry on a
 * serverless function), so 50 of them would not finish inside the route's
 * `maxDuration` and the user would get a timeout instead of a zip.
 */
export const MAX_BULK_PDF_IDS = 15;

/**
 * Which of `visibleIds` a "select all" click may add, and whether it had to leave
 * some out.
 *
 * Slicing the visible ids to `max` is not enough. `useRowSelection.toggleAll`
 * unions rather than replaces, and a selection deliberately survives a change of
 * search — so selecting all under one search and then all under another would
 * union to `2 x max` ids and hit the very "Invalid request" the cap exists to
 * prevent. Capacity is therefore measured against the *whole* selection, not the
 * visible slice.
 *
 * Pure and defined here so the arithmetic has one home and one set of tests
 * instead of a copy per list.
 */
export function selectAllAddition(
  visibleIds: string[],
  isSelected: (id: string) => boolean,
  selectedCount: number,
  max: number
): { add: string[]; capped: boolean } {
  const unselected = visibleIds.filter((id) => !isSelected(id));
  const add = unselected.slice(0, Math.max(0, max - selectedCount));
  return { add, capped: add.length < unselected.length };
}

export type SkipReason = { count: number; reason: string };

export type Partition<T> = {
  deletable: T[];
  skips: SkipReason[];
};

export type InvoiceRow = {
  id: string;
  invoice_number: string;
  status: string;
  /** True when the invoice has payments, refunds or credit notes attached. */
  hasFinancialRecords: boolean;
  /**
   * True when some estimate points at this invoice via `converted_invoice_id`.
   *
   * Converting an estimate produces a *draft* invoice, which these rules would
   * otherwise happily delete — and `estimates.converted_invoice_id` is
   * ON DELETE SET NULL, so the delete nulls the link while the estimate's
   * status stays 'converted'. The estimate would then pass `partitionEstimates`
   * and become bulk-deletable itself: the protection would evaporate silently.
   * Treat the invoice as encumbered instead.
   */
  hasSourceEstimate: boolean;
};

export type EstimateRow = {
  id: string;
  estimate_number: string;
  converted_invoice_id: string | null;
};

export type ExpenseRow = {
  id: string;
  title: string;
  amount: number;
  invoice_id: string | null;
};

export type ClientRow = {
  id: string;
  name: string;
  /** True when the client is referenced by any invoice, estimate or expense. */
  hasLinkedRecords: boolean;
};

const DELETABLE_INVOICE_STATUSES = new Set(["draft", "void"]);

function skip(count: number, singular: string, plural: string): SkipReason[] {
  if (count === 0) return [];
  return [{ count, reason: count === 1 ? `1 ${singular}` : `${count} ${plural}` }];
}

export function partitionInvoices(rows: InvoiceRow[]): Partition<InvoiceRow> {
  const deletable: InvoiceRow[] = [];
  let wrongStatus = 0;
  let encumbered = 0;
  let fromEstimate = 0;

  for (const row of rows) {
    if (!DELETABLE_INVOICE_STATUSES.has(row.status)) {
      wrongStatus++;
    } else if (row.hasFinancialRecords) {
      encumbered++;
    } else if (row.hasSourceEstimate) {
      fromEstimate++;
    } else {
      deletable.push(row);
    }
  }

  return {
    deletable,
    skips: [
      ...skip(
        wrongStatus,
        "invoice has been sent — void it instead",
        "invoices have been sent — void them instead"
      ),
      ...skip(
        encumbered,
        "invoice has payments or credit notes attached",
        "invoices have payments or credit notes attached"
      ),
      ...skip(
        fromEstimate,
        "invoice was converted from an estimate",
        "invoices were converted from estimates"
      ),
    ],
  };
}

export function partitionEstimates(rows: EstimateRow[]): Partition<EstimateRow> {
  const deletable = rows.filter((r) => r.converted_invoice_id === null);
  const converted = rows.length - deletable.length;

  return {
    deletable,
    skips: skip(
      converted,
      "estimate has been converted to an invoice",
      "estimates have been converted to invoices"
    ),
  };
}

export function partitionExpenses(rows: ExpenseRow[]): Partition<ExpenseRow> {
  const deletable = rows.filter((r) => r.invoice_id === null);
  const billed = rows.length - deletable.length;

  return {
    deletable,
    skips: skip(
      billed,
      "expense has been billed to an invoice",
      "expenses have been billed to an invoice"
    ),
  };
}

export type ExpenseEditRow = {
  id: string;
  title: string;
  invoice_id: string | null;
};

/**
 * Bulk edit uses the same rule as bulk delete: an expense already billed onto an
 * invoice is left alone. Changing its client or billable flag would contradict the
 * invoice it was billed to, and one rule per record type keeps the product
 * explainable — the user sees the same sentence whichever action they tried.
 */
export function partitionExpenseEdit(rows: ExpenseEditRow[]): Partition<ExpenseEditRow> {
  const deletable = rows.filter((r) => r.invoice_id === null);
  const billed = rows.length - deletable.length;

  return {
    deletable,
    skips: skip(
      billed,
      "expense has been billed to an invoice",
      "expenses have been billed to an invoice"
    ),
  };
}

export function partitionClients(rows: ClientRow[]): Partition<ClientRow> {
  const deletable = rows.filter((r) => !r.hasLinkedRecords);
  const linked = rows.length - deletable.length;

  return {
    deletable,
    skips: skip(
      linked,
      "client has invoices or expenses — archive it instead",
      "clients have invoices or expenses — archive them instead"
    ),
  };
}

export type BulkActionResult = {
  /**
   * How many records the action succeeded on. Named `deleted` because delete was
   * the first action to use this shape; for mark-paid, remind and duplicate it
   * means "how many were marked / sent / duplicated". Kept for compatibility —
   * prefer `succeeded`, which says what it means.
   */
  deleted: number;
  /**
   * Same number as `deleted`, under a name that is true of every action.
   * Optional because it is a response field: the older `bulk/send` and
   * `bulk/void` routes have their own shape and do not send it, so consumers
   * should read `succeeded ?? deleted`.
   */
  succeeded?: number;
  skipped: number;
  reasons: SkipReason[];
};

/**
 * Turns a partition into the API response shape. Ids that never came back from the
 * database — because they belong to another org, or no longer exist — are counted
 * as skipped rather than silently dropped.
 */
export function summarise<T extends { id: string }>(
  partition: Partition<T>,
  requestedIds: string[]
): BulkActionResult {
  const seen = partition.deletable.length + partition.skips.reduce((n, s) => n + s.count, 0);
  const missing = requestedIds.length - seen;

  return {
    deleted: partition.deletable.length,
    succeeded: partition.deletable.length,
    skipped: requestedIds.length - partition.deletable.length,
    reasons: [
      ...partition.skips,
      ...skip(missing > 0 ? missing : 0, "record could not be found", "records could not be found"),
    ],
  };
}

export type MarkPaidRow = {
  id: string;
  invoice_number: string;
  status: string;
  total: number;
  amount_paid: number;
  late_fee_amount?: number | null;
  credit_applied?: number | null;
};

/**
 * The canonical outstanding balance of an invoice: what the client still owes.
 *
 *     total + late fee − amount already paid − credit already applied
 *
 * This is the same formula used by the invoice detail page, `InvoiceActions`,
 * the credit-note route and the refund route. Getting it wrong in either
 * direction falsifies a financial record: dropping the credit records a payment
 * for money that was never owed and never received; dropping the late fee
 * records one that is short, leaving a "Paid" invoice showing a balance.
 *
 * Every operand is coerced with `Number(...)` on purpose — these are Postgres
 * `numeric` columns, which the Supabase client can hand back as strings, and
 * `"1000" - 200` would silently become string concatenation on the `+` operand.
 * `?? 0` covers both `null` (column default absent from an older row) and
 * `undefined` (column not selected).
 */
export function outstandingBalance(row: {
  total: number | string;
  amount_paid: number | string;
  late_fee_amount?: number | string | null;
  credit_applied?: number | string | null;
}): number {
  return (
    Number(row.total) +
    Number(row.late_fee_amount ?? 0) -
    Number(row.amount_paid) -
    Number(row.credit_applied ?? 0)
  );
}

export type RemindRow = {
  id: string;
  invoice_number: string;
  status: string;
  clientEmail: string | null;
};

const PAYABLE_STATUSES = new Set(["issued", "sent", "overdue", "partial"]);
const REMINDABLE_STATUSES = new Set(["issued", "sent", "overdue"]);

export function partitionMarkPaid(rows: MarkPaidRow[]): Partition<MarkPaidRow> {
  const deletable: MarkPaidRow[] = [];
  let drafts = 0;
  let settled = 0;
  let nothingOutstanding = 0;

  for (const row of rows) {
    if (row.status === "draft") {
      drafts++;
    } else if (!PAYABLE_STATUSES.has(row.status)) {
      settled++;
    } else if (outstandingBalance(row) <= 0) {
      nothingOutstanding++;
    } else {
      deletable.push(row);
    }
  }

  return {
    deletable,
    skips: [
      ...skip(drafts, "invoice is still a draft — issue it first", "invoices are still drafts — issue them first"),
      ...skip(settled, "invoice is already paid or voided", "invoices are already paid or voided"),
      ...skip(nothingOutstanding, "invoice has nothing outstanding", "invoices have nothing outstanding"),
    ],
  };
}

export function partitionRemind(rows: RemindRow[]): Partition<RemindRow> {
  const deletable: RemindRow[] = [];
  let wrongStatus = 0;
  let noEmail = 0;

  for (const row of rows) {
    if (!REMINDABLE_STATUSES.has(row.status)) wrongStatus++;
    else if (!row.clientEmail) noEmail++;
    else deletable.push(row);
  }

  return {
    deletable,
    skips: [
      ...skip(wrongStatus, "invoice is not awaiting payment", "invoices are not awaiting payment"),
      ...skip(noEmail, "invoice has a client with no email address", "invoices have clients with no email address"),
    ],
  };
}
