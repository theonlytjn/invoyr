import type { NextConfig } from "next";

// Baseline security headers applied to every response. Deliberately excludes a
// Content-Security-Policy for now: the pay page loads the PayPal SDK and the
// marketing layout uses an inline no-flash theme script, so a CSP needs a
// nonce-based rollout (tested in report-only mode) rather than a blanket policy
// that would silently break payments. Tracked as a follow-up.
const securityHeaders = [
  // Force HTTPS for two years, including subdomains (Vercel serves HTTPS only).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Clickjacking protection — the app is never meant to be framed.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Don't let browsers MIME-sniff responses into a different content type.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Send only the origin on cross-origin navigations; full URL same-origin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Lock down powerful features the app doesn't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  // Partial CSP: the directives that are safe without a script-src nonce.
  // Blocks <base>/<object>/<embed> injection and clickjacking. A full
  // script-src/connect-src policy needs a nonce-based rollout (follow-up).
  { key: "Content-Security-Policy", value: "base-uri 'self'; object-src 'none'; frame-ancestors 'self'" },
];

const nextConfig: NextConfig = {
  headers: async () => [
    {
      // Apply the security baseline to every route.
      source: "/:path*",
      headers: securityHeaders,
    },
    {
      source: "/sw.js",
      headers: [
        { key: "Content-Type", value: "application/javascript; charset=utf-8" },
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        { key: "Service-Worker-Allowed", value: "/" },
      ],
    },
  ],
};

export default nextConfig;
