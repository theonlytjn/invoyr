import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminUser } from "@/lib/admin";
import { createServiceClient } from "@/lib/supabase/server";
import { apiError, serverError } from "@/lib/api/errors";
import { itemUpdateSchema } from "@/lib/roadmap/schema";

type Ctx = { params: Promise<{ id: string }> };
const idSchema = z.string().uuid();

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await getAdminUser())) return apiError("Forbidden", 403);
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return apiError("Not found", 404);

  const parsed = itemUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? "Invalid item", 400);

  const update = { ...parsed.data };
  // Moving to Launched stamps today's date unless one was given.
  if (update.status === "launched" && update.launched_at === undefined) {
    const { data: current } = await createServiceClient()
      .from("roadmap_items")
      .select("launched_at")
      .eq("id", id.data)
      .single();
    if (!current?.launched_at) update.launched_at = new Date().toISOString().slice(0, 10);
  }

  const { data, error } = await createServiceClient()
    .from("roadmap_items")
    .update(update)
    .eq("id", id.data)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") return apiError("An item with that slug already exists", 409);
    if (error.code === "PGRST116") return apiError("Not found", 404);
    return serverError("admin roadmap: update item", error);
  }

  revalidatePath("/roadmap");
  return NextResponse.json({ item: data });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await getAdminUser())) return apiError("Forbidden", 403);
  const id = idSchema.safeParse((await params).id);
  if (!id.success) return apiError("Not found", 404);

  const { error } = await createServiceClient().from("roadmap_items").delete().eq("id", id.data);
  if (error) return serverError("admin roadmap: delete item", error);

  revalidatePath("/roadmap");
  return NextResponse.json({ ok: true });
}
