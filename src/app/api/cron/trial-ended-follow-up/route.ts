import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { FOUNDER_NOTE_COPY } from "@/config/email-copy";
import { sendFounderNote } from "@/lib/founder-notes/send";

/**
 * The founder's "sorry to see you go" note, run daily at 10:15 UTC.
 *
 * Goes to the owner of every organisation whose trial ended 72–96 hours ago
 * without a paid subscription, asking what got in the way and pointing to the
 * roadmap's suggest-an-idea form. Skipped when:
 *  - the subscription is active (they paid) or past_due (they tried to pay and
 *    the card failed; the payment-failed email handles that), or
 *  - the organisation has complimentary access.
 * Once per address, ever.
 */

const HOUR = 60 * 60 * 1000;

/** Trial over, and no attempt to pay. */
const LAPSED = ["trialing", "canceled", "incomplete"];

type Row = {
  org_id: string;
  organisations: { comp_plan: string | null } | { comp_plan: string | null }[] | null;
};

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = Date.now();
  const delay = FOUNDER_NOTE_COPY.delayHours * HOUR;

  const { data, error } = await supabase
    .from("subscriptions")
    .select("org_id, organisations(comp_plan)")
    .in("status", LAPSED)
    .gte("trial_ends_at", new Date(now - delay - 24 * HOUR).toISOString())
    .lt("trial_ends_at", new Date(now - delay).toISOString());

  if (error) {
    console.error("trial-ended follow-up: subscription lookup failed", error.message);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  async function sendTo(row: Row) {
    const org = Array.isArray(row.organisations) ? row.organisations[0] : row.organisations;
    if (org?.comp_plan) return false;

    const { data: owner } = await supabase
      .from("org_members")
      .select("user_id, profiles(first_name)")
      .eq("org_id", row.org_id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    if (!owner?.user_id) return false;

    const { data: authUser } = await supabase.auth.admin.getUserById(owner.user_id);
    const email = authUser?.user?.email;
    if (!email) return false;

    const profile = Array.isArray(owner.profiles) ? owner.profiles[0] : owner.profiles;
    return sendFounderNote(supabase, {
      note: "trialEnded",
      to: email,
      firstName: (profile as { first_name?: string | null } | null)?.first_name,
      orgId: row.org_id,
      userId: owner.user_id,
    });
  }

  const rows = (data ?? []) as unknown as Row[];
  const results = await Promise.allSettled(rows.map(sendTo));
  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;

  return NextResponse.json({ sent, considered: rows.length });
}
