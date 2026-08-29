import { describe, it, expect } from "vitest";
import {
  partitionInvoices,
  partitionEstimates,
  partitionExpenses,
  partitionClients,
  summarise,
} from "./bulk-actions";

describe("partitionInvoices", () => {
  it("deletes drafts and voided invoices", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "draft", hasFinancialRecords: false },
      { id: "b", invoice_number: "INV-2", status: "void", hasFinancialRecords: false },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result.skips).toEqual([]);
  });

  it("skips issued, sent and paid invoices with a void-instead reason", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "draft", hasFinancialRecords: false },
      { id: "b", invoice_number: "INV-2", status: "issued", hasFinancialRecords: false },
      { id: "c", invoice_number: "INV-3", status: "sent", hasFinancialRecords: false },
      { id: "d", invoice_number: "INV-4", status: "paid", hasFinancialRecords: false },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["a"]);
    expect(result.skips).toEqual([
      { count: 3, reason: "3 invoices have been sent — void them instead" },
    ]);
  });

  it("skips a voided invoice that still has payments or credit notes attached", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "void", hasFinancialRecords: true },
      { id: "b", invoice_number: "INV-2", status: "draft", hasFinancialRecords: false },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable.map((r) => r.id)).toEqual(["b"]);
    expect(result.skips).toEqual([
      { count: 1, reason: "1 invoice has payments or credit notes attached" },
    ]);
  });

  it("reports both skip reasons separately", () => {
    const rows = [
      { id: "a", invoice_number: "INV-1", status: "sent", hasFinancialRecords: false },
      { id: "b", invoice_number: "INV-2", status: "void", hasFinancialRecords: true },
    ];
    const result = partitionInvoices(rows);
    expect(result.deletable).toEqual([]);
    expect(result.skips).toHaveLength(2);
  });

  it("uses singular wording for one skipped invoice", () => {
    const rows = [{ id: "a", invoice_number: "INV-1", status: "sent", hasFinancialRecords: false }];
    expect(partitionInvoices(rows).skips).toEqual([
      { count: 1, reason: "1 invoice has been sent — void it instead" },
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
});
