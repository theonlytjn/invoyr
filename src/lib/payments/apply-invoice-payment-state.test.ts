import { describe, expect, it, vi } from "vitest";
import { applyInvoicePaymentState, type InvoiceStateDb } from "./apply-invoice-payment-state";

function makeDb(result: { data: { id: string }[] | null; error: { message: string } | null }) {
  const auditInsert = vi.fn().mockResolvedValue({ error: null });
  const select = vi.fn().mockResolvedValue(result);
  const db: InvoiceStateDb = {
    from: (table: string) =>
      table === "invoices"
        ? { update: () => ({ eq: () => ({ select }) }), insert: auditInsert }
        : { update: () => ({ eq: () => ({ select }) }), insert: auditInsert },
  };
  return { db, auditInsert, select };
}

const ARGS = { orgId: "org-1", invoiceId: "inv-1", state: { status: "paid", amount_paid: 350 } };

describe("applyInvoicePaymentState", () => {
  it("reports success when a row comes back", async () => {
    const { db, auditInsert } = makeDb({ data: [{ id: "inv-1" }], error: null });
    await expect(applyInvoicePaymentState(db, ARGS)).resolves.toEqual({ applied: true });
    expect(auditInsert).not.toHaveBeenCalled();
  });

  it("treats a database error as a failure and records it in the invoice history", async () => {
    const { db, auditInsert } = makeDb({ data: null, error: { message: "boom" } });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await applyInvoicePaymentState(db, ARGS, { paypal_capture: "CAP-1" });

    expect(result).toEqual({ applied: false, error: "boom" });
    expect(auditInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "invoice.payment_state_failed",
        entity_id: "inv-1",
        meta: expect.objectContaining({ paypal_capture: "CAP-1", error: "boom" }),
      })
    );
    spy.mockRestore();
  });

  it("treats zero updated rows as a failure — an update filtered by RLS returns no error", async () => {
    const { db } = makeDb({ data: [], error: null });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await applyInvoicePaymentState(db, ARGS);

    expect(result.applied).toBe(false);
    expect(result.error).toMatch(/no invoice row was updated/);
    spy.mockRestore();
  });
});
