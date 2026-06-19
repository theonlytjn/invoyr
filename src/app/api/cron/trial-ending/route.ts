import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { TrialEndingEmail } from "@/emails/transactional/TrialEndingEmail";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const now = new Date();
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const { data: expiring } = await supabase
    .from("subscriptions")
    .select("org_id, trial_ends_at, organisations(name, email)")
    .eq("status", "trialing")
    .gte("trial_ends_at", now.toISOString())
    .lte("trial_ends_at", inThreeDays.toISOString());

  if (!expiring?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
  let sent = 0;

  await Promise.allSettled(
    expiring.map(async (row) => {
      const org = Array.isArray(row.organisations) ? row.organisations[0] : row.organisations;
      if (!org?.email) return;

      const { data: members } = await supabase
        .from("org_members")
        .select("user_id, profiles(first_name, email:id)")
        .eq("org_id", row.org_id)
        .eq("role", "owner")
        .limit(1);

      const owner = members?.[0];
      const profile = Array.isArray(owner?.profiles) ? owner.profiles[0] : owner?.profiles;

      const { data: authUser } = await supabase.auth.admin.getUserById(owner?.user_id ?? "");
      const toEmail = authUser?.user?.email;
      if (!toEmail) return;

      const firstName = (profile as { first_name?: string } | null)?.first_name ?? org.name;

      await sendTransactionalEmail({
        orgId: row.org_id,
        to: toEmail,
        subject: "Your Invoyr trial ends soon",
        templateName: "trial-ending",
        react: createElement(TrialEndingEmail, {
          firstName,
          ctaUrl: `${appUrl}/settings/billing`,
        }),
      });
      sent++;
    })
  );

  return NextResponse.json({ sent });
}
