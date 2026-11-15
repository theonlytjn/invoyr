import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, serverError } from "@/lib/api/errors";
import { isJsonRequest, marketingPreflight, withMarketingCors } from "@/lib/api/cors";
import { rateLimit } from "@/lib/rate-limit";
import { ideaSchema } from "@/lib/roadmap/schema";

export function OPTIONS(req: NextRequest) {
  return marketingPreflight(req, "POST");
}

/**
 * A signed-in visitor suggests an idea. It goes to the admin inbox
 * (/admin/roadmap) for review and is never shown publicly as submitted.
 */
export async function POST(req: NextRequest) {
  const respond = (res: NextResponse) => withMarketingCors(req, res, "POST");
  if (!isJsonRequest(req)) return respond(apiError("Expected JSON", 415));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return respond(apiError("Sign in to suggest an idea", 401));

  const { success } = await rateLimit("roadmap-idea", user.id, 10, 3600);
  if (!success) return respond(apiError("That's a lot of ideas. Try again later.", 429));

  const parsed = ideaSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return respond(apiError(parsed.error.issues[0]?.message ?? "Invalid idea", 400));
  }

  const { error } = await supabase
    .from("roadmap_ideas")
    .insert({ user_id: user.id, title: parsed.data.title, details: parsed.data.details });
  if (error) return respond(serverError("roadmap ideas: insert", error));

  return respond(NextResponse.json({ ok: true }, { status: 201 }));
}
