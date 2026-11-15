import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/resend/send-transactional-email", () => ({ sendTransactionalEmail: vi.fn() }));

const { formatAutomationAmount, interpolate } = await import("./execute");

describe("formatAutomationAmount", () => {
  it("formats as currency", () => {
    expect(formatAutomationAmount(2400, "GBP")).toBe("£2,400.00");
    expect(formatAutomationAmount(19.5, "EUR")).toBe("€19.50");
  });
  it("defaults to GBP and survives unknown codes", () => {
    expect(formatAutomationAmount(10, undefined)).toBe("£10.00");
    expect(formatAutomationAmount(10, "NOPE1")).toBe("NOPE1 10.00");
    expect(formatAutomationAmount(undefined, "GBP")).toBe("");
  });
});

describe("interpolate", () => {
  it("fills recipient_name with the given recipient, and amounts nicely", () => {
    const out = interpolate(
      "Hi {{recipient_name}}, {{client_name}} paid {{amount}} for {{invoice_number}} to {{org_name}}",
      { client_name: "Sarah", amount: 2400, currency: "GBP", invoice_number: "INV-1" },
      "Acme",
      "Tony",
    );
    expect(out).toBe("Hi Tony, Sarah paid £2,400.00 for INV-1 to Acme");
  });
  it("defaults recipient to the client", () => {
    expect(interpolate("Hi {{recipient_name}}", { client_name: "Sarah" }, "Acme")).toBe("Hi Sarah");
  });
});
