import { NextRequest, NextResponse } from "next/server";
import { createElement } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { sendTransactionalEmail } from "@/lib/resend/send-transactional-email";
import { SignupFollowUpEmail } from "@/emails/transactional/SignupFollowUpEmail";
import { SIGNUP_FOLLOW_UP_COPY } from "@/config/email-copy";
import { BRAND } from "@/config/brand";

/**
 * The founder's thank-you note, run daily at 10:00 UTC.
 *
 * Picks up everyone whose profile was created between 72 and 96 hours ago, so
 * each signup falls into exactly one daily run, about three days in and at a
 * civilised hour. Only account owners are written to: teammates who joined
 * through an invite didn't sign up. The note is sent once per address, ever,
 * keyed on email_logs.
 */

const TEMPLATE = "signup-follow-up";
const HOUR = 60 * 60 * 1000;

/** "Tony from Invoyr <invoices@invoyr.io>", whatever form the env var takes. */
function founderFrom(): string | undefined {
  const configured = process.env.RESEND_FROM_EMAIL;
  if (!configured) return undefined;
  const address = configured.match(/<([^>]+)>/)?.[1] ?? configured.trim();
  return `${SIGNUP_FOLLOW_UP_COPY.signerName.split(" ")[0]} from ${BRAND.name} <${address}>`;
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = Date.now();
  const delay = SIGNUP_FOLLOW_UP_COPY.delayHours * HOUR;

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
    const { data: membership } = await supabase
      .from("org_members")
      .select("org_id")
      .eq("user_id", profile.id)
      .eq("role", "owner")
      .limit(1)
      .maybeSingle();
    if (!membership?.org_id) return false;

    const { data: authUser } = await supabase.auth.admin.getUserById(profile.id);
    const email = authUser?.user?.email;
    if (!email) return false;

    const { data: prior, error: priorError } = await supabase
      .from("email_logs")
      .select("id")
      .eq("template_name", TEMPLATE)
      .eq("to_email", email)
      .limit(1);
    // A failed lookup must not disable the guard and double-send.
    if (priorError || prior?.length) return false;

    const result = await sendTransactionalEmail({
      orgId: membership.org_id,
      to: email,
      subject: SIGNUP_FOLLOW_UP_COPY.subject,
      templateName: TEMPLATE,
      fromEmail: founderFrom(),
      replyTo: BRAND.supportEmail,
      skipOrgSmtp: true,
      react: createElement(SignupFollowUpEmail, {
        firstName: profile.first_name?.trim() || null,
        roadmapUrl: BRAND.roadmapUrl,
      }),
    });
    return result.ok;
  }

  const results = await Promise.allSettled((profiles ?? []).map(sendTo));
  const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;

  return NextResponse.json({ sent, considered: profiles?.length ?? 0 });
}
