import { describe, expect, it } from "vitest";
import { isSubscriptionActive, trialDaysRemaining } from "./billing";

const inDays = (days: number) => new Date(Date.now() + days * 86400000).toISOString();

describe("isSubscriptionActive", () => {
  it("keeps an active subscription active regardless of any trial date", () => {
    expect(isSubscriptionActive("active", inDays(-30))).toBe(true);
  });

  it("honours a trial that is still running", () => {
    expect(isSubscriptionActive("trialing", inDays(3))).toBe(true);
  });

  it("ends a trial once its date has passed", () => {
    // The self-serve trial row written at signup is never moved off `trialing`
    // by anything external, so the date is the only thing that ends it.
    expect(isSubscriptionActive("trialing", inDays(-1))).toBe(false);
  });

  it("treats a trial with no end date as running (Stripe-managed)", () => {
    expect(isSubscriptionActive("trialing", null)).toBe(true);
  });

  it("rejects the inactive statuses", () => {
    expect(isSubscriptionActive("canceled", inDays(3))).toBe(false);
    expect(isSubscriptionActive("past_due")).toBe(false);
    expect(isSubscriptionActive(null)).toBe(false);
  });
});

describe("trialDaysRemaining", () => {
  it("rounds up the days left", () => {
    expect(trialDaysRemaining("trialing", inDays(6.2))).toBe(7);
    expect(trialDaysRemaining("trialing", inDays(0.1))).toBe(1);
  });

  it("is zero once expired and null when there is no trial", () => {
    expect(trialDaysRemaining("trialing", inDays(-1))).toBe(0);
    expect(trialDaysRemaining("active", inDays(3))).toBeNull();
    expect(trialDaysRemaining("trialing", null)).toBeNull();
  });
});
