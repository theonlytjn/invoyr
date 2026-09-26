import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { TrialEndingEmail } from "@/emails/transactional/TrialEndingEmail";
import { TRIAL_EMAIL_COPY, type TrialEmailState } from "@/config/email-copy";
import { trialDaysRemaining } from "@/lib/trial";

/**
 * The trial lifecycle mailer, run daily.
 *
 * Two passes: reminders while a trial is still running (3 days out and the day
 * before), and a single notice once a trial has ended without a paid
 * subscription behind it — which, since there is no free tier, means the
 * account is now locked to the billing page.
 */

type OrgRow = {
  name?: string | null;
  logo_url?: string | null;
  accent_color?: string | null;
};

type SubscriptionRow = {
  org_id: string;
  trial_ends_at: string;
  stripe_subscription_id: string | null;
  organisations: OrgRow | OrgRow[] | null;
};

const SELECT =
  "org_id, trial_ends_at, stripe_subscription_id, organisations(name, logo_url, accent_color)";

/** Statuses meaning the trial ended without becoming a paying subscription. */
const UNCONVERTED = ["trialing", "canceled", "past_due", "incomplete"];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const now = new Date();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.invoyr.io";

  const maxDays = Math.max(...TRIAL_EMAIL_COPY.reminderDays);
  const horizon = new Date(now.getTime() + maxDays * 86_400_000);
  // Only trials that ended in the last day, so a long-lapsed account isn't
  // mailed every morning forever.
  const endedSince = new Date(now.getTime() - 86_400_000);

  const [{ data: ending }, { data: ended }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(SELECT)
      .eq("status", "trialing")
      .gte("trial_ends_at", now.toISOString())
      .lte("trial_ends_at", horizon.toISOString()),
    supabase
      .from("subscriptions")
      .select(SELECT)
      .in("status", UNCONVERTED)
      .gte("trial_ends_at", endedSince.toISOString())
      .lt("trial_ends_at", now.toISOString()),
  ]);

  /** The owner's address, or null when there isn't one to write to. */
  async function ownerOf(orgId: string) {
    const { data: members } = await supabase
      .from("org_members")
      .select("user_id, profiles(first_name)")
      .eq("org_id", orgId)
      .eq("role", "owner")
      .limit(1);

    const owner = members?.[0];
    if (!owner?.user_id) return null;

    const profile = Array.isArray(owner.profiles) ? owner.profiles[0] : owner.profiles;
    const { data: authUser } = await supabase.auth.admin.getUserById(owner.user_id);
    const email = authUser?.user?.email;
    if (!email) return null;

    return { email, firstName: (profile as { first_name?: string } | null)?.first_name };
  }

  /** True when this template already went out for the org in the last 20 hours. */
  async function alreadySent(orgId: string, templateName: string) {
    const since = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("email_logs")
      .select("id")
      .eq("org_id", orgId)
      .eq("template_name", templateName)
      .gte("created_at", since)
      .limit(1);

    // A failed lookup must not silently disable the guard and double-email, so
    // it counts as "already sent" and the org waits for the next run.
    if (error) {
      console.error("trial mailer dedupe lookup failed", { orgId, templateName, error: error.message });
      return true;
    }
    return Boolean(data?.length);
  }

  async function send(row: SubscriptionRow, state: TrialEmailState) {
    const templateName = state === "ended" ? "trial-ended" : "trial-ending";
    const daysLeft = trialDaysRemaining("trialing", row.trial_ends_at) ?? 0;

    // Without pinning to the reminder days, a daily run would email on every
    // one of the final days.
    if (state === "ending" && !(TRIAL_EMAIL_COPY.reminderDays as readonly number[]).includes(daysLeft)) {
      return false;
    }
    if (await alreadySent(row.org_id, templateName)) return false;

    const owner = await ownerOf(row.org_id);
    if (!owner) return false;

    const org = Array.isArray(row.organisations) ? row.organisations[0] : row.organisations;
    const context = {
      state,
      daysLeft,
      endsOn: new Date(row.trial_ends_at).toLocaleDateString("en-GB", { day: "numeric", month: "long" }),
      willBeCharged: Boolean(row.stripe_subscription_id),
    };

    const result = await sendTransactionalEmail({
      orgId: row.org_id,
      to: owner.email,
      subject: TRIAL_EMAIL_COPY.subject(context),
      templateName,
      react: createElement(TrialEndingEmail, {
        ...context,
        firstName: owner.firstName ?? org?.name ?? "there",
        ctaUrl: `${appUrl}/settings/billing`,
        orgName: org?.name ?? "Invoyr",
        logoUrl: org?.logo_url ? org.logo_url.split("?")[0] : null,
        accentColor: org?.accent_color ?? "#111827",
      }),
    });

    return result?.ok !== false;
  }

  const results = await Promise.allSettled([
    ...((ending ?? []) as unknown as SubscriptionRow[]).map((row) => send(row, "ending")),
    ...((ended ?? []) as unknown as SubscriptionRow[]).map((row) => send(row, "ended")),
  ]);

  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;

  return NextResponse.json({ sent });
}
