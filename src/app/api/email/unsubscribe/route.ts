import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { syncContactToAudience } from "@/lib/resend/sync-audience";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const supabase = await createServiceClient();

  const { data: prefs } = await supabase
    .from("email_preferences")
    .select("id, user_id, unsubscribed_at")
    .eq("unsubscribe_token", token)
    .single();

  if (!prefs) {
    return NextResponse.redirect(new URL("/unsubscribed?status=not_found", req.url));
  }

  if (prefs.unsubscribed_at) {
    return NextResponse.redirect(new URL("/unsubscribed?status=already", req.url));
  }

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

  return NextResponse.redirect(new URL("/unsubscribed?status=success", req.url));
}
