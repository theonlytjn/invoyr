import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/shell/ThemeProvider";
import { PwaRegistration } from "@/components/shell/PwaRegistration";

/**
 * Geom, self-hosted. Licensed via Envato, which covers web embedding — hosting
 * it ourselves also keeps visitor IPs away from a third-party font CDN.
 *
 * Only Regular and Italic were supplied, so `font-bold` on a heading is
 * synthesised by the browser rather than a real bold cut.
 */
const geom = localFont({
  src: [
    { path: "./fonts/Geom-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Geom-Regular.woff", weight: "400", style: "normal" },
    { path: "./fonts/Geom-Italic.woff2", weight: "400", style: "italic" },
    { path: "./fonts/Geom-Italic.woff", weight: "400", style: "italic" },
  ],
  variable: "--font-geom",
  display: "swap",
  // Arial is the email fallback too, so a missing font looks the same everywhere.
  fallback: ["Avenir Next", "Arial", "Helvetica", "sans-serif"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://invoyr.io"),
  title: {
    default: "Invoyr — Invoicing for service businesses",
    template: "%s | Invoyr",
  },
  description:
    "Professional invoicing platform for freelancers, agencies, and service businesses. Create, send, and get paid faster.",
  openGraph: {
    type: "website",
    siteName: "Invoyr",
    url: "https://invoyr.io",
    title: "Invoyr — Get paid faster",
    description:
      "Send professional invoices, take card payments with Stripe, and let reminders chase for you. Invoicing for freelancers, agencies and service businesses.",
    images: [{ url: "/social.png", width: 1200, height: 630, alt: "Invoyr — Get paid faster" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Invoyr — Get paid faster",
    description:
      "Send professional invoices, take card payments with Stripe, and let reminders chase for you. Invoicing for freelancers, agencies and service businesses.",
    images: ["/social.png"],
  },
  appleWebApp: {
    capable: true,
    title: "Invoyr",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  // maximumScale/userScalable deliberately NOT set: locking zoom fails WCAG
  // 1.4.4 and stops low-vision users enlarging anything on a phone.
  // Without this, env(safe-area-inset-*) resolves to 0 and the fixed bottom bar
  // sits under the iPhone home indicator.
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geom.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400&display=swap" rel="stylesheet" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://cdn.hugeicons.com/font/hgi-stroke-rounded.css" rel="stylesheet" />
      </head>
      <body className="min-h-full">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <PwaRegistration />
        </ThemeProvider>
      </body>
    </html>
  );
}
