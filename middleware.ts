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

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  // ── Subdomain routing (production only) ──────────────────────────
  if (MARKETING_DOMAINS.has(hostname)) {
    // Marketing pages stay on invoyr.io; everything else goes to the app.
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
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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
    return supabaseResponse;
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

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Skip Next internals, static assets, and generated metadata routes
    // (opengraph-image / twitter-image) so social crawlers get the image
    // directly on invoyr.io instead of being redirected to the app domain.
    "/((?!_next/static|_next/image|favicon.ico|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
