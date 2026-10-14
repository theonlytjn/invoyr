import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MARKETING_ORIGINS } from "@/config/domains";

/**
 * Sign out from the marketing site. The session cookie belongs to the app
 * domain, so the marketing pages cannot clear it themselves; they post here.
 * The Origin check stops other sites from signing people out.
 */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  const allowed = origin === req.nextUrl.origin || (origin !== null && MARKETING_ORIGINS.includes(origin));
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) console.error("[api] sign-out failed:", error);

  return NextResponse.redirect(new URL("/", origin!), { status: 303 });
}
