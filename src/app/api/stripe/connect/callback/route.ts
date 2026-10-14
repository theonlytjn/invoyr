import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe/client";
import { requireOrgPermission } from "@/lib/permissions";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state"); // org_id
  const error = searchParams.get("error");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  if (error || !code || !state) {
    return NextResponse.redirect(
      `${appUrl}/settings/payments?connect=error`
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${appUrl}/login`);
  }

  // `state` is just the org id echoed back by Stripe, so it is attacker-controlled.
  // Without this check any signed-in user could attach their own Stripe account
  // to someone else's organisation and receive that business's invoice payments.
  if (!z.string().uuid().safeParse(state).success) {
    return NextResponse.redirect(`${appUrl}/settings/payments?connect=error`);
  }
  const denied = await requireOrgPermission(state, "manage_settings");
  if (denied) {
    return NextResponse.redirect(`${appUrl}/settings/payments?connect=error`);
  }

  let stripeAccountId: string;
  try {
    const response = await getStripe().oauth.token({
      grant_type: "authorization_code",
      code,
    });
    stripeAccountId = response.stripe_user_id!;
  } catch {
    return NextResponse.redirect(`${appUrl}/settings/payments?connect=error`);
  }

  const serviceClient = await createServiceClient();
  const { error: updateError } = await serviceClient
    .from("organisations")
    .update({ stripe_account_id: stripeAccountId })
    .eq("id", state);

  if (updateError) {
    console.error("[api] stripe connect callback: failed to store account:", updateError);
    return NextResponse.redirect(`${appUrl}/settings/payments?connect=error`);
  }

  await serviceClient.from("audit_logs").insert({
    org_id: state,
    action: "stripe.connected",
    entity_type: "organisation",
    entity_id: state,
    meta: { stripe_account_id: stripeAccountId },
  });

  return NextResponse.redirect(`${appUrl}/settings/payments?connect=success`);
}
