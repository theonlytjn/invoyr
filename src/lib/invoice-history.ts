/**
 * The per-invoice history shown on the invoice page.
 *
 * Pure — no imports, no I/O — so the mapping from stored action names to the words a
 * user reads can be tested. That mapping is exactly where this feature was broken:
 * the page carried a label map that had drifted from the action names the app
 * actually writes, so bulk reminders rendered as the raw string `invoice.reminded`
 * and six other actions had no label at all.
 *
 * Two sources are merged: `audit_logs` rows (what happened to the invoice) and
 * `email_logs` rows (what was sent to the client, and whether it arrived).
 */

export type HistoryEntry = {
  /** ISO timestamp — the caller sorts on this. */
  at: string;
  label: string;
  /** Secondary line: an amount, a delivery problem, a recipient. Absent when there's nothing to add. */
  detail?: string;
  /** Client-visible events are dotted differently, so "they opened it" stands out. */
  kind: "client" | "internal";
};

export type AuditRow = {
  action: string;
  created_at: string;
  meta?: unknown;
};

export type EmailRow = {
  created_at: string;
  template_name: string;
  status?: string | null;
  opened_at?: string | null;
};

/**
 * Canonical labels. Several actions have two spellings in the codebase because they
 * were introduced by different paths — `invoice.reminded` from the bulk route and
 * `invoice.reminder_sent` from the single one, `invoice.void` and `invoice.voided`.
 * Both spellings are mapped rather than renamed, because rows already exist under
 * each and rewriting history to tidy a name would be worse than carrying an alias.
 */
const ACTION_LABELS: Record<string, string> = {
  "invoice.created": "Invoice created",
  "invoice.issued": "Issued",
  "invoice.sent": "Sent to client",
  "invoice.viewed": "Opened by client",
  "invoice.paid": "Marked as paid",
  "invoice.partial_payment": "Part payment received",
  "invoice.void": "Voided",
  "invoice.voided": "Voided",
  "invoice.overdue": "Became overdue",
  "invoice.late_fee_applied": "Late fee applied",
  "invoice.reminded": "Reminder sent",
  "invoice.reminder_sent": "Reminder sent",
  "invoice.credit_note_issued": "Credit note issued",
  "invoice.duplicated": "Duplicated",
  "invoice.deleted": "Deleted",
  "payment.recorded": "Payment recorded",
  "payment.received": "Payment received",
  "payment.refunded": "Payment refunded",
  "payment.failed": "Payment failed",
  "invoice.payment_failed": "Payment failed",
  "payment.invoice_update_conflict": "Payment recorded, invoice not updated",
  // Deliberately blunt: the money arrived but the books do not show it, and whoever
  // reads this timeline is the person who has to fix it.
  "payment.record_failed": "Payment received but NOT recorded — needs attention",
};

/**
 * Events a client would recognise as something that happened between you and them.
 * Everything else is bookkeeping. The invoice history is used to evidence chasing —
 * "I sent it, I reminded you, you opened it" — so internal noise is filtered out by
 * default rather than shown and explained.
 */
const INTERNAL_ACTIONS = new Set([
  "invoice.duplicated",
  "invoice.deleted",
  "payment.invoice_update_conflict",
]);

/**
 * Turns an unmapped action into something readable rather than leaking the raw
 * identifier at a client. `invoice.some_new_thing` becomes "Some new thing", so a
 * future action added without a label degrades instead of embarrassing anyone.
 */
export function humaniseAction(action: string): string {
  const tail = action.includes(".") ? action.slice(action.indexOf(".") + 1) : action;
  const words = tail.replace(/_/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : action;
}

export function labelForAction(action: string): string {
  return ACTION_LABELS[action] ?? humaniseAction(action);
}

/**
 * Email templates. Reminders carry a day suffix (`overdue-reminder-7d`), so they are
 * matched by prefix and the interval is surfaced rather than enumerating every
 * variant — a new cadence should not silently become an unlabelled event.
 */
export function labelForEmail(templateName: string): string {
  if (templateName.startsWith("overdue-reminder")) {
    const days = templateName.match(/-(\d+)d$/)?.[1];
    return days ? `Reminder emailed (${days} days overdue)` : "Reminder emailed";
  }

  switch (templateName) {
    case "invoice-sent":
      return "Invoice emailed";
    case "credit-note":
      return "Credit note emailed";
    case "statement":
      return "Statement emailed";
    case "payment-failed":
      return "Payment failure notice emailed";
    default:
      return humaniseAction(templateName.replace(/-/g, " ")) + " emailed";
  }
}

/** Only surfaced when delivery did not simply succeed — a clean send needs no note. */
function deliveryDetail(status?: string | null): string | undefined {
  if (!status) return undefined;
  if (status === "sent" || status === "delivered") return undefined;
  if (status === "bounced") return "Bounced — the address rejected it";
  if (status === "failed") return "Failed to send";
  return `Delivery status: ${status}`;
}

/** Minute-granularity bucket, used to recognise the same open recorded twice. */
function toMinute(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 60000);
}

/**
 * The amount formatter is injected rather than imported so this module stays free of
 * dependencies and the caller keeps control of currency — the invoice knows its own,
 * this function cannot. Falls back to the bare number if no formatter is given.
 */
function amountDetail(meta: unknown, formatAmount?: (n: number) => string): string | undefined {
  if (!meta || typeof meta !== "object") return undefined;
  const m = meta as Record<string, unknown>;
  const parts: string[] = [];

  if (typeof m.credit_note_number === "string") parts.push(m.credit_note_number);

  const rawAmount = m.amount;
  if (typeof rawAmount === "number" || typeof rawAmount === "string") {
    const n = Number(rawAmount);
    parts.push(Number.isFinite(n) && formatAmount ? formatAmount(n) : String(rawAmount));
  }

  if (typeof m.method === "string") parts.push(`via ${m.method.replace(/_/g, " ")}`);

  return parts.length ? parts.join(" · ") : undefined;
}

/**
 * Builds the merged, sorted history. Email sends become their own entries — they were
 * previously invisible, with only opens surfacing — and an email that was opened
 * contributes a second entry at the time it was opened.
 *
 * `includeInternal` exists so a future "show technical detail" toggle needs no change
 * here; it defaults to the client-facing view.
 */
export function buildInvoiceHistory(
  auditRows: AuditRow[],
  emailRows: EmailRow[],
  options: { includeInternal?: boolean; formatAmount?: (n: number) => string } = {}
): HistoryEntry[] {
  const entries: HistoryEntry[] = [];

  const viewedMinutes = new Set(
    auditRows.filter((r) => r.action === "invoice.viewed").map((r) => toMinute(r.created_at))
  );

  for (const row of auditRows) {
    const isInternal = INTERNAL_ACTIONS.has(row.action);
    if (isInternal && !options.includeInternal) continue;

    entries.push({
      at: row.created_at,
      label: labelForAction(row.action),
      detail: amountDetail(row.meta, options.formatAmount),
      kind: isInternal ? "internal" : "client",
    });
  }

  for (const row of emailRows) {
    entries.push({
      at: row.created_at,
      label: labelForEmail(row.template_name),
      detail: deliveryDetail(row.status),
      kind: "client",
    });

    // An open is a separate moment from the send, and it is the single most useful
    // line when chasing payment, so it earns its own entry at its own time.
    //
    // The Resend webhook records an open twice — an `invoice.viewed` audit row and
    // the `opened_at` stamp — so without this the history would claim the client
    // opened it twice, seconds apart. Matched on the minute rather than the exact
    // instant because the two writes are separate statements.
    if (row.opened_at && !viewedMinutes.has(toMinute(row.opened_at))) {
      entries.push({
        at: row.opened_at,
        label: "Opened by client",
        kind: "client",
      });
    }
  }

  return entries.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
