const _appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

export const BRAND = {
  name: "Invoyr",
  displayName: "invoyr",
  url: "https://invoyr.io",
  appUrl: _appUrl,
  supportEmail: "support@invoyr.io",
  accentColor: "#111827",
  /** Absolute URL to the Invoyr wordmark (SVG, works in Gmail/Apple Mail/Outlook.com) */
  logoUrl: `${_appUrl}/main-logo.svg`,
  faviconUrl: `${_appUrl}/favicon.png`,
};
