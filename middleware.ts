import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_DOMAIN = "app.invoyr.io";
const MARKETING_DOMAINS = new Set(["invoyr.io", "www.invoyr.io"]);

// Public marketing pages. These live on invoyr.io; everything else (the app,
// auth, admin, etc.) lives on app.invoyr.io.
const MARKETING_PATHS = [
  "/features",
  "/use-cases",
  "/pricing",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

function isMarketingPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return MARKETING_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// Content-Security-Policy. Enforced value is set on the REQUEST header (Next.js
// reads it to add the per-request nonce to its own scripts); the RESPONSE gets
// it as Report-Only for now, so violations are reported but nothing is blocked
// while we validate against the live flows (PayPal SDK, Turnstile, Supabase,
// HugeIcons CSS). Flip to enforcing (`Content-Security-Policy`) once the report
// is clean.
function buildCsp(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://www.paypal.com https://www.paypalobjects.com https://challenges.cloudflare.com`,
    "style-src 'self' 'unsafe-inline' https://cdn.hugeicons.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://cdn.hugeicons.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com https://www.paypal.com https://api.paypal.com https://api-m.paypal.com https://api.sandbox.paypal.com https://api-m.sandbox.paypal.com",
    "frame-src 'self' https://challenges.cloudflare.com https://www.paypal.com https://*.paypal.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "base-uri 'self'",
    "form-action 'self' https://www.paypal.com",
    "frame-ancestors 'self'",
    "object-src 'none'",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  // Per-request nonce + CSP. The enforced CSP goes on the request headers so
  // Next.js nonces its own inline scripts; responses get it Report-Only.
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const applyCsp = (res: NextResponse) => {
    res.headers.set("Content-Security-Policy-Report-Only", csp);
    return res;
  };
  const nextWithNonce = () => {
    const headers = new Headers(request.headers);
    headers.set("x-nonce", nonce);
    headers.set("Content-Security-Policy", csp);
    return NextResponse.next({ request: { headers } });
  };

  // ── Subdomain routing (production only) ──────────────────────────
  if (MARKETING_DOMAINS.has(hostname)) {
    // Marketing pages stay on invoyr.io; everything else goes to the app.
    // Kept static (no per-request nonce) so the marketing site stays cacheable;
    // it carries the static partial CSP from next.config. The nonce-based CSP is
    // scoped to the app responses below (already dynamic, and the real XSS target).
    if (isMarketingPath(pathname)) {
      return NextResponse.next();
    }
    return NextResponse.redirect(
      `https://${APP_DOMAIN}${pathname}${request.nextUrl.search}`
    );
  }

  if (hostname === APP_DOMAIN) {
    // App root → dashboard (auth guard below redirects to /login if signed out)
    if (pathname === "/") {
      return NextResponse.redirect(`https://${APP_DOMAIN}/dashboard`);
    }
    // Marketing pages belong on the marketing domain.
    if (isMarketingPath(pathname)) {
      return NextResponse.redirect(
        `https://invoyr.io${pathname}${request.nextUrl.search}`
      );
    }
  }

  // ── Auth guards (app.invoyr.io and localhost) ─────────────────────
  let supabaseResponse = nextWithNonce();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieEncoding: "raw",
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Rebuild via nextWithNonce so the refreshed cookies AND the nonce
          // header propagate to the render.
          supabaseResponse = nextWithNonce();
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — IMPORTANT: do not remove
  const { data: { user } } = await supabase.auth.getUser();

  const ADMIN_EMAIL = "tony@theonlytjn.com";
  const isAdminRoute = pathname.startsWith("/admin");
  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/estimates") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/org");
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");
  const isOnboarding = pathname.startsWith("/onboarding");

  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return applyCsp(supabaseResponse);
  }

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const dest = user.email === ADMIN_EMAIL ? "/admin" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  if (user && isAppRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarding_completed && !isOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    const isBillingPage = pathname.startsWith("/settings/billing");

    if (profile?.onboarding_completed && !isBillingPage) {
      const { data: member } = await supabase
        .from("org_members")
        .select("org_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (member?.org_id) {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("org_id", member.org_id)
          .single();

        if (sub?.status === "canceled") {
          return NextResponse.redirect(
            new URL("/settings/billing?reason=subscription_required", request.url)
          );
        }
      }
    }
  }

  return applyCsp(supabaseResponse);
}

export const config = {
  matcher: [
    // Skip Next internals, static assets, and generated metadata routes
    // (opengraph-image / twitter-image) so social crawlers get the image
    // directly on invoyr.io instead of being redirected to the app domain.
    "/((?!_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
