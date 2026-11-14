/**
 * Email design tokens.
 *
 * Email clients ignore CSS variables and stylesheets, so emails can't read the
 * tokens in `src/app/globals.css` and need inline hex values. This file is the
 * one place those values live for email. Keep it in step with the brand palette
 * in globals.css (Oct 2026): navy #081026, lime #8CD600 and the navy-tinted
 * neutral ramp.
 */
export const EMAIL_COLORS = {
  /** Brand navy: headings, primary buttons */
  ink: "#081026",
  /** Body copy (--n-700) */
  body: "#1F2A44",
  /** Secondary and muted copy (--n-500) */
  muted: "#475569",
  /** Fine print, footer (--n-300) */
  subtle: "#94A3B8",
  /** Dividers and borders (--n-100) */
  border: "#E2E8F0",
  /** Page background behind the card (--surface-page) */
  page: "#FAFAFA",
  /** Tinted panels inside the card (--surface-elevated) */
  panel: "#F8FAFC",
  /** Card surface */
  surface: "#FFFFFF",
  /** Invoyr lime. Use as a fill or rule only, never as text on white (1.7:1). */
  brand: "#8CD600",
  /** Text that sits on a lime fill */
  onBrand: "#081026",
  /** Darkened lime that is readable as text on white */
  brandInk: "#5F9400",

  // Status colours
  success: "#16A34A",
  successBg: "#F0FDF4",
  successBorder: "#4ADE80",
  successText: "#166534",
  warning: "#D97706",
  warningBg: "#FFFBEB",
  warningBorder: "#FBBF24",
  warningText: "#92400E",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  dangerBorder: "#F87171",
  dangerText: "#991B1B",
  info: "#2563EB",
  infoBg: "#EFF6FF",
  infoBorder: "#93C5FD",
  infoText: "#1E40AF",
} as const;

export const EMAIL_FONT_STACK =
  '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
