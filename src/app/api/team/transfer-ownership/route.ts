import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireOrg } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ member_id: z.number().int().positive() });

export async function POST(req: Request) {
  const org = await requireOrg();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: currentMember } = await supabase
    .from("org_members")
    .select("id, role")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single();

  if (!currentMember || currentMember.role !== "owner") {
    return NextResponse.json({ error: "Only the owner can transfer ownership" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { member_id } = parsed.data;

  const { data: target } = await supabase
    .from("org_members")
    .select("id, role")
    .eq("id", member_id)
    .eq("org_id", org.id)
    .single();

  if (!target) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (target.role === "owner") return NextResponse.json({ error: "Already owner" }, { status: 400 });

  await supabase
    .from("org_members")
    .update({ role: "owner" })
    .eq("id", member_id);

  await supabase
    .from("org_members")
    .update({ role: "admin" })
    .eq("id", currentMember.id);

  await supabase.from("audit_logs").insert({
    org_id: org.id,
    action: "org.ownership_transferred",
    entity_type: "organisation",
    entity_id: org.id,
    meta: { from_member_id: currentMember.id, to_member_id: member_id },
  });

  return NextResponse.json({ ok: true });
}
