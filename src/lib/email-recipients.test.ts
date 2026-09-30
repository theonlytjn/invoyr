import { describe, expect, it } from "vitest";
import {
  ccRecipients,
  parseRecipientList,
  validateRecipientList,
} from "./email-recipients";

describe("parseRecipientList", () => {
  it("splits on commas, semicolons and newlines, trimming as it goes", () => {
    expect(parseRecipientList("a@x.com, b@x.com; c@x.com\nd@x.com")).toEqual([
      "a@x.com",
      "b@x.com",
      "c@x.com",
      "d@x.com",
    ]);
  });

  it("drops blanks and case-insensitive duplicates", () => {
    expect(parseRecipientList("a@x.com, , A@X.com,")).toEqual(["a@x.com"]);
  });
});

describe("validateRecipientList", () => {
  it("names the offending address", () => {
    expect(validateRecipientList(["a@x.com", "nope"])).toContain('"nope"');
  });

  it("caps the list", () => {
    const many = ["a", "b", "c", "d", "e", "f"].map((l) => `${l}@x.com`);
    expect(validateRecipientList(many)).toMatch(/at most 5/);
  });

  it("passes a good list", () => {
    expect(validateRecipientList(["a@x.com", "b@x.com"])).toBeNull();
  });
});

describe("ccRecipients", () => {
  it("never copies the primary recipient, whatever the casing", () => {
    expect(ccRecipients("tom@x.com", ["TOM@x.com", "accounts@x.com"])).toEqual(["accounts@x.com"]);
  });

  it("drops invalid entries rather than failing the send", () => {
    // The invoice going out matters more than a typo in a CC field.
    expect(ccRecipients("tom@x.com", ["broken", "accounts@x.com"])).toEqual(["accounts@x.com"]);
  });

  it("returns nothing when there is no list", () => {
    expect(ccRecipients("tom@x.com", null)).toEqual([]);
    expect(ccRecipients("tom@x.com", [])).toEqual([]);
  });
});
