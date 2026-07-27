import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/shell/ThemeProvider";
import { PwaRegistration } from "@/components/shell/PwaRegistration";

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
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
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${geistMono.variable} h-full antialiased`}
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
