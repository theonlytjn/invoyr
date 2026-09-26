import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { TrialEndingEmail } from "@/emails/transactional/TrialEndingEmail";
import { TRIAL_EMAIL_COPY } from "@/config/email-copy";
import { trialDaysRemaining } from "@/lib/trial";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();

  const now = new Date();
  const maxDays = Math.max(...TRIAL_EMAIL_COPY.reminderDays);
  const horizon = new Date(now.getTime() + maxDays * 24 * 60 * 60 * 1000);

  const { data: expiring } = await supabase
    .from("subscriptions")
    .select("org_id, trial_ends_at, stripe_subscription_id, organisations(name, email, logo_url, accent_color)")
    .eq("status", "trialing")
    .gte("trial_ends_at", now.toISOString())
    .lte("trial_ends_at", horizon.toISOString());

  if (!expiring?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";
  let sent = 0;

  await Promise.allSettled(
    expiring.map(async (row) => {
      const org = Array.isArray(row.organisations) ? row.organisations[0] : row.organisations;

      // This runs daily, so without pinning to the reminder days it would email
      // on every one of the final days. Two notices: three days out, and the
      // day before.
      const daysLeft = trialDaysRemaining("trialing", row.trial_ends_at);
      if (daysLeft === null) return;
      if (!(TRIAL_EMAIL_COPY.reminderDays as readonly number[]).includes(daysLeft)) return;

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

      // Guards against a same-day re-run (a manual trigger, or a retry) sending
      // the notice twice.
      const since = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
      const { data: alreadySent, error: logLookupError } = await supabase
        .from("email_logs")
        .select("id")
        .eq("org_id", row.org_id)
        .eq("template_name", "trial-ending")
        .gte("created_at", since)
        .limit(1);

      // A failed lookup must not silently disable the guard and double-email.
      if (logLookupError) {
        console.error("trial-ending dedupe lookup failed", { orgId: row.org_id, error: logLookupError.message });
        return;
      }

      if (alreadySent?.length) return;

      const endsOn = new Date(row.trial_ends_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
      });

      const result = await sendTransactionalEmail({
        orgId: row.org_id,
        to: toEmail,
        subject: TRIAL_EMAIL_COPY.subject(daysLeft),
        templateName: "trial-ending",
        react: createElement(TrialEndingEmail, {
          firstName,
          ctaUrl: `${appUrl}/settings/billing`,
          daysLeft,
          endsOn,
          willBeCharged: Boolean(row.stripe_subscription_id),
          orgName: org?.name ?? "Invoyr",
          logoUrl: org?.logo_url ? org.logo_url.split("?")[0] : null,
          accentColor: org?.accent_color ?? "#111827",
        }),
      });

      if (result?.ok !== false) sent++;
    })
  );

  return NextResponse.json({ sent });
}
