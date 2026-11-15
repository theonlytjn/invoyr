import { NextResponse, type NextRequest } from "next/server";
import { MARKETING_ORIGINS } from "@/config/domains";

/**
 * CORS for app routes the marketing site (invoyr.io) calls with the visitor's
 * app.invoyr.io session cookie. Opened to the marketing origins only.
 */
export function withMarketingCors<T extends NextResponse>(req: NextRequest, res: T, methods = "GET"): T {
  res.headers.set("Vary", "Origin, Cookie");
  const origin = req.headers.get("origin");
  if (origin && MARKETING_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Access-Control-Allow-Methods", `${methods}, OPTIONS`);
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    res.headers.set("Access-Control-Max-Age", "600");
  }
  return res;
}

/** Answers the preflight a JSON POST from the marketing site triggers. */
export function marketingPreflight(req: NextRequest, methods: string) {
  return withMarketingCors(req, new NextResponse(null, { status: 204 }), methods);
}

/**
 * Cross-site form posts can't set a JSON content type without a preflight, and
 * the preflight only passes for the marketing origins, so requiring JSON is
 * what stops another site posting on a signed-in visitor's behalf.
 */
export function isJsonRequest(req: NextRequest): boolean {
  return (req.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}
