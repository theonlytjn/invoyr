import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { apiError, serverError } from "@/lib/api/errors";
import { isJsonRequest, marketingPreflight, withMarketingCors } from "@/lib/api/cors";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { ideaSchema } from "@/lib/roadmap/schema";

export function OPTIONS(req: NextRequest) {
  return marketingPreflight(req, "POST");
}

/**
 * A visitor suggests an idea. No sign-in needed: everyone leaves a name and
 * email so we can follow up. It goes to the admin inbox (/admin/roadmap) for
 * review and is never shown publicly as submitted.
 */
export async function POST(req: NextRequest) {
  const respond = (res: NextResponse) => withMarketingCors(req, res, "POST");
  if (!isJsonRequest(req)) return respond(apiError("Expected JSON", 415));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const ip = clientIp(req);

  // Signed-in visitors are limited per account; guests per IP, and more tightly.
  const { success } = user
    ? await rateLimit("roadmap-idea", user.id, 10, 3600)
    : await rateLimit("roadmap-idea-guest", ip, 5, 3600);
  if (!success) return respond(apiError("That's a lot of ideas. Try again later.", 429));

  const parsed = ideaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return respond(apiError(parsed.error.issues[0]?.message ?? "Invalid idea", 400));
  }
  const { name, email, title, details, captchaToken } = parsed.data;

  // Guests prove they're human; a signed-in session already has.
  if (!user && !(await verifyTurnstile(captchaToken, ip))) {
    return respond(apiError("Captcha check failed. Please try again.", 400));
  }

  const row = { title, details, submitter_name: name, submitter_email: email, user_id: user?.id ?? null };
  // Signed in: insert as the user, so RLS applies. Guest: there's no user to
  // insert as, so the service role writes the row (all fields validated above).
  const { error } = user
    ? await supabase.from("roadmap_ideas").insert(row)
    : await createServiceClient().from("roadmap_ideas").insert(row);
  if (error) return respond(serverError("roadmap ideas: insert", error));

  return respond(NextResponse.json({ ok: true }, { status: 201 }));
}
