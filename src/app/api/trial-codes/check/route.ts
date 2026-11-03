import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { checkTrialCode, trialCodeSchema } from "@/lib/trial-codes";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({ code: trialCodeSchema });

/** Onboarding asks this before checkout so a mistyped code is caught early. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Stops anyone guessing codes by brute force.
  const { success } = await rateLimit("trial-code", `${user.id}:${clientIp(req)}`, 10, 300);
  if (!success) return NextResponse.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ valid: false, error: "That code isn't valid." });

  const trialDays = await checkTrialCode(parsed.data.code).catch(() => null);
  if (!trialDays) {
    return NextResponse.json({ valid: false, error: "That code isn't valid or has been used up." });
  }
  return NextResponse.json({ valid: true, code: parsed.data.code, trialDays });
}
