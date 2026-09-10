import { describe, it, expect } from "vitest";
import {
  buildInvoiceHistory,
  humaniseAction,
  labelForAction,
  labelForEmail,
} from "./invoice-history";

describe("labelForAction", () => {
  it("gives both spellings of an event the same label", () => {
    // These exist because the bulk and single routes were written separately.
    expect(labelForAction("invoice.reminded")).toBe("Reminder sent");
    expect(labelForAction("invoice.reminder_sent")).toBe("Reminder sent");
    expect(labelForAction("invoice.void")).toBe("Voided");
    expect(labelForAction("invoice.voided")).toBe("Voided");
  });

  it("labels the actions that previously rendered as raw strings", () => {
    expect(labelForAction("invoice.late_fee_applied")).toBe("Late fee applied");
    expect(labelForAction("invoice.partial_payment")).toBe("Part payment received");
    expect(labelForAction("payment.refunded")).toBe("Payment refunded");
    expect(labelForAction("payment.received")).toBe("Payment received");
  });

  it("makes a lost payment record impossible to skim past", () => {
    expect(labelForAction("payment.record_failed")).toBe(
      "Payment received but NOT recorded — needs attention"
    );
  });

  it("degrades readably for an action nobody has labelled yet", () => {
    expect(labelForAction("invoice.some_new_thing")).toBe("Some new thing");
  });
});

describe("humaniseAction", () => {
  it("drops the namespace and unslugs the rest", () => {
    expect(humaniseAction("invoice.credit_note_issued")).toBe("Credit note issued");
  });

  it("handles an action with no namespace", () => {
    expect(humaniseAction("something_happened")).toBe("Something happened");
  });
});

describe("labelForEmail", () => {
  it("names the reminder cadence rather than treating each as unknown", () => {
    expect(labelForEmail("overdue-reminder-7d")).toBe("Reminder emailed (7 days overdue)");
    expect(labelForEmail("overdue-reminder-30d")).toBe("Reminder emailed (30 days overdue)");
  });

  it("handles the reminder template with no day suffix", () => {
    expect(labelForEmail("overdue-reminder")).toBe("Reminder emailed");
  });

  it("labels the known templates", () => {
    expect(labelForEmail("invoice-sent")).toBe("Invoice emailed");
    expect(labelForEmail("credit-note")).toBe("Credit note emailed");
  });

  it("degrades readably for an unknown template", () => {
    expect(labelForEmail("some-new-template")).toBe("Some new template emailed");
  });
});

describe("buildInvoiceHistory", () => {
  it("merges audit and email events into one chronological list", () => {
    const entries = buildInvoiceHistory(
      [
        { action: "invoice.created", created_at: "2026-01-01T09:00:00Z" },
        { action: "invoice.sent", created_at: "2026-01-02T09:00:00Z" },
      ],
      [{ created_at: "2026-01-02T09:01:00Z", template_name: "invoice-sent", status: "delivered" }]
    );

    expect(entries.map((e) => e.label)).toEqual([
      "Invoice created",
      "Sent to client",
      "Invoice emailed",
    ]);
  });

  it("records an open as its own entry, at the time it was opened", () => {
    const entries = buildInvoiceHistory(
      [],
      [
        {
          created_at: "2026-01-02T09:00:00Z",
          template_name: "invoice-sent",
          status: "delivered",
          opened_at: "2026-01-05T14:30:00Z",
        },
      ]
    );

    expect(entries).toHaveLength(2);
    expect(entries[0].label).toBe("Invoice emailed");
    expect(entries[1]).toMatchObject({ label: "Opened by client", at: "2026-01-05T14:30:00Z" });
  });

  it("says nothing about delivery when it simply worked", () => {
    const [entry] = buildInvoiceHistory(
      [],
      [{ created_at: "2026-01-02T09:00:00Z", template_name: "invoice-sent", status: "delivered" }]
    );
    expect(entry.detail).toBeUndefined();
  });

  it("surfaces a bounce, because a client who never received it is the point", () => {
    const [entry] = buildInvoiceHistory(
      [],
      [{ created_at: "2026-01-02T09:00:00Z", template_name: "invoice-sent", status: "bounced" }]
    );
    expect(entry.detail).toBe("Bounced — the address rejected it");
  });

  it("hides internal bookkeeping from the client-facing view", () => {
    const entries = buildInvoiceHistory(
      [
        { action: "invoice.sent", created_at: "2026-01-02T09:00:00Z" },
        { action: "invoice.duplicated", created_at: "2026-01-03T09:00:00Z" },
        { action: "payment.invoice_update_conflict", created_at: "2026-01-04T09:00:00Z" },
      ],
      []
    );

    expect(entries.map((e) => e.label)).toEqual(["Sent to client"]);
  });

  it("includes internal events when asked", () => {
    const entries = buildInvoiceHistory(
      [{ action: "invoice.duplicated", created_at: "2026-01-03T09:00:00Z" }],
      [],
      { includeInternal: true }
    );

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ label: "Duplicated", kind: "internal" });
  });

  it("carries the amount and method through on a payment", () => {
    const [entry] = buildInvoiceHistory(
      [
        {
          action: "payment.recorded",
          created_at: "2026-01-06T09:00:00Z",
          meta: { amount: 350, method: "bank_transfer" },
        },
      ],
      []
    );
    expect(entry.detail).toBe("350 · via bank transfer");
  });

  it("returns an empty list rather than failing on an invoice with no history", () => {
    expect(buildInvoiceHistory([], [])).toEqual([]);
  });
});

describe("buildInvoiceHistory — the double-recorded open", () => {
  it("does not claim the client opened it twice when the webhook recorded both", () => {
    // The Resend webhook writes an invoice.viewed audit row AND stamps opened_at,
    // seconds apart. Only one entry should reach the reader.
    const entries = buildInvoiceHistory(
      [{ action: "invoice.viewed", created_at: "2026-01-05T14:30:02Z" }],
      [
        {
          created_at: "2026-01-02T09:00:00Z",
          template_name: "invoice-sent",
          status: "delivered",
          opened_at: "2026-01-05T14:30:00Z",
        },
      ]
    );

    expect(entries.filter((e) => e.label === "Opened by client")).toHaveLength(1);
  });

  it("keeps a genuinely separate open on another day", () => {
    const entries = buildInvoiceHistory(
      [{ action: "invoice.viewed", created_at: "2026-01-05T14:30:00Z" }],
      [
        {
          created_at: "2026-01-02T09:00:00Z",
          template_name: "invoice-sent",
          opened_at: "2026-01-09T11:00:00Z",
        },
      ]
    );

    expect(entries.filter((e) => e.label === "Opened by client")).toHaveLength(2);
  });
});
