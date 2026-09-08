/**
 * Eligibility rules for bulk delete. Pure functions — no database access — so the
 * rules that protect financial records can be tested in isolation.
 *
 * These are the only definition of the rules. The client never re-implements them;
 * it asks the API with `dryRun: true` instead.
 */

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

  for (const row of rows) {
    if (!DELETABLE_INVOICE_STATUSES.has(row.status)) {
      wrongStatus++;
    } else if (row.hasFinancialRecords) {
      encumbered++;
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
  deleted: number;
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
};

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
    } else if (Number(row.total) - Number(row.amount_paid) <= 0) {
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
