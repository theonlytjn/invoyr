import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { roleCanDo } from "@/lib/permissions";

/**
 * Saving email settings used to be a PATCH straight from the browser to
 * Supabase. Two problems with that:
 *
 * 1. It is a cross-origin request to a third-party domain, which mobile
 *    networks and Safari privacy features drop more readily than a same-origin
 *    one — the failure surfaced as a bare "TypeError: Load failed".
 * 2. `orgs_update` requires the owner, but `manage_settings` allows admins too,
 *    and an UPDATE filtered out by RLS returns no error — so an admin saw
 *    "Saved!" having saved nothing.
 *
 * Both go away here: same origin, Zod-validated, permission checked explicitly,
 * and the write is made with the service client once that check passes.
 */
const REMINDER_DAYS = [3, 7, 14, 21, 30] as const;
const PRE_DUE_DAYS = [1, 3, 7] as const;

const schema = z.object({
  fromEmail: z.string().trim().email().max(200).or(z.literal("")).nullable(),
  reminderDays: z.array(z.number().int()).max(REMINDER_DAYS.length),
  preDueDays: z.array(z.number().int()).max(PRE_DUE_DAYS.length),
});

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await requireOrg();

  const { data: membership } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!membership?.role || !roleCanDo(membership.role, "manage_settings")) {
    return NextResponse.json({ error: "You don't have permission to change these settings." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid settings" },
      { status: 400 }
    );
  }

  // Only the days the UI actually offers, so a crafted request can't schedule
  // reminders on arbitrary days.
  const reminderDays = parsed.data.reminderDays.filter((d) =>
    (REMINDER_DAYS as readonly number[]).includes(d)
  );
  const preDueDays = parsed.data.preDueDays.filter((d) =>
    (PRE_DUE_DAYS as readonly number[]).includes(d)
  );

  const service = createServiceClient();
  const { data, error } = await service
    .from("organisations")
    .update({
      from_email: parsed.data.fromEmail || null,
      reminder_days: reminderDays.length ? reminderDays : [...REMINDER_DAYS],
      payment_reminder_days: preDueDays,
    })
    .eq("id", org.id)
    .select("id");

  if (error || !data?.length) {
    return NextResponse.json(
      { error: error?.message ?? "Settings were not saved. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
