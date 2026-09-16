/** Matches the invoices_discount_reason_length check constraint in schema.sql. */
export const DISCOUNT_REASON_MAX_LENGTH = 200;

export interface LineItemInput {
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
}

export interface InvoiceTotals {
  subtotal: number;
  vat_amount: number;
  discount: number;
  total: number;
}

export function computeTotals(items: LineItemInput[], discount = 0): InvoiceTotals {
  let subtotal = 0;
  let vat_amount = 0;

  for (const item of items) {
    const lineTotal = item.quantity * item.unit_price;
    subtotal += lineTotal;
    vat_amount += lineTotal * (item.vat_rate / 100);
  }

  subtotal = Math.round(subtotal * 100) / 100;
  vat_amount = Math.round(vat_amount * 100) / 100;
  const discountAmt = Math.round(Math.min(discount, subtotal + vat_amount) * 100) / 100;
  const total = Math.round((subtotal + vat_amount - discountAmt) * 100) / 100;

  return { subtotal, vat_amount, discount: discountAmt, total };
}

/**
 * The money props for InvoiceSentEmail. `invoiceTotal` is what the client owes,
 * so it must include the discount — the send routes once recomputed it from the
 * line items alone and emailed the pre-discount figure.
 */
export function invoiceEmailAmounts(
  items: Pick<LineItemInput, "quantity" | "unit_price" | "vat_rate">[],
  invoice: { discount?: number | null; discount_reason?: string | null; currency: string },
  format: (amount: number, currency: string) => string
): { invoiceTotal: string; totalBeforeDiscount?: string; discount?: string; discountReason?: string | null } {
  const totals = computeTotals(
    items.map((i) => ({ description: "", quantity: i.quantity, unit_price: i.unit_price, vat_rate: i.vat_rate })),
    invoice.discount ?? 0
  );
  const invoiceTotal = format(totals.total, invoice.currency);
  if (totals.discount <= 0) return { invoiceTotal };
  return {
    invoiceTotal,
    totalBeforeDiscount: format(totals.subtotal + totals.vat_amount, invoice.currency),
    discount: format(totals.discount, invoice.currency),
    discountReason: invoice.discount_reason ?? null,
  };
}

/** The label for a discount line, e.g. "Discount (50% loyalty discount)". */
export function discountLabel(reason?: string | null): string {
  const trimmed = reason?.trim();
  return trimmed ? `Discount (${trimmed})` : "Discount";
}
