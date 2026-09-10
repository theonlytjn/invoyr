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

  it("falls back to sandbox for anything it does not recognise", () => {
    expect(resolvePayPalBaseUrl("prod")).toBe(PAYPAL_SANDBOX_API);
    expect(resolvePayPalBaseUrl("true")).toBe(PAYPAL_SANDBOX_API);
  });
});
