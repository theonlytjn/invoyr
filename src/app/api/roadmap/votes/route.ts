import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { apiError, serverError } from "@/lib/api/errors";
import { isJsonRequest, marketingPreflight, withMarketingCors } from "@/lib/api/cors";
import { rateLimit } from "@/lib/rate-limit";
import { voteSchema } from "@/lib/roadmap/schema";

const METHODS = "GET, POST";

export function OPTIONS(req: NextRequest) {
  return marketingPreflight(req, METHODS);
}

/** The signed-in visitor's own votes, so the page can show what they picked. */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return withMarketingCors(req, NextResponse.json({ signedIn: false, votes: [] }), METHODS);

  const { data, error } = await supabase
    .from("roadmap_votes")
    .select("item_id, importance, comment")
    .eq("user_id", user.id);
  if (error) return withMarketingCors(req, serverError("roadmap votes: list", error), METHODS);

  const res = NextResponse.json({ signedIn: true, votes: data ?? [] });
  res.headers.set("Cache-Control", "no-store");
  return withMarketingCors(req, res, METHODS);
}

/** Set, change or (with importance null) remove the visitor's vote on an item. */
export async function POST(req: NextRequest) {
  const respond = (res: NextResponse) => withMarketingCors(req, res, METHODS);
  if (!isJsonRequest(req)) return respond(apiError("Expected JSON", 415));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return respond(apiError("Sign in to vote", 401));

  const { success } = await rateLimit("roadmap-vote", user.id, 60, 60);
  if (!success) return respond(apiError("Too many requests. Try again in a minute.", 429));

  const parsed = voteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return respond(apiError("Invalid vote", 400));
  const { itemId, importance, comment } = parsed.data;

  if (importance === null) {
    const { error } = await supabase.from("roadmap_votes").delete().eq("item_id", itemId).eq("user_id", user.id);
    if (error) return respond(serverError("roadmap votes: delete", error));
    return respond(NextResponse.json({ ok: true, vote: null }));
  }

  // RLS only accepts votes on published items, so an unknown or hidden item
  // fails here rather than needing a separate lookup.
  const { data, error } = await supabase
    .from("roadmap_votes")
    .upsert(
      {
        item_id: itemId,
        user_id: user.id,
        importance,
        // Leave an existing comment alone when the request doesn't mention one.
        ...(comment !== undefined ? { comment } : {}),
      },
      { onConflict: "item_id,user_id" },
    )
    .select("item_id, importance, comment")
    .single();

  if (error) {
    if (error.code === "42501") return respond(apiError("That item isn't open for votes", 404));
    return respond(serverError("roadmap votes: upsert", error));
  }
  return respond(NextResponse.json({ ok: true, vote: data }));
}
