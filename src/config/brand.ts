export const BRAND = {
  name: "invoyr",
  url: "https://invoyr.io",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io",
  supportEmail: "support@invoyr.io",
  defaultAccentColor: "#111827",
  logoUrl: null as string | null,
} as const;
