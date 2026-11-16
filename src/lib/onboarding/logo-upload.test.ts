import { describe, expect, it } from "vitest";
import { LOGO_MAX_BYTES, logoStoragePath, sniffLogoType, validateLogoFile } from "./logo-upload";

const ORG_ID = "14665ba5-82b7-4dbb-8d90-36da721540cd";

describe("validateLogoFile", () => {
  it("accepts the image types the picker offers", () => {
    for (const type of ["image/png", "image/jpeg", "image/webp"]) {
      expect(validateLogoFile({ type, size: 1024 })).toBeNull();
    }
  });

  it("rejects SVG", () => {
    expect(validateLogoFile({ type: "image/svg+xml", size: 1024 })).toMatch(/PNG, JPG or WebP/);
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
  });

  it("falls back to png for an unexpected type", () => {
    expect(logoStoragePath(ORG_ID, "image/gif")).toBe(`${ORG_ID}/logo.png`);
  });
});

describe("sniffLogoType", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);

  it("recognises PNG, JPEG and WebP by their signatures", () => {
    expect(sniffLogoType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png");
    expect(sniffLogoType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
    expect(
      sniffLogoType(bytes(0x52, 0x49, 0x46, 0x46, 1, 2, 3, 4, 0x57, 0x45, 0x42, 0x50))
    ).toBe("image/webp");
  });

  it("rejects an SVG renamed to .png", () => {
    expect(sniffLogoType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull();
  });
});
