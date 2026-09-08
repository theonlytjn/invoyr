import { describe, it, expect } from "vitest";
import {
  partitionInvoices,
  partitionEstimates,
  partitionExpenses,
  partitionClients,
  summarise,
  partitionMarkPaid,
  partitionRemind,
  outstandingBalance,
} from "./bulk-actions";

describe("partitionInvoices", () => {
  it("deletes drafts and voided invoices", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "draft", hasFinancialRecords: false, hasSourceEstimate: false },
      { id: "b", invoice_number: "INV-2", status: "void", hasFinancialRecords: false, hasSourceEstimate: false },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result.skips).toEqual([]);
  });

  it("skips issued, sent and paid invoices with a void-instead reason", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "draft", hasFinancialRecords: false, hasSourceEstimate: false },
      { id: "b", invoice_number: "INV-2", status: "issued", hasFinancialRecords: false, hasSourceEstimate: false },
      { id: "c", invoice_number: "INV-3", status: "sent", hasFinancialRecords: false, hasSourceEstimate: false },
      { id: "d", invoice_number: "INV-4", status: "paid", hasFinancialRecords: false, hasSourceEstimate: false },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a"]);
    expect(result.skips).toEqual([
      { count: 3, reason: "3 invoices have been sent — void them instead" },
    ]);
  });

  it("skips a voided invoice that still has payments or credit notes attached", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "void", hasFinancialRecords: true, hasSourceEstimate: false },
      { id: "b", invoice_number: "INV-2", status: "draft", hasFinancialRecords: false, hasSourceEstimate: false },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["b"]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 invoice has payments or credit notes attached" },
    ]);
  });

  it("reports both skip reasons separately", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "sent", hasFinancialRecords: false, hasSourceEstimate: false },
      { id: "b", invoice_number: "INV-2", status: "void", hasFinancialRecords: true, hasSourceEstimate: false },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable).toEqual([]);
    expect(result.skips).toHaveLength(2);
  });

  it("uses singular wording for one skipped invoice", () => {
    const rows = [{ id: "a", invoice_number: "INV-1", status: "sent", hasFinancialRecords: false, hasSourceEstimate: false }];
    expect(partitionInvoices(rows).skips).toEqual([
      { count: 1, reason: "1 invoice has been sent — void it instead" },
    ]);
  });

  it("uses plural wording for multiple voided invoices with financial records attached", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "void", hasFinancialRecords: true, hasSourceEstimate: false },
      { id: "b", invoice_number: "INV-2", status: "void", hasFinancialRecords: true, hasSourceEstimate: false },
    ];
    expect(partitionInvoices(rows).skips).toEqual([
      { count: 2, reason: "2 invoices have payments or credit notes attached" },
    ]);
  });

  it("skips a draft invoice that an estimate was converted into", () => {
    // Deleting it would null estimates.converted_invoice_id (ON DELETE SET NULL)
    // and hand the estimate back its own deletability.
    const rows = [
      { id: "a", invoice_number: "INV-9", status: "draft", hasFinancialRecords: false, hasSourceEstimate: true },
      { id: "b", invoice_number: "INV-2", status: "draft", hasFinancialRecords: false, hasSourceEstimate: false },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["b"]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 invoice was converted from an estimate" },
    ]);
  });

  it("uses plural wording for multiple invoices converted from estimates", () => {
    const rows = [
      { id: "a", invoice_number: "INV-9", status: "draft", hasFinancialRecords: false, hasSourceEstimate: true },
      { id: "b", invoice_number: "INV-8", status: "void", hasFinancialRecords: false, hasSourceEstimate: true },
    ];
    expect(partitionInvoices(rows).skips).toEqual([
      { count: 2, reason: "2 invoices were converted from estimates" },
    ]);
  });
});

describe("partitionEstimates", () => {
  it("deletes estimates that were never converted", () => {
    const rows = [
      { id: "a", estimate_number: "EST-1", converted_invoice_id: null },
      { id: "b", estimate_number: "EST-2", converted_invoice_id: null },
    ];
    const result = partitionEstimates(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result.skips).toEqual([]);
  });

  it("skips converted estimates", () => {
    const rows = [
      { id: "a", estimate_number: "EST-1", converted_invoice_id: null },
      { id: "b", estimate_number: "EST-2", converted_invoice_id: "inv-1" },
    ];
    const result = partitionEstimates(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a"]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 estimate has been converted to an invoice" },
    ]);
  });

  it("uses plural wording for multiple converted estimates", () => {
    const rows = [
      { id: "a", estimate_number: "EST-1", converted_invoice_id: "inv-1" },
      { id: "b", estimate_number: "EST-2", converted_invoice_id: "inv-2" },
    ];
    expect(partitionEstimates(rows).skips).toEqual([
      { count: 2, reason: "2 estimates have been converted to invoices" },
    ]);
  });
});

describe("partitionExpenses", () => {
  it("deletes expenses that have not been billed", () => {
    const rows = [{ id: "a", title: "Train", amount: 40, invoice_id: null }];
    expect(partitionExpenses(rows).deletable.map((r) => r.id)).toEqual(["a"]);
  });

  it("skips expenses already billed to an invoice", () => {
    const rows = [
      { id: "a", title: "Train", amount: 40, invoice_id: null },
      { id: "b", title: "Hotel", amount: 120, invoice_id: "inv-1" },
    ];
    const result = partitionExpenses(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a"]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 expense has been billed to an invoice" },
    ]);
  });

  it("uses plural wording for multiple billed expenses", () => {
    const rows = [
      { id: "a", title: "Train", amount: 40, invoice_id: "inv-1" },
      { id: "b", title: "Hotel", amount: 120, invoice_id: "inv-2" },
    ];
    // Deliberate copy quirk carried over from the brief: "an invoice" stays
    // singular even when multiple expenses are being reported on.
    expect(partitionExpenses(rows).skips).toEqual([
      { count: 2, reason: "2 expenses have been billed to an invoice" },
    ]);
  });
});

describe("partitionClients", () => {
  it("deletes clients with no linked records", () => {
    const rows = [{ id: "a", name: "Acme", hasLinkedRecords: false }];
    expect(partitionClients(rows).deletable.map((r) => r.id)).toEqual(["a"]);
  });

  it("skips clients with linked records and suggests archiving", () => {
    const rows = [
      { id: "a", name: "Acme", hasLinkedRecords: false },
      { id: "b", name: "Globex", hasLinkedRecords: true },
      { id: "c", name: "Initech", hasLinkedRecords: true },
    ];
    const result = partitionClients(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a"]);
    expect(result.skips).toEqual([
      { count: 2, reason: "2 clients have invoices or expenses — archive them instead" },
    ]);
  });

  it("uses singular wording for one client with linked records", () => {
    const rows = [{ id: "a", name: "Acme", hasLinkedRecords: true }];
    expect(partitionClients(rows).skips).toEqual([
      { count: 1, reason: "1 client has invoices or expenses — archive it instead" },
    ]);
  });
});

describe("summarise", () => {
  it("counts ids that never came back from the database as skipped", () => {
    const partition = { deletable: [{ id: "a" }], skips: [] };
    const result = summarise(partition, ["a", "b", "c"]);
    expect(result.deleted).toBe(1);
    expect(result.skipped).toBe(2);
    expect(result.reasons).toEqual([
      { count: 2, reason: "2 records could not be found" },
    ]);
  });

  it("merges rule-based skips with missing rows", () => {
    const partition = {
      deletable: [{ id: "a" }],
      skips: [{ count: 1, reason: "1 invoice has been sent — void it instead" }],
    };
    const result = summarise(partition, ["a", "b", "c"]);
    expect(result.deleted).toBe(1);
    expect(result.skipped).toBe(2);
    expect(result.reasons).toHaveLength(2);
  });

  it("uses singular wording for a single missing id", () => {
    const partition = { deletable: [{ id: "a" }], skips: [] };
    const result = summarise(partition, ["a", "b"]);
    expect(result.reasons).toEqual([{ count: 1, reason: "1 record could not be found" }]);
  });
});

describe("outstandingBalance", () => {
  it("is total minus what has been paid when there is no fee or credit", () => {
    expect(outstandingBalance({ total: 1000, amount_paid: 200 })).toBe(800);
  });

  it("adds the late fee to what is owed", () => {
    expect(
      outstandingBalance({ total: 1000, amount_paid: 0, late_fee_amount: 50 })
    ).toBe(1050);
  });

  it("subtracts credit already applied", () => {
    expect(
      outstandingBalance({ total: 1000, amount_paid: 0, credit_applied: 200 })
    ).toBe(800);
  });

  it("combines fee, payment and credit", () => {
    expect(
      outstandingBalance({
        total: 1000,
        amount_paid: 300,
        late_fee_amount: 50,
        credit_applied: 200,
      })
    ).toBe(550);
  });

  it("treats null and missing columns as zero", () => {
    expect(
      outstandingBalance({
        total: 100,
        amount_paid: 0,
        late_fee_amount: null,
        credit_applied: null,
      })
    ).toBe(100);
    expect(outstandingBalance({ total: 100, amount_paid: 0 })).toBe(100);
  });

  it("coerces the numeric strings Postgres can hand back", () => {
    // Without Number() the `+` would concatenate: "1000" + "50" === "100050".
    expect(
      outstandingBalance({
        total: "1000",
        amount_paid: "300",
        late_fee_amount: "50",
        credit_applied: "200",
      })
    ).toBe(550);
  });
});

describe("partitionMarkPaid", () => {
  it("accepts invoices that are awaiting payment", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "sent", total: 100, amount_paid: 0 },
      { id: "b", invoice_number: "INV-2", status: "overdue", total: 100, amount_paid: 0 },
      { id: "c", invoice_number: "INV-3", status: "partial", total: 100, amount_paid: 40 },
      { id: "d", invoice_number: "INV-4", status: "issued", total: 100, amount_paid: 0 },
    ];
    expect(partitionMarkPaid(rows).deletable.map((r) => r.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("skips drafts, which have not been issued to anyone", () => {
    const rows = [{ id: "a", invoice_number: "INV-1", status: "draft", total: 100, amount_paid: 0 }];
    expect(partitionMarkPaid(rows).skips).toEqual([
      { count: 1, reason: "1 invoice is still a draft — issue it first" },
    ]);
  });

  it("skips invoices that are already paid or voided", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "paid", total: 100, amount_paid: 100 },
      { id: "b", invoice_number: "INV-2", status: "void", total: 100, amount_paid: 0 },
    ];
    const result = partitionMarkPaid(rows);
    expect(result.deletable).toEqual([]);
    expect(result.skips).toEqual([
      { count: 2, reason: "2 invoices are already paid or voided" },
    ]);
  });

  it("skips an invoice with nothing left outstanding", () => {
    const rows = [{ id: "a", invoice_number: "INV-1", status: "sent", total: 100, amount_paid: 100 }];
    expect(partitionMarkPaid(rows).skips).toEqual([
      { count: 1, reason: "1 invoice has nothing outstanding" },
    ]);
  });

  it("uses plural wording for multiple drafts", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "draft", total: 100, amount_paid: 0 },
      { id: "b", invoice_number: "INV-2", status: "draft", total: 100, amount_paid: 0 },
    ];
    expect(partitionMarkPaid(rows).skips).toEqual([
      { count: 2, reason: "2 invoices are still drafts — issue them first" },
    ]);
  });

  it("uses singular wording for one settled invoice", () => {
    const rows = [{ id: "a", invoice_number: "INV-1", status: "paid", total: 100, amount_paid: 100 }];
    expect(partitionMarkPaid(rows).skips).toEqual([
      { count: 1, reason: "1 invoice is already paid or voided" },
    ]);
  });

  it("accepts an invoice whose only outstanding amount is a late fee", () => {
    const rows = [
      {
        id: "a",
        invoice_number: "INV-1",
        status: "overdue",
        total: 1000,
        amount_paid: 1000,
        late_fee_amount: 25,
        credit_applied: 0,
      },
    ];
    expect(partitionMarkPaid(rows).deletable.map((r) => r.id)).toEqual(["a"]);
  });

  it("accepts an invoice partly covered by a credit note", () => {
    const rows = [
      {
        id: "a",
        invoice_number: "INV-1",
        status: "sent",
        total: 1000,
        amount_paid: 0,
        late_fee_amount: 0,
        credit_applied: 200,
      },
    ];
    // £800 is still owed, so it is eligible — but only £800, not £1,000.
    expect(partitionMarkPaid(rows).deletable.map((r) => r.id)).toEqual(["a"]);
    expect(outstandingBalance(rows[0])).toBe(800);
  });

  it("skips an invoice fully covered by credit notes", () => {
    const rows = [
      {
        id: "a",
        invoice_number: "INV-1",
        status: "sent",
        total: 1000,
        amount_paid: 0,
        late_fee_amount: 0,
        credit_applied: 1000,
      },
    ];
    const result = partitionMarkPaid(rows);
    expect(result.deletable).toEqual([]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 invoice has nothing outstanding" },
    ]);
  });

  it("uses plural wording for multiple invoices with nothing outstanding", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "sent", total: 100, amount_paid: 100 },
      { id: "b", invoice_number: "INV-2", status: "issued", total: 50, amount_paid: 50 },
    ];
    expect(partitionMarkPaid(rows).skips).toEqual([
      { count: 2, reason: "2 invoices have nothing outstanding" },
    ]);
  });
});

describe("partitionRemind", () => {
  it("accepts active invoices whose client has an email address", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "overdue", clientEmail: "a@example.com" },
      { id: "b", invoice_number: "INV-2", status: "sent", clientEmail: "b@example.com" },
      { id: "c", invoice_number: "INV-3", status: "issued", clientEmail: "c@example.com" },
    ];
    expect(partitionRemind(rows).deletable).toHaveLength(3);
  });

  it("skips invoices that are not awaiting payment", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "draft", clientEmail: "a@example.com" },
      { id: "b", invoice_number: "INV-2", status: "paid", clientEmail: "b@example.com" },
    ];
    expect(partitionRemind(rows).skips).toEqual([
      { count: 2, reason: "2 invoices are not awaiting payment" },
    ]);
  });

  it("skips invoices whose client has no email address", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "sent", clientEmail: null },
      { id: "b", invoice_number: "INV-2", status: "sent", clientEmail: "b@example.com" },
    ];
    const result = partitionRemind(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["b"]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 invoice has a client with no email address" },
    ]);
  });

  it("uses singular wording for one invoice not awaiting payment", () => {
    const rows = [{ id: "a", invoice_number: "INV-1", status: "draft", clientEmail: "a@example.com" }];
    expect(partitionRemind(rows).skips).toEqual([
      { count: 1, reason: "1 invoice is not awaiting payment" },
    ]);
  });

  it("uses plural wording for multiple invoices with clients without email addresses", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "sent", clientEmail: null },
      { id: "b", invoice_number: "INV-2", status: "overdue", clientEmail: null },
    ];
    expect(partitionRemind(rows).skips).toEqual([
      { count: 2, reason: "2 invoices have clients with no email address" },
    ]);
  });
});
