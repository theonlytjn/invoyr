import { describe, it, expect, vi, afterEach } from "vitest";
import { recordPaymentRow, type PaymentRow, type PaymentsDb } from "./record-payment-row";

afterEach(() => {
  vi.restoreAllMocks();
});

const ROW: PaymentRow = {
  org_id: "org-1",
  invoice_id: "inv-1",
  amount: 350,
  currency: "GBP",
  method: "paypal",
  stripe_payment_intent_id: "3UA19765YP699862A",
  paid_at: "2026-09-10T20:19:34.138Z",
};

/** Records what each table received, so the audit fallback can be asserted. */
function stubDb(errorByTable: Record<string, string | undefined> = {}) {
  const inserts: Array<{ table: string; row: any }> = [];
  const db: PaymentsDb = {
    from: (table: string) => ({
      insert: async (row: unknown) => {
        inserts.push({ table, row });
        const message = errorByTable[table];
        return { error: message ? { message } : null };
      },
    }),
  };
  return { db, inserts };
}

describe("recordPaymentRow", () => {
  it("writes the payment and reports success", async () => {
    const { db, inserts } = stubDb();

    expect(await recordPaymentRow(db, ROW)).toEqual({ recorded: true });
    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toMatchObject({ table: "payments", row: ROW });
  });

  it("does not write an audit entry when the payment saved cleanly", async () => {
    const { db, inserts } = stubDb();
    await recordPaymentRow(db, ROW);

    expect(inserts.some((i) => i.table === "audit_logs")).toBe(false);
  });

  it("reports failure instead of silently discarding the error", async () => {
    // The real one: `invalid input value for enum payment_method: "paypal"`. The old
    // code ignored it and marked a GBP 350 invoice paid with no payment behind it.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { db } = stubDb({
      payments: 'invalid input value for enum payment_method: "paypal"',
    });

    const result = await recordPaymentRow(db, ROW);

    expect(result.recorded).toBe(false);
    expect(result.error).toContain("payment_method");
  });

  it("leaves an audit entry so the loss shows in the invoice's own history", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { db, inserts } = stubDb({ payments: "enum rejected" });

    await recordPaymentRow(db, ROW, { paypal_capture: "3UA19765YP699862A" });

    const audit = inserts.find((i) => i.table === "audit_logs");
    expect(audit?.row).toMatchObject({
      org_id: "org-1",
      action: "payment.record_failed",
      entity_type: "invoice",
      entity_id: "inv-1",
    });
    expect(audit?.row.meta).toMatchObject({
      amount: 350,
      currency: "GBP",
      reference: "3UA19765YP699862A",
      error: "enum rejected",
    });
  });

  it("logs everything needed to rebuild the row by hand", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { db } = stubDb({ payments: "enum rejected" });

    await recordPaymentRow(db, ROW, { paypal_order: "0PD59430FU850870F" });

    expect(spy).toHaveBeenCalledWith(
      "[payments] money was captured but the payment row was NOT written",
      expect.objectContaining({
        invoiceId: "inv-1",
        amount: 350,
        currency: "GBP",
        method: "paypal",
        reference: "3UA19765YP699862A",
        paypal_order: "0PD59430FU850870F",
      })
    );
  });

  it("still reports the failure when the audit write also fails", async () => {
    // Never throw out of here — the caller's payment has already been captured.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const db: PaymentsDb = {
      from: (table: string) => ({
        insert: async () => {
          if (table === "audit_logs") throw new Error("audit unavailable");
          return { error: { message: "enum rejected" } };
        },
      }),
    };

    await expect(recordPaymentRow(db, ROW)).resolves.toMatchObject({ recorded: false });
  });

  it("carries provider identifiers into the audit meta", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { db, inserts } = stubDb({ payments: "boom" });

    await recordPaymentRow(db, { ...ROW, method: "stripe" }, { stripe_session: "cs_test_1" });

    const audit = inserts.find((i) => i.table === "audit_logs");
    expect(audit?.row.meta).toMatchObject({ stripe_session: "cs_test_1", method: "stripe" });
  });
});
