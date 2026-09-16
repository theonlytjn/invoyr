import { describe, expect, it } from "vitest";
import { discountLabel, invoiceEmailAmounts } from "./invoice-totals";

const gbp = (amount: number, currency: string) => `${currency} ${amount.toFixed(2)}`;

describe("invoiceEmailAmounts", () => {
  const items = [{ quantity: 1, unit_price: 675, vat_rate: 0 }];

  it("emails the discounted total, not the line-item sum", () => {
    // INV-0012: £675 of work with a £337.50 discount was emailed as £675.
    const amounts = invoiceEmailAmounts(
      items,
      { discount: 337.5, discount_reason: "50% goodwill discount", currency: "GBP" },
      gbp
    );
    expect(amounts).toEqual({
      invoiceTotal: "GBP 337.50",
      totalBeforeDiscount: "GBP 675.00",
      discount: "GBP 337.50",
      discountReason: "50% goodwill discount",
    });
  });

  it("includes VAT in the amount before discount so the rows add up", () => {
    const amounts = invoiceEmailAmounts(
      [{ quantity: 1, unit_price: 100, vat_rate: 20 }],
      { discount: 20, currency: "GBP" },
      gbp
    );
    expect(amounts.totalBeforeDiscount).toBe("GBP 120.00");
    expect(amounts.invoiceTotal).toBe("GBP 100.00");
    expect(amounts.discountReason).toBeNull();
  });

  it("omits the discount rows when there is no discount", () => {
    expect(invoiceEmailAmounts(items, { discount: 0, discount_reason: "stale", currency: "GBP" }, gbp)).toEqual({
      invoiceTotal: "GBP 675.00",
    });
  });
});

describe("discountLabel", () => {
  it("appends a trimmed reason", () => {
    expect(discountLabel("  Loyalty  ")).toBe("Discount (Loyalty)");
  });

  it("falls back to a bare label", () => {
    expect(discountLabel(null)).toBe("Discount");
    expect(discountLabel("   ")).toBe("Discount");
  });
});
