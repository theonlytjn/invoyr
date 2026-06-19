import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { requireOrg } from "@/lib/auth";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();
  if (!org.stripe_account_id) {
    return NextResponse.json({ error: "No connected account" }, { status: 400 });
  }

  try {
    await getStripe().oauth.deauthorize({
      client_id: process.env.STRIPE_CONNECT_CLIENT_ID!,
      stripe_user_id: org.stripe_account_id,
    });
  } catch {
    // Proceed even if deauth fails (account may already be disconnected on Stripe side)
  }

  const serviceClient = await createServiceClient();
  await serviceClient
    .from("organisations")
    .update({ stripe_account_id: null })
    .eq("id", org.id);

  await serviceClient.from("audit_logs").insert({
    org_id: org.id,
    action: "stripe.disconnected",
    entity_type: "organisation",
    entity_id: org.id,
    meta: {},
  });

  return NextResponse.json({ ok: true });
}
