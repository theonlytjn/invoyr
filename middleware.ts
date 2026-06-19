import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const APP_DOMAIN = "app.invoyr.io";
const MARKETING_DOMAINS = new Set(["invoyr.io", "www.invoyr.io"]);

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") ?? "";
  const pathname = request.nextUrl.pathname;

  // ── Subdomain routing (production only) ──────────────────────────
  if (MARKETING_DOMAINS.has(hostname)) {
    // Only / and /pricing belong on the marketing domain
    const isMarketingPath = pathname === "/" || pathname.startsWith("/pricing");
    if (!isMarketingPath) {
      return NextResponse.redirect(
        `https://${APP_DOMAIN}${pathname}${request.nextUrl.search}`
      );
    }
    return NextResponse.next();
  }

  if (hostname === APP_DOMAIN) {
    // Root → dashboard (auth guard below will redirect to /login if not signed in)
    if (pathname === "/") {
      return NextResponse.redirect(`https://${APP_DOMAIN}/dashboard`);
    }
    // /pricing belongs on marketing site
    if (pathname.startsWith("/pricing")) {
      return NextResponse.redirect(`https://invoyr.io${pathname}`);
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

  const isAppRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/invoices") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings");
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password");
  const isOnboarding = pathname.startsWith("/onboarding");

  if (!user && isAppRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
