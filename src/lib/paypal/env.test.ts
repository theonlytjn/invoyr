import { describe, it, expect } from "vitest";
import { resolvePayPalBaseUrl, PAYPAL_LIVE_API, PAYPAL_SANDBOX_API } from "./client";

describe("resolvePayPalBaseUrl", () => {
  it("routes production to the live API", () => {
    expect(resolvePayPalBaseUrl("production")).toBe(PAYPAL_LIVE_API);
  });

  it('accepts "live", the word PayPal itself uses for the environment', () => {
    // PAYPAL_ENV=live previously fell through to sandbox, so real credentials were
    // rejected as invalid_client — identical to the error for a wrong secret.
    expect(resolvePayPalBaseUrl("live")).toBe(PAYPAL_LIVE_API);
  });

  it("ignores casing", () => {
    expect(resolvePayPalBaseUrl("Production")).toBe(PAYPAL_LIVE_API);
    expect(resolvePayPalBaseUrl("LIVE")).toBe(PAYPAL_LIVE_API);
  });

  it("ignores whitespace pasted in from a dashboard", () => {
    expect(resolvePayPalBaseUrl("  production  ")).toBe(PAYPAL_LIVE_API);
    expect(resolvePayPalBaseUrl("\nlive")).toBe(PAYPAL_LIVE_API);
  });

  it("defaults to sandbox when unset, so a missing variable cannot move real money", () => {
    expect(resolvePayPalBaseUrl(undefined)).toBe(PAYPAL_SANDBOX_API);
    expect(resolvePayPalBaseUrl("")).toBe(PAYPAL_SANDBOX_API);
  });

  it("treats an explicit sandbox value as sandbox", () => {
    expect(resolvePayPalBaseUrl("sandbox")).toBe(PAYPAL_SANDBOX_API);
  });

  it("accepts the live API hostname, which is what production actually held", () => {
    // PAYPAL_ENV="api-m.paypal.com" resolved to sandbox, so live credentials were
    // rejected as invalid_client and the fault looked like a bad secret.
    expect(resolvePayPalBaseUrl("api-m.paypal.com")).toBe(PAYPAL_LIVE_API);
    expect(resolvePayPalBaseUrl("https://api-m.paypal.com")).toBe(PAYPAL_LIVE_API);
    expect(resolvePayPalBaseUrl("https://api-m.paypal.com/")).toBe(PAYPAL_LIVE_API);
  });

  it("keeps the sandbox hostname on sandbox rather than matching a live rule", () => {
    // The dangerous direction: a substring match on "paypal.com" would send these
    // to the live API and take real money in a test.
    expect(resolvePayPalBaseUrl("api-m.sandbox.paypal.com")).toBe(PAYPAL_SANDBOX_API);
    expect(resolvePayPalBaseUrl("https://api-m.sandbox.paypal.com")).toBe(PAYPAL_SANDBOX_API);
    expect(resolvePayPalBaseUrl("sandbox.paypal.com")).toBe(PAYPAL_SANDBOX_API);
  });

  it("accepts the bare live domain", () => {
    expect(resolvePayPalBaseUrl("paypal.com")).toBe(PAYPAL_LIVE_API);
    expect(resolvePayPalBaseUrl("www.paypal.com")).toBe(PAYPAL_LIVE_API);
  });

  it("falls back to sandbox for anything it does not recognise", () => {
    expect(resolvePayPalBaseUrl("prod")).toBe(PAYPAL_SANDBOX_API);
    expect(resolvePayPalBaseUrl("true")).toBe(PAYPAL_SANDBOX_API);
  });
});
