import { describe, expect, it } from "vitest";
import { addPeriods, dueDateFor, firstRunOnOrAfter, nextRunAfter } from "./schedule";

describe("addPeriods", () => {
  it("adds weeks", () => {
    expect(addPeriods("2026-12-28", "weekly", 1)).toBe("2027-01-04");
  });

  it("clamps month ends without drifting", () => {
    expect(addPeriods("2026-01-31", "monthly", 1)).toBe("2026-02-28");
    expect(addPeriods("2026-01-31", "monthly", 2)).toBe("2026-03-31");
    expect(addPeriods("2026-01-31", "monthly", 3)).toBe("2026-04-30");
  });

  it("handles quarters and leap years", () => {
    expect(addPeriods("2026-11-30", "quarterly", 1)).toBe("2027-02-28");
    expect(addPeriods("2028-02-29", "yearly", 1)).toBe("2029-02-28");
    expect(addPeriods("2028-02-29", "yearly", 4)).toBe("2032-02-29");
  });
});

describe("nextRunAfter", () => {
  it("is the start date when that's still ahead", () => {
    expect(nextRunAfter("2026-12-01", "monthly", "2026-11-16")).toBe("2026-12-01");
  });

  it("is the next period after a run", () => {
    expect(nextRunAfter("2026-12-01", "monthly", "2026-12-01")).toBe("2027-01-01");
    expect(nextRunAfter("2026-01-31", "monthly", "2026-02-28")).toBe("2026-03-31");
    expect(nextRunAfter("2026-11-02", "weekly", "2026-11-16")).toBe("2026-11-23");
  });

  it("works for schedules started long ago", () => {
    expect(nextRunAfter("2020-03-15", "monthly", "2026-11-16")).toBe("2026-12-15");
    expect(nextRunAfter("2020-03-15", "yearly", "2026-11-16")).toBe("2027-03-15");
  });
});

describe("dueDateFor", () => {
  it("adds the payment terms", () => {
    expect(dueDateFor("2026-12-20", 14)).toBe("2027-01-03");
    expect(dueDateFor("2026-12-20", 0)).toBe("2026-12-20");
  });
});

describe("firstRunOnOrAfter", () => {
  it("keeps a future or same-day start", () => {
    expect(firstRunOnOrAfter("2026-12-01", "monthly", "2026-11-16")).toBe("2026-12-01");
    expect(firstRunOnOrAfter("2026-11-16", "monthly", "2026-11-16")).toBe("2026-11-16");
  });

  it("doesn't back-fill a past start", () => {
    expect(firstRunOnOrAfter("2026-06-16", "monthly", "2026-11-16")).toBe("2026-11-16");
    expect(firstRunOnOrAfter("2026-06-10", "monthly", "2026-11-16")).toBe("2026-12-10");
  });
});
