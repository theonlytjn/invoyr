import { Font } from "@react-pdf/renderer";

/**
 * Registers Satoshi for PDF rendering.
 *
 * Invoices use the site's BODY face, not its heading face: Geom is a display
 * font and looked heavy-handed across a dense invoice table. Satoshi has real
 * weights (400/500/700), so headings are genuinely bold rather than synthesised.
 *
 * The renderer needs TTF — it cannot read WOFF2 — and resolves fonts by URL, so
 * the files are served from /public/fonts rather than imported.
 */
let registered = false;

export const PDF_FONT_FAMILY = "Satoshi";

export function registerPdfFonts() {
  if (registered) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  try {
    Font.register({
      family: PDF_FONT_FAMILY,
      fonts: [
        { src: `${appUrl}/fonts/Satoshi-400.ttf`, fontWeight: 400 },
        { src: `${appUrl}/fonts/Satoshi-500.ttf`, fontWeight: 500 },
        { src: `${appUrl}/fonts/Satoshi-700.ttf`, fontWeight: 700 },
        // There is no Satoshi italic file, and react-pdf throws rather than
        // falling back when a style is missing — which failed every Modern
        // Studio invoice with notes. Italic text renders upright instead.
        { src: `${appUrl}/fonts/Satoshi-400.ttf`, fontWeight: 400, fontStyle: "italic" },
        { src: `${appUrl}/fonts/Satoshi-500.ttf`, fontWeight: 500, fontStyle: "italic" },
        { src: `${appUrl}/fonts/Satoshi-700.ttf`, fontWeight: 700, fontStyle: "italic" },
      ],
    });
    // No hyphenation dictionary for Satoshi; without this the renderer breaks
    // words mid-syllable inside narrow table cells.
    Font.registerHyphenationCallback((word) => [word]);
    registered = true;
  } catch (error) {
    // A failed registration must not stop an invoice rendering — the templates
    // fall back to Helvetica, which is built in.
    console.error("[pdf] Satoshi registration failed, falling back to Helvetica", error);
  }
}
