/**
 * Readable text colour for a brand accent background.
 *
 * Orgs can pick any accent, including white or a pale pastel. The pay page
 * header paints that colour behind white text, so a light accent erased the
 * business name and invoice number entirely.
 */

/** #rgb or #rrggbb → {r,g,b} (0-255), or null when unparseable. */
export function parseHexColor(hex: string | null | undefined): { r: number; g: number; b: number } | null {
  if (!hex) return null;
  const value = hex.trim().replace(/^#/, "");

  const full =
    value.length === 3
      ? value.split("").map((c) => c + c).join("")
      : value;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null;

  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Relative luminance per WCAG 2.1, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string | null | undefined): number | null {
  const rgb = parseHexColor(hex);
  if (!rgb) return null;

  const channel = (value: number) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/**
 * Near-black or white, whichever reads better on `hex`.
 *
 * The 0.45 threshold sits a little above the 0.179 point where the two have
 * equal contrast: mid-tones get dark text, which is the safer failure for a
 * brand colour that is lighter than it looks on screen. Unparseable colours
 * fall back to white, matching the near-black default accent.
 */
export function readableTextColor(hex: string | null | undefined): "#111827" | "#ffffff" {
  const luminance = relativeLuminance(hex);
  if (luminance === null) return "#ffffff";
  return luminance > 0.45 ? "#111827" : "#ffffff";
}

/** True when the accent is so pale it needs a border to be visible on white. */
export function needsBorderOnWhite(hex: string | null | undefined): boolean {
  const luminance = relativeLuminance(hex);
  return luminance !== null && luminance > 0.85;
}

/**
 * The accent, safe to use as text on a light background.
 *
 * Accents are also used the other way round — coloured text on white — where a
 * pale brand colour disappears instead of erasing what is behind it. Anything
 * too light falls back to the default near-black.
 */
export function accentOnLight(hex: string | null | undefined): string {
  const luminance = relativeLuminance(hex);
  if (luminance === null || luminance > 0.6) return "#111827";
  return hex!.trim();
}
