import { describe, expect, it } from "vitest";
import { companyLegalLine } from "./legal-line";

describe("companyLegalLine", () => {
  it("is null when neither detail is entered", () => {
    expect(companyLegalLine({ company_number: null, registered_address: null })).toBeNull();
    expect(companyLegalLine({ company_number: "  ", registered_address: "\n" })).toBeNull();
  });

  it("shows whichever detail is entered", () => {
    expect(companyLegalLine({ company_number: "17502051", registered_address: null })).toBe("Company no. 17502051");
    expect(companyLegalLine({ company_number: null, registered_address: "1 High St" })).toBe("Registered office: 1 High St");
  });

  it("flattens a multi-line address onto one line", () => {
    expect(
      companyLegalLine({ company_number: "17502051", registered_address: "128 City Road,\nLondon\n\nEC1V 2NX" })
    ).toBe("Company no. 17502051 · Registered office: 128 City Road, London, EC1V 2NX");
  });

  it("falls back to the legacy company_registration_number", () => {
    expect(
      companyLegalLine({ company_number: null, company_registration_number: "52215672", registered_address: null })
    ).toBe("Company no. 52215672");
  });
});
