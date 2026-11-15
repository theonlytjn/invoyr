import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError, serverError } from "@/lib/api/errors";
import { ideaUpdateSchema } from "@/lib/roadmap/schema";

type Ctx = { params: Promise<{ id: string }> };

/** Review an idea: mark reviewed or declined, merge into an item, add a note. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await getAdminUser())) return apiError("Forbidden", 403);
  const id = z.string().uuid().safeParse((await params).id);
  if (!id.success) return apiError("Not found", 404);

  const parsed = ideaUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError("Invalid update", 400);

  const update = { ...parsed.data };
  if (update.status === "merged" && !update.item_id) {
    return apiError("Choose the item to merge into", 400);
  }

  const { data, error } = await createServiceClient()
    .from("roadmap_ideas")
    .update(update)
    .eq("id", id.data)
    .select()
    .single();
  if (error) return serverError("admin roadmap: update idea", error);

  return NextResponse.json({ idea: data });
}
