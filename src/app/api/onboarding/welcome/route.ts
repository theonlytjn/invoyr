import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { syncContactToAudience } from "@/lib/resend/sync-audience";
import { WelcomeEmail } from "@/emails/transactional/WelcomeEmail";
import { apiError } from "@/lib/api/errors";

const bodySchema = z.object({
  orgId: z.string().uuid().optional(),
  plan: z.enum(["starter", "business", "pro"]).default("starter"),
  // GDPR: marketing email requires explicit opt-in; default to no consent.
  marketingConsent: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return apiError("Invalid input", 400);
  const orgId = parsed.data.orgId;
  const plan = parsed.data.plan;
  const marketingConsent = parsed.data.marketingConsent;

  // Authorization: only act on an org the caller actually belongs to. Without
  // this, an authenticated user could write audit_logs / trigger email against
  // an arbitrary org id via the service client below. Membership is checked
  // through the RLS-bound user client (org_members is org-scoped).
  if (orgId) {
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!membership) return apiError("Forbidden", 403);
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
    await serviceClient.from("audit_logs").insert({
      org_id: orgId,
      action: "org.created",
      entity_type: "organisation",
      entity_id: orgId,
      meta: { plan },
    });
  }

  await serviceClient.from("email_preferences").upsert(
    {
      user_id: user.id,
      marketing_consent: marketingConsent,
      ...(marketingConsent ? {} : { unsubscribed_at: new Date().toISOString() }),
    },
    { onConflict: "user_id" }
  );

  // Only add the contact to the marketing audience when they've opted in.
  if (marketingConsent) {
    await syncContactToAudience({
      email: user.email!,
      firstName,
      userId: user.id,
      subscribe: true,
    });
  }

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
