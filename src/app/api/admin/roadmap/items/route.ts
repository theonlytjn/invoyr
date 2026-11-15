import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError, serverError } from "@/lib/api/errors";
import { itemSchema, slugify } from "@/lib/roadmap/schema";

/** Create a roadmap item. Optionally links the idea it came from. */
export async function POST(req: NextRequest) {
  if (!(await getAdminUser())) return apiError("Forbidden", 403);

  const body = await req.json().catch(() => null);
  const parsed = itemSchema.safeParse(body);
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid item", 400);

  const fromIdeaId = typeof body?.fromIdeaId === "string" ? body.fromIdeaId : null;
  const { slug, ...fields } = parsed.data;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("roadmap_items")
    .insert({ ...fields, slug: slug || slugify(fields.title) })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return apiError("An item with that slug already exists", 409);
    return serverError("admin roadmap: create item", error);
  }

  if (fromIdeaId) {
    await supabase
      .from("roadmap_ideas")
      .update({ status: "published", item_id: data.id })
      .eq("id", fromIdeaId);
  }

  revalidatePath("/roadmap");
  return NextResponse.json({ item: data }, { status: 201 });
}
