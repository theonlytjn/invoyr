import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { FOUNDER_NOTE_COPY } from "@/config/email-copy";
import { sendFounderNote } from "@/lib/founder-notes/send";

/**
 * The founder's thank-you note, run daily at 10:00 UTC.
 *
 * Picks up everyone whose profile was created between 72 and 96 hours ago, so
 * each signup falls into exactly one daily run, about three days in and at a
 * civilised hour. That includes people who signed up but never finished
 * onboarding (no organisation yet), whose feedback is the most useful of all.
 * Teammates who joined through an invite are skipped: they didn't sign up.
 */

const HOUR = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = Date.now();
  const delay = FOUNDER_NOTE_COPY.delayHours * HOUR;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, first_name")
    .gte("created_at", new Date(now - delay - 24 * HOUR).toISOString())
    .lt("created_at", new Date(now - delay).toISOString());

  if (error) {
    console.error("signup follow-up: profile lookup failed", error.message);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }

  async function sendTo(profile: { id: string; first_name: string | null }) {
    const { data: memberships, error: memberError } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", profile.id);
    if (memberError) return false;

    const owned = memberships?.find((m) => m.role === "owner");
    // In an organisation but not its owner: an invited teammate.
    if (!owned && memberships?.length) return false;

    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
    const email = authUser?.user?.email;
    if (!email) return false;

    return sendFounderNote(supabase, {
      note: "signup",
      to: email,
      firstName: profile.first_name,
      orgId: owned?.org_id ?? null,
      userId: profile.id,
    });
  }

  const results = await Promise.allSettled((profiles ?? []).map(sendTo));
  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;

  return NextResponse.json({ sent, considered: profiles?.length ?? 0 });
}
