import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { syncContactToAudience } from "@/lib/resend/sync-audience";
import { WelcomeEmail } from "@/emails/transactional/WelcomeEmail";
import { TRIAL_DAYS } from "@/config/plans";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let orgId: string | undefined;
  let plan: string | undefined;
  try {
    const body = await req.json();
    orgId = typeof body.orgId === "string" ? body.orgId : undefined;
    plan = typeof body.plan === "string" ? body.plan : "starter";
  } catch {
    // orgId/plan optional
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  const firstName = profile?.first_name ?? user.email?.split("@")[0] ?? "there";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  const serviceClient = await createServiceClient();

  if (orgId) {
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await serviceClient.from("subscriptions").upsert(
      {
        org_id: orgId,
        plan: plan ?? "starter",
        status: "trialing",
        trial_ends_at: trialEndsAt,
      },
      { onConflict: "org_id" }
    );

    await serviceClient.from("audit_logs").insert({
      org_id: orgId,
      action: "subscription.trial_started",
      entity_type: "subscription",
      entity_id: orgId,
      meta: { plan, trial_ends_at: trialEndsAt },
    });
  }

  await serviceClient.from("email_preferences").upsert(
    {
      user_id: user.id,
      marketing_consent: true,
    },
    { onConflict: "user_id" }
  );

  await syncContactToAudience({
    email: user.email!,
    firstName,
    userId: user.id,
    subscribe: true,
  });

  if (orgId) {
    await sendTransactionalEmail({
      orgId,
      to: user.email!,
      subject: "Welcome to Invoyr",
      templateName: "welcome",
      react: createElement(WelcomeEmail, {
        firstName,
        ctaUrl: `${appUrl}/dashboard`,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
