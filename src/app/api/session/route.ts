import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrg } from "@/lib/auth";
import { MARKETING_ORIGINS } from "@/config/domains";

/**
 * Who is signed in, for the marketing header. Called cross-origin from
 * invoyr.io with credentials, so CORS is opened to the marketing origins only.
 * Returns display details and nothing else.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let body:
    | { signedIn: false }
    | { signedIn: true; name: string | null; email: string | null; orgName: string | null; orgLogoUrl: string | null } = {
    signedIn: false,
  };

  if (user) {
    // The active org (the one they last worked in), so the avatar shows that company's logo.
    const [{ data: profile }, org] = await Promise.all([
      supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle(),
      getOrg(),
    ]);
    body = {
      signedIn: true,
      name: profile?.first_name ?? null,
      email: user.email ?? null,
      orgName: org?.name ?? null,
      orgLogoUrl: org?.logo_url ?? null,
    };
  }

  const res = NextResponse.json(body);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Vary", "Origin, Cookie");

  const origin = req.headers.get("origin");
  if (origin && MARKETING_ORIGINS.includes(origin)) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
  }
  return res;
}
