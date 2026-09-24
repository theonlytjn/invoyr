import { describe, expect, it } from "vitest";
import { buildOrgRow, buildOrgSlug, orgCreateSchema } from "./org-input";

const ORG_ID = "14665ba5-82b7-4dbb-8d90-36da721540cd";

describe("orgCreateSchema", () => {
  it("accepts a name on its own", () => {
    expect(orgCreateSchema.parse({ name: "Tony The Rapper" }).name).toBe("Tony The Rapper");
  });

  it("rejects an empty name", () => {
    expect(orgCreateSchema.safeParse({ name: "   " }).success).toBe(false);
  });

  it("allows the empty strings the wizard sends for untouched fields", () => {
    const parsed = orgCreateSchema.safeParse({ name: "Acme", email: "", logoUrl: "" });
    expect(parsed.success).toBe(true);
  });

  it("drops a malformed logo URL instead of blocking onboarding", () => {
    const parsed = orgCreateSchema.parse({ name: "Acme", logoUrl: "logo.png" });
    expect(parsed.logoUrl).toBeUndefined();
    expect(orgCreateSchema.parse({ name: "Acme", logoUrl: "https://cdn.acme.com/logo.png" }).logoUrl).toBe(
      "https://cdn.acme.com/logo.png"
    );
  });

  it("rejects a malformed email or accent colour", () => {
    expect(orgCreateSchema.safeParse({ name: "Acme", email: "nope" }).success).toBe(false);
    expect(orgCreateSchema.safeParse({ name: "Acme", accentColor: "red" }).success).toBe(false);
  });
});

describe("buildOrgSlug", () => {
  it("suffixes the id so two businesses can share a name", () => {
    expect(buildOrgSlug({ name: "Tony The Rapper" }, ORG_ID)).toBe("tony-the-rapper-14665b");
  });

  it("falls back when the name slugifies to nothing", () => {
    expect(buildOrgSlug({ name: "!!!" }, ORG_ID)).toBe("org-14665b");
  });
});

describe("buildOrgRow", () => {
  it("turns blank optional fields into nulls and keeps the defaults", () => {
    const row = buildOrgRow({ name: "Acme", email: "", city: "  " }, ORG_ID);
    expect(row).toMatchObject({
      id: ORG_ID,
      name: "Acme",
      email: null,
      city: null,
      country: "GB",
      accent_color: "#111827",
    });
  });

  it("carries the collected details onto the right columns", () => {
    const row = buildOrgRow(
      { name: "Acme", email: "hi@acme.com", address: "123 Main St", postcode: "EC1A 1BB", country: "IE", accentColor: "#2563eb" },
      ORG_ID
    );
    expect(row).toMatchObject({
      email: "hi@acme.com",
      address_line1: "123 Main St",
      postcode: "EC1A 1BB",
      country: "IE",
      accent_color: "#2563eb",
    });
  });
});
