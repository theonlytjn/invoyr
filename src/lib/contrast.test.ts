import { describe, expect, it } from "vitest";
import { accentOnLight, needsBorderOnWhite, parseHexColor, readableTextColor, relativeLuminance } from "./contrast";

describe("parseHexColor", () => {
  it("handles long and short form, with or without the hash", () => {
    expect(parseHexColor("#ffffff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor("fff")).toEqual({ r: 255, g: 255, b: 255 });
    expect(parseHexColor("#1d4ed8")).toEqual({ r: 29, g: 78, b: 216 });
  });

  it("rejects anything else", () => {
    expect(parseHexColor("rgb(0,0,0)")).toBeNull();
    expect(parseHexColor("#12345")).toBeNull();
    expect(parseHexColor("")).toBeNull();
    expect(parseHexColor(null)).toBeNull();
  });
});

describe("readableTextColor", () => {
  it("puts dark text on white and pale accents — the case that erased the header", () => {
    expect(readableTextColor("#ffffff")).toBe("#111827");
    expect(readableTextColor("#fef3c7")).toBe("#111827");
    expect(readableTextColor("#fde68a")).toBe("#111827");
  });

  it("keeps white text on the dark and mid brand colours", () => {
    expect(readableTextColor("#111827")).toBe("#ffffff");
    expect(readableTextColor("#1d4ed8")).toBe("#ffffff");
    expect(readableTextColor("#047857")).toBe("#ffffff");
    expect(readableTextColor("#be185d")).toBe("#ffffff");
  });

  it("falls back to white when the colour can't be read", () => {
    expect(readableTextColor(undefined)).toBe("#ffffff");
    expect(readableTextColor("not-a-colour")).toBe("#ffffff");
  });
});

describe("relativeLuminance", () => {
  it("anchors at black and white", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 5);
  });
});

describe("needsBorderOnWhite", () => {
  it("flags only near-white accents", () => {
    expect(needsBorderOnWhite("#ffffff")).toBe(true);
    expect(needsBorderOnWhite("#1d4ed8")).toBe(false);
  });
});

describe("accentOnLight", () => {
  it("keeps an accent that reads on white", () => {
    expect(accentOnLight("#1d4ed8")).toBe("#1d4ed8");
    expect(accentOnLight("#be185d")).toBe("#be185d");
  });

  it("falls back when the accent would vanish on white", () => {
    expect(accentOnLight("#ffffff")).toBe("#111827");
    expect(accentOnLight("#fef3c7")).toBe("#111827");
    expect(accentOnLight(null)).toBe("#111827");
  });
});
