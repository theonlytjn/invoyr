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
