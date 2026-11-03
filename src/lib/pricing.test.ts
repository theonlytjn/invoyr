import { describe, expect, it } from "vitest";
import { PLAN_MAP, formatPounds, getPlanByPriceId, getPriceId, yearlyPerMonth, yearlySaving } from "@/config/plans";
import { parseSignupIntent, signupIntentFromSearch } from "@/lib/onboarding/signup-intent";

describe("pricing", () => {
  // The figures from the pricing toggle spec.
  it.each([
    ["starter", "£8", "£79", "£6.58", "£17"],
    ["business", "£15", "£149", "£12.42", "£31"],
    ["pro", "£25", "£249", "£20.75", "£51"],
  ] as const)("%s shows the agreed prices", (id, monthly, yearly, perMonth, saving) => {
    const plan = PLAN_MAP[id];
    expect(formatPounds(plan.amounts.monthly)).toBe(monthly);
    expect(formatPounds(plan.amounts.yearly)).toBe(yearly);
    expect(formatPounds(yearlyPerMonth(plan))).toBe(perMonth);
    expect(formatPounds(yearlySaving(plan))).toBe(saving);
  });

  it("maps both periods' price IDs back to the plan", () => {
    process.env.STRIPE_PRICE_ID_BUSINESS = "price_biz_year";
    process.env.STRIPE_PRICE_ID_BUSINESS_MONTHLY = "price_biz_month";
    expect(getPriceId("business", "yearly")).toBe("price_biz_year");
    expect(getPriceId("business", "monthly")).toBe("price_biz_month");
    expect(getPlanByPriceId("price_biz_month")).toBe("business");
    expect(getPlanByPriceId("price_biz_year")).toBe("business");
    expect(getPlanByPriceId("")).toBeNull();
  });
});

describe("signup intent", () => {
  it("keeps only valid values from the link", () => {
    expect(signupIntentFromSearch("?plan=pro&billing=monthly&code=founding")).toEqual({
      plan: "pro",
      billing: "monthly",
      code: "FOUNDING",
    });
    expect(signupIntentFromSearch("?plan=gold&billing=weekly&code=<x>")).toEqual({});
  });

  it("survives a garbled cookie", () => {
    expect(parseSignupIntent("not json")).toEqual({});
    expect(parseSignupIntent(encodeURIComponent(JSON.stringify({ plan: "starter" })))).toEqual({ plan: "starter" });
  });
});
