const _appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

export const BRAND = {
  name: "Invoyr",
  displayName: "invoyr",
  url: "https://invoyr.io",
  appUrl: _appUrl,
  supportEmail: "support@invoyr.io",
  /** Brand navy (--n-950). Default accent for Invoyr's own emails. */
  accentColor: "#081026",
  /** Invoyr lime (--brand). */
  limeColor: "#8CD600",
  /** Full-colour wordmark (SVG) for the web. */
  logoUrl: `${_appUrl}/brand/invoyr-logo.svg`,
  /**
   * PNG wordmarks for email. Gmail, Outlook and Yahoo block SVG images, so
   * emails must use these PNGs (rendered at 3x the 32px display height).
   */
  emailLogoUrl: `${_appUrl}/brand/invoyr-logo-email.png`,
  emailLogoWhiteUrl: `${_appUrl}/brand/invoyr-logo-email-white.png`,
  /**
   * Header banner for Invoyr's own emails: wordmark and tagline on a hero
   * photo. Rebuild with scripts/build-email-banner.sh. 1120x320 (2x).
   */
  emailBannerUrl: `${_appUrl}/brand/invoyr-email-banner.jpg`,
  emailBannerAlt: "Invoyr: Get paid faster. Invoicing that runs itself.",
  /** Intrinsic aspect ratio of the wordmark (width / height). */
  logoAspectRatio: 703.58 / 236.45,
  faviconUrl: `${_appUrl}/favicon.png?v=2`,
};
