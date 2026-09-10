import { describe, it, expect, vi, afterEach } from "vitest";
import { checkLimit } from "./rate-limit";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("checkLimit", () => {
  it("allows when no limiter is configured", async () => {
    expect(await checkLimit(null, "contact:1.2.3.4")).toEqual({ success: true });
  });

  it("passes the limiter's verdict through when it is reachable", async () => {
    const allow = { limit: async () => ({ success: true }) };
    const deny = { limit: async () => ({ success: false }) };

    expect(await checkLimit(allow, "k")).toEqual({ success: true });
    expect(await checkLimit(deny, "k")).toEqual({ success: false });
  });

  it("allows the request when the limiter throws", async () => {
    // The production failure: the Upstash host was deleted, so limit() rejected
    // with getaddrinfo ENOTFOUND. That error escaped the calling route as a 500
    // and took down PayPal, Stripe checkout and the contact form at once.
    vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = {
      limit: async () => {
        throw new Error("getaddrinfo ENOTFOUND noted-sponge-192389.upstash.io");
      },
    };

    expect(await checkLimit(broken, "pay-paypal:1.2.3.4")).toEqual({ success: true });
  });

  it("logs the outage rather than swallowing it", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = {
      limit: async () => {
        throw new Error("ENOTFOUND");
      },
    };

    await checkLimit(broken, "pay-paypal:1.2.3.4");

    expect(spy).toHaveBeenCalledWith(
      "[rate-limit] limiter unreachable — allowing request",
      expect.objectContaining({ key: "pay-paypal:1.2.3.4", error: "ENOTFOUND" })
    );
  });

  it("allows when the limiter rejects with a non-Error value", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = { limit: async () => Promise.reject("socket hang up") };

    expect(await checkLimit(broken, "k")).toEqual({ success: true });
  });
});
