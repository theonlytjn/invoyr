import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { syncContactToAudience } from "@/lib/resend/sync-audience";

/**
 * Applies the opt-out. Shared by the link in the email (GET) and the one-click
 * header that mail clients POST to (RFC 8058) — the same URL must answer both.
 */
async function unsubscribe(token: string | null) {
  if (!token) return "missing";

  const supabase = await createServiceClient();

  const { data: prefs } = await supabase
    .from("email_preferences")
    .select("id, user_id, unsubscribed_at")
    .eq("unsubscribe_token", token)
    .single();

  if (!prefs) return "not_found";
  if (prefs.unsubscribed_at) return "already";

  await supabase
    .from("email_preferences")
    .update({ marketing_consent: false, unsubscribed_at: new Date().toISOString() })
    .eq("id", prefs.id);

  const { data: user } = await supabase.auth.admin.getUserById(prefs.user_id);
  if (user.user?.email) {
    await syncContactToAudience({
      email: user.user.email,
      userId: prefs.user_id,
      subscribe: false,
    });
  }

  return "success";
}

export async function GET(req: NextRequest) {
  const status = await unsubscribe(req.nextUrl.searchParams.get("token"));
  if (status === "missing") return NextResponse.redirect(new URL("/", req.url));
  return NextResponse.redirect(new URL(`/unsubscribed?status=${status}`, req.url));
}

/** One-click unsubscribe from the mail client. No redirect, just 200. */
export async function POST(req: NextRequest) {
  const status = await unsubscribe(req.nextUrl.searchParams.get("token"));
  return NextResponse.json({ status }, { status: status === "not_found" ? 404 : 200 });
}
