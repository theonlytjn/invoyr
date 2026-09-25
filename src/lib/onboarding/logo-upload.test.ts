import { describe, expect, it } from "vitest";
import { LOGO_MAX_BYTES, logoStoragePath, validateLogoFile } from "./logo-upload";

const ORG_ID = "14665ba5-82b7-4dbb-8d90-36da721540cd";

describe("validateLogoFile", () => {
  it("accepts the image types the picker offers", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp", "image/svg+xml"]) {
      expect(validateLogoFile({ type, size: 1024 })).toBeNull();
    }
  });

  it("rejects a non-image", () => {
    expect(validateLogoFile({ type: "application/pdf", size: 1024 })).toMatch(/PNG, JPG/);
  });

  it("rejects anything over 2MB", () => {
    expect(validateLogoFile({ type: "image/png", size: LOGO_MAX_BYTES + 1 })).toMatch(/2MB/);
    expect(validateLogoFile({ type: "image/png", size: LOGO_MAX_BYTES })).toBeNull();
  });
});

describe("logoStoragePath", () => {
  it("puts the file under the org id, which is what the storage policy checks", () => {
    expect(logoStoragePath(ORG_ID, "image/png")).toBe(`${ORG_ID}/logo.png`);
    expect(logoStoragePath(ORG_ID, "image/jpeg")).toBe(`${ORG_ID}/logo.jpg`);
    expect(logoStoragePath(ORG_ID, "image/svg+xml")).toBe(`${ORG_ID}/logo.svg`);
  });

  it("falls back to png for an unexpected type", () => {
    expect(logoStoragePath(ORG_ID, "image/gif")).toBe(`${ORG_ID}/logo.png`);
  });
});
