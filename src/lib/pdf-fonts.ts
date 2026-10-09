import { Font } from "@react-pdf/renderer";

/**
 * Registers Geom for PDF rendering.
 *
 * The PDF renderer needs TTF/OTF — it cannot read the WOFF2 the website uses —
 * and resolves a URL rather than a bundled import, so the files are served from
 * /public/fonts. Only a regular weight was licensed, so headings use the same
 * file; `fontWeight: "bold"` would otherwise fall back to Helvetica mid-document
 * and mix two typefaces on one invoice.
 */
let registered = false;

export const PDF_FONT_FAMILY = "Geom";
/** Headings previously used "Helvetica-Bold"; with one weight this is the same face. */
export const PDF_FONT_FAMILY_BOLD = "Geom";

export function registerPdfFonts() {
  if (registered) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  try {
    Font.register({
      family: PDF_FONT_FAMILY,
      fonts: [
        { src: `${appUrl}/fonts/Geom-Regular.ttf`, fontWeight: 400 },
        { src: `${appUrl}/fonts/Geom-Regular.ttf`, fontWeight: 700 },
        { src: `${appUrl}/fonts/Geom-Italic.ttf`, fontWeight: 400, fontStyle: "italic" },
      ],
    });
    // Geom has no hyphenation dictionary; without this the renderer breaks words
    // mid-syllable in narrow table cells.
    Font.registerHyphenationCallback((word) => [word]);
    registered = true;
  } catch (error) {
    // A failed registration must not stop an invoice rendering — the templates
    // fall back to Helvetica, which is built in.
    console.error("[pdf] Geom registration failed, falling back to Helvetica", error);
  }
}
