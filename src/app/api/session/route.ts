import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MARKETING_ORIGINS } from "@/config/domains";

/**
 * Who is signed in, for the marketing header. Called cross-origin from
 * invoyr.io with credentials, so CORS is opened to the marketing origins only.
 * Returns display details and nothing else.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let body: { signedIn: false } | { signedIn: true; name: string | null; email: string | null } = {
    signedIn: false,
  };

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name")
      .eq("id", user.id)
      .maybeSingle();
    body = { signedIn: true, name: profile?.first_name ?? null, email: user.email ?? null };
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
