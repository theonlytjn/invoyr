import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { requireOrgPermission } from "@/lib/permissions";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();
  const denied = await requireOrgPermission(org.id, "manage_settings");
  if (denied) return NextResponse.json({ error: denied.error }, { status: denied.status });
  const clientId = process.env.STRIPE_CONNECT_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json({ error: "Stripe Connect not configured" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
  const redirectUri = `${appUrl}/api/stripe/connect/callback`;

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    scope: "read_write",
    redirect_uri: redirectUri,
    state: org.id,
    "suggested_capabilities[]": "transfers",
  });

  return NextResponse.redirect(
    `https://connect.stripe.com/oauth/authorize?${params.toString()}`
  );
}
