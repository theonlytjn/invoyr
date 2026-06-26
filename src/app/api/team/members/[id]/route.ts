import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg, requireUser } from "@/lib/auth";
import { z } from "zod";

interface Params { params: Promise<{ id: string }> }

const roleSchema = z.object({ role: z.enum(["admin", "member"]) });

export async function PATCH(req: Request, { params }: Params) {
  const { id } = await params;
  const org = await requireOrg();
  const user = await requireUser();
  const supabase = await createClient();

  const { data: actor } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (actor?.role !== "owner") {
    return NextResponse.json({ error: "Only owners can change roles." }, { status: 403 });
  }

  const body = await req.json();
  const parsed = roleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { error } = await supabase
    .from("org_members")
    .update({ role: parsed.data.role })
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const org = await requireOrg();
  const user = await requireUser();
  const supabase = await createClient();

  const { data: actor } = await supabase
    .from("org_members")
    .select("role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  // Target member
  const { data: target } = await supabase
    .from("org_members")
    .select("user_id, role")
    .eq("id", id)
    .eq("org_id", org.id)
    .single();

  if (!target) return NextResponse.json({ error: "Member not found." }, { status: 404 });

  // Can remove self, or owner/admin can remove others (not other owners)
  const isSelf = target.user_id === user.id;
  const canRemove = isSelf || (["owner", "admin"].includes(actor?.role ?? "") && target.role !== "owner");

  if (!canRemove) return NextResponse.json({ error: "Cannot remove this member." }, { status: 403 });

  const { error } = await supabase
    .from("org_members")
    .delete()
    .eq("id", id)
    .eq("org_id", org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
